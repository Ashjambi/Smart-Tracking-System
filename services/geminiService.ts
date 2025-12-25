
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
 * الحصول على مفتاح API الحالي من البيئة أو الذاكرة
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
        
        // تعليمات صارمة جداً لمنع الهلوسة
        const systemInstruction = `
        ROLE: SGS Strategic Assistant for Saudi Ground Services.
        STRICT RULES:
        1. Respond ONLY based on the provided JSON context. 
        2. NEVER make up URLs, links, or contact info. 
        3. Do NOT say a photo exists unless 'baggagePhotoUrl' or 'passengerPhotoUrl' in the context is a valid link (not empty).
        4. If the user asks for information NOT in the context (like a phone number or specific person), apologize politely and say you don't have that information.
        5. Keep responses brief (max 25 words), professional, and in ${lang === 'ar' ? 'Arabic' : 'English'}.
        6. If the context is empty or null, state that you are still searching for the data.

        DATA CONTEXT: ${JSON.stringify(baggageContext)}
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
                temperature: 0.1, // تقليل العشوائية إلى أدنى حد لمنع التخريف
                topP: 0.1
            }
        });

        return response.text || (lang === 'ar' ? "عذراً، لم أتمكن من معالجة الرد حالياً." : "Sorry, I couldn't process the response.");
    } catch (err: any) {
        console.error("Gemini Error:", err);
        return lang === 'ar' ? `النظام الذكي غير متاح حالياً: ${err.message}` : `Smart system unavailable: ${err.message}`;
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
        const prompt = `Task: Match description "${description}" from this list: ${JSON.stringify(bagsList)}. 
        Rule: If no strong match, return an empty array []. 
        Output: ONLY a JSON array of PIR strings.`;

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
            parts: [{ text: "Analyze baggage visually. JSON output only. If passenger name on tag is visible, extract it to 'name'." }, ...imageParts] 
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
                    { text: "Strict Security Verification: Are these two bags the same? Compare visual details only. Start with MATCH: YES or MATCH: NO." },
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
        ? `نظام SGS الذكي يرحب بكم. تم العثور على سجل الحقيبة (${record.PIR}). كيف يمكنني خدمتك بناءً على هذه البيانات؟`
        : `SGS Smart System welcomes you. Baggage record (${record.PIR}) located. How can I assist you with this data?`;
    return { chatResponse, baggageInfo };
};
