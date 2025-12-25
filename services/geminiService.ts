
import { GoogleGenAI, Type } from "@google/genai";
import { BaggageInfo, BaggageRecord, DataSourceMode, Message, MessageSender, AiFeatures } from '../types';
import { recordToBaggageInfo } from '../utils/baggageUtils';
import { findBaggageByQuery as findInWorldTracer } from './worldTracerService';
import { DATA_SOURCE_MODE } from '../constants';
import { imageToBase64 } from '../utils/imageUtils';

const cleanJsonResponse = (text: string): string => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * الوصول الآمن لمفتاح API
 * في بيئة المتصفح، إذا لم يتم حقن المفتاح أثناء البناء، سيعود undefined
 */
const getApiKey = (): string | undefined => {
    try {
        // نستخدم الوصول المباشر كما تنص التعليمات، والـ Polyfill في index.tsx سيمنع الانهيار
        const key = process.env.API_KEY;
        
        // التحقق مما إذا كان المفتاح صالحاً (ليس فارغاً أو نصاً افتراضياً)
        if (key && key !== 'undefined' && key !== 'null' && key.length > 10) {
            return key;
        } else {
            console.warn("⚠️ SGS Digital Hub: API_KEY is missing or invalid. Check Cloudflare Build Variables.");
        }
    } catch (e) {
        console.error("❌ Critical: process.env is not accessible.");
    }
    return undefined;
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
    
    if (!apiKey) {
        return lang === 'ar' 
            ? "تنبيه استراتيجي: مفتاح الـ API غير مُعرف في إعدادات Cloudflare. يرجى مراجعة اللوجات وإضافة API_KEY تحت تبويب Environment Variables." 
            : "Strategic Alert: API Key is not defined in Cloudflare settings. Please check Environment Variables.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `
        IDENTITY: SGS Smart Assistant for Saudi Ground Services.
        LANGUAGE: Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.
        CONTEXT: ${JSON.stringify(baggageContext)}
        RULES: Be brief (max 20 words), polite, and use context info only.
        `;

        const history = conversation.slice(0, -1).map(m => ({
            role: m.sender === MessageSender.USER ? 'user' : 'model',
            parts: [{ text: m.text || "" }]
        })).filter(h => h.parts[0].text !== "");

        if (history.length > 0 && history[0].role === 'model') history.shift();

        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { systemInstruction, temperature: 0.2 },
            history
        });

        const response = await chat.sendMessage({ message: conversation[conversation.length - 1].text });
        return response.text || "No response";
    } catch (err: any) {
        console.error("Gemini Error:", err);
        return lang === 'ar' ? `خطأ في الاتصال بالسحابة الذكية: ${err.message}` : `Cloud Connection Error: ${err.message}`;
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
        const prompt = `Match description "${description}" from: ${JSON.stringify(bagsList)}. Return ONLY a JSON array of PIR strings.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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
        model: 'gemini-3-flash-preview',
        contents: [{ 
            role: 'user',
            parts: [{ text: "Analyze baggage and return JSON structure." }, ...imageParts] 
        }],
        config: { responseMimeType: "application/json", temperature: 0.1 }
    });
    
    const textResponse = response.text;
    if (!textResponse) throw new Error("Empty response");
    return JSON.parse(cleanJsonResponse(textResponse));
};

export const getInitialBotMessage = (record: BaggageRecord, lang: 'ar' | 'en' = 'ar'): { chatResponse: string; baggageInfo: BaggageInfo } => {
    const baggageInfo = recordToBaggageInfo(record);
    const chatResponse = lang === 'ar' 
        ? `تم تحديد سجل الحقيبة (${record.PIR}). كيف يمكنني مساعدتكم بخصوص هذه الرحلة؟`
        : `Baggage record (${record.PIR}) located. How can I assist you further?`;
    return { chatResponse, baggageInfo };
};

export const compareBaggageImages = async (pImg: string, sImg: string) => {
    const apiKey = getApiKey();
    if (!apiKey) return "ERROR: API KEY MISSING";
    
    const ai = new GoogleGenAI({ apiKey });
    try {
        const [p64, s64] = await Promise.all([imageToBase64(pImg), imageToBase64(sImg)]);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ 
                role: 'user',
                parts: [
                    { text: "Compare these 2 bag images. Determine if they are the same bag." },
                    { inlineData: { data: p64.base64, mimeType: p64.mimeType } },
                    { inlineData: { data: s64.base64, mimeType: s64.mimeType } }
                ] 
            }],
            config: { temperature: 0 }
        });
        return response.text || "NO_MATCH";
    } catch { return "MATCH_SERVICE_UNAVAILABLE"; }
};
