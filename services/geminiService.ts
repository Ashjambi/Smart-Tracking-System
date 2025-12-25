
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

    // تحقق برمي صلب من وجود الصورة قبل تمرير السياق للذكاء الاصطناعي
    const hasBaggagePhoto = !!baggageContext.baggagePhotoUrl && baggageContext.baggagePhotoUrl.length > 10;
    
    // إنشاء سياق بيانات محدود لا يحتوي على الروابط الفعلية لمنع النموذج من طباعتها
    const safeContext = {
        pir: baggageContext.pir,
        status: baggageContext.status,
        location: baggageContext.currentLocation,
        nextStep: baggageContext.nextStep,
        estimatedArrival: baggageContext.estimatedArrival,
        hasPhotoInSystem: hasBaggagePhoto // نمرر فقط معلومة "نعم/لا"
    };

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const photoInstruction = hasBaggagePhoto 
            ? "A photo IS available in the system. If asked, tell the user it can be viewed in the status panel below. DO NOT provide any link."
            : "IMPORTANT: NO PHOTO IS AVAILABLE for this bag. If the user asks for a photo, you MUST apologize and state that no photo has been uploaded to the system yet.";

        const systemInstruction = `
        ROLE: SGS Strategic Assistant for Saudi Ground Services.
        STRICT PROTOCOL:
        1. Context Data: ${JSON.stringify(safeContext)}
        2. ${photoInstruction}
        3. NO URLs: Never output any text starting with http, https, or www.
        4. NO HALLUCINATION: Do not invent names, dates, or photos.
        5. If information is missing from the Context Data, say: "I apologize, this information is not available in our records."
        6. Language: ${lang === 'ar' ? 'Arabic' : 'English'}. Professional corporate tone. Max 20 words.
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
                temperature: 0.0, // صفر عشوائية لضمان الالتزام بالحقائق
                topP: 0.1,
                topK: 1
            }
        });

        const reply = response.text || "";
        
        // فلتر أمان نهائي لمنع أي روابط قد يحاول النموذج اختراعها
        if (reply.includes('http') || reply.includes('://') || reply.includes('unsplash')) {
            return lang === 'ar' 
                ? "عذراً، المعلومات المتعلقة بالصور غير متوفرة في سجلنا الرسمي حالياً." 
                : "Apologies, photo information is not available in our official records.";
        }

        return reply;
    } catch (err: any) {
        console.error("Gemini Critical Error:", err);
        return lang === 'ar' ? `النظام الذكي غير متاح حالياً.` : `Smart system is currently unavailable.`;
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
        const prompt = `Match description "${description}" from this list: ${JSON.stringify(bagsList)}. Return ONLY a JSON array of PIR strings.`;

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
            parts: [{ text: "Analyze baggage visually. JSON output only." }, ...imageParts] 
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
                    { text: "Security Analysis: Same bag? Strictly YES or NO." },
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
        ? `تم العثور على سجل الحقيبة (${record.PIR}). كيف يمكنني مساعدتك في تتبعها؟`
        : `Baggage record (${record.PIR}) found. How can I assist you with tracking?`;
    return { chatResponse, baggageInfo };
};
