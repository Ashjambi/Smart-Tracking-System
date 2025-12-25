
import { GoogleGenAI } from "@google/genai";
import { BaggageInfo, BaggageRecord, DataSourceMode, Message, MessageSender, AiFeatures } from '../types';
import { recordToBaggageInfo } from '../utils/baggageUtils';
import { findBaggageByQuery as findInWorldTracer } from './worldTracerService';
import { DATA_SOURCE_MODE } from '../constants';
import { imageToBase64 } from '../utils/imageUtils';

const MODEL_NAME = 'gemini-3-flash-preview';

const cleanJsonResponse = (text: string): string => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * الحصول على مفتاح API الحالي من البيئة
 */
const getApiKey = (): string | undefined => {
    const key = process.env.API_KEY;
    if (key && key !== 'undefined' && key !== 'null' && key !== '' && key !== '${API_KEY}') {
        return key;
    }
    return undefined;
};

/**
 * التحقق من جاهزية النظام الذكي
 */
export const isAiReady = async (): Promise<boolean> => {
    const key = getApiKey();
    if (key) return true;
    
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
        return await (window as any).aistudio.hasSelectedApiKey();
    }
    
    return false;
};

export const findBaggageRecord = async (
    passengerIdentifier: string,
    idType: string,
    dataSource: DataSourceMode,
    baggageData: BaggageRecord[] | null
): Promise<{ record: BaggageRecord | null, error?: string }> => {
    let record: BaggageRecord | undefined | null = null;
    let error: string | undefined = undefined;

    if (dataSource === DATA_SOURCE_MODE.EXCEL) {
        if (!baggageData || baggageData.length === 0) {
            error = "عفواً، قاعدة بيانات الأمتعة غير متاحة حالياً.";
        } else {
            const normalizedId = passengerIdentifier.trim().toLowerCase();
            if (idType === 'pir' || idType === 'tag') {
                record = baggageData.find(r => r.PIR.toLowerCase() === normalizedId);
            } else if (idType === 'flight') {
                if (normalizedId.includes('|')) {
                    const [f, n] = normalizedId.split('|');
                    record = baggageData.find(r => r.Flight.toLowerCase() === f.trim() && r.PassengerName.toLowerCase().includes(n.trim()));
                } else {
                    record = baggageData.find(r => r.Flight.toLowerCase() === normalizedId);
                }
            } else if (idType === 'passengerName') {
                record = baggageData.find(r => r.PassengerName.toLowerCase().includes(normalizedId));
            }
        }
    } else {
        record = await findInWorldTracer(passengerIdentifier, idType);
    }

    if (!record && !error) {
        error = `عفواً، لم نجد بلاغاً مفعلاً للبيانات المذكورة.`;
    }

    return { record: record || null, error };
};

export const getAiChatResponse = async (
    conversation: Message[],
    baggageContext: BaggageInfo,
    lang: 'ar' | 'en' = 'ar'
): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API_KEY_MISSING");

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // تعليمات صارمة جداً (عسكرية) للقضاء على الهلوسة
        const systemInstruction = `
        ROLE: SGS Strategic Assistant for Saudi Ground Services.
        DATA: ${JSON.stringify(baggageContext)}

        STRICT PROHIBITIONS (Security Violations):
        1. NEVER generate or output a URL/link (No http://, No https://).
        2. NEVER mention "Unsplash" or any external image source.
        3. NEVER confirm a photo exists unless 'baggagePhotoUrl' in the context is explicitly provided and not empty.
        4. Even if a photo exists, DO NOT provide the link. Instead, say: "The photo is available for viewing in the status panel/timeline below."
        5. NEVER invent flight times, contact names, or phone numbers. If not in the context, say: "This information is not available in our current records."

        RESPONSE STYLE:
        - Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
        - Tone: Professional, Brief, SGS Corporate Style.
        - Max 20 words.
        `;

        const history = conversation.slice(0, -1).map(m => ({
            role: m.sender === MessageSender.USER ? 'user' : 'model',
            parts: [{ text: m.text || "" }]
        })).filter(h => h.parts[0].text !== "");

        if (history.length > 0 && history[0].role === 'model') history.shift();

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [
                ...history,
                { role: 'user', parts: [{ text: conversation[conversation.length - 1].text }] }
            ],
            config: { 
                systemInstruction, 
                temperature: 0.0, // منع أي تخريف أو إبداع (إجابة قطعية)
                topP: 0.1,
                topK: 1
            }
        });

        const reply = response.text || "";
        
        // فلتر أمان إضافي في الكود لمنع تسرب أي روابط لو نجح الذكاء في تجاوز التعليمات
        if (reply.includes('http') || reply.includes('unsplash')) {
            return lang === 'ar' 
                ? "عذراً، المعلومات المطلوبة غير متوفرة في سجلاتنا الرسمية حالياً." 
                : "Apologies, the requested information is not available in our official records.";
        }

        return reply;
    } catch (err: any) {
        console.error("Gemini Critical Error:", err);
        return lang === 'ar' ? `النظام الذكي تحت الصيانة حالياً.` : `Smart system is under maintenance.`;
    }
};

export const findPotentialMatchesByDescription = async (
    description: string,
    bagsToFilter: BaggageRecord[],
    imageUrl?: string,
    lang: 'ar' | 'en' = 'ar'
): Promise<BaggageRecord[]> => {
    const apiKey = getApiKey();
    if (!apiKey || bagsToFilter.length === 0) return [];
    
    try {
        const ai = new GoogleGenAI({ apiKey });
        const bagsList = bagsToFilter.map(b => ({ pir: b.PIR, features: b.AiFeatures }));
        const prompt = `Match description "${description}" from this list: ${JSON.stringify(bagsList)}. Return ONLY a JSON array of PIR strings. Empty [] if no match.`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", temperature: 0.0 }
        });
        const textResponse = response.text;
        if (!textResponse) return [];
        const matchingPirs: string[] = JSON.parse(cleanJsonResponse(textResponse));
        return bagsToFilter.filter(b => matchingPirs.includes(b.PIR));
    } catch { return []; }
};

export const analyzeFoundBaggagePhoto = async (imageUrls: string[]): Promise<{ 
    name?: string, 
    description: string,
    features: AiFeatures 
}> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey });
    const imageParts = await Promise.all(imageUrls.map(async (url) => {
        const { base64, mimeType } = await imageToBase64(url);
        return { inlineData: { data: base64, mimeType } };
    }));

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ 
            role: 'user',
            parts: [{ text: "Analyze baggage visually. JSON output only. Extract passenger name from tags if visible." }, ...imageParts] 
        }],
        config: { responseMimeType: "application/json", temperature: 0.0 }
    });
    
    const textResponse = response.text;
    if (!textResponse) throw new Error("Empty response");
    return JSON.parse(cleanJsonResponse(textResponse));
};

export const compareBaggageImages = async (pImg: string, sImg: string) => {
    const apiKey = getApiKey();
    if (!apiKey) return "ERROR: API KEY MISSING";
    
    const ai = new GoogleGenAI({ apiKey });
    try {
        const [p64, s64] = await Promise.all([imageToBase64(pImg), imageToBase64(sImg)]);
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ 
                role: 'user',
                parts: [
                    { text: "Security Analysis: Same bag? Answer strictly YES or NO followed by reasoning." },
                    { inlineData: { data: p64.base64, mimeType: p64.mimeType } },
                    { inlineData: { data: s64.base64, mimeType: s64.mimeType } }
                ] 
            }],
            config: { temperature: 0.0 }
        });
        return response.text || "NO_MATCH";
    } catch { return "MATCH_SERVICE_UNAVAILABLE"; }
};

export const getInitialBotMessage = (record: BaggageRecord, lang: 'ar' | 'en' = 'ar'): { chatResponse: string; baggageInfo: BaggageInfo } => {
    const baggageInfo = recordToBaggageInfo(record);
    const chatResponse = lang === 'ar' 
        ? `أهلاً بك. تم العثور على بيانات حقيبتك (${record.PIR}). كيف يمكن لمساعد SGS الذكي خدمتك اليوم؟`
        : `Welcome. Your baggage data (${record.PIR}) has been found. How can the SGS Smart Assistant help you today?`;
    return { chatResponse, baggageInfo };
};
