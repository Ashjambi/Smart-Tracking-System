
import { GoogleGenAI, Type } from "@google/genai";
import { BaggageInfo, BaggageRecord, DataSourceMode, Message, MessageSender, AiFeatures } from '../types';
import { recordToBaggageInfo } from '../utils/baggageUtils';
import { findBaggageByQuery as findInWorldTracer } from './worldTracerService';
import { DATA_SOURCE_MODE } from '../constants';
import { imageToBase64 } from '../utils/imageUtils';

const cleanJsonResponse = (text: string): string => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
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
    // تشخيص دقيق لمفتاح الـ API
    const apiKey = process.env.API_KEY;
    const isKeyValid = apiKey && apiKey !== 'undefined' && apiKey !== 'null' && apiKey.length > 10;
    
    if (!isKeyValid) {
        console.error("Gemini Critical Error: API_KEY is missing, 'undefined' or too short in this environment.", { 
            keyExists: !!apiKey,
            keyValue: apiKey === 'undefined' ? 'string undefined' : 'other'
        });
        return lang === 'ar' 
            ? "خطأ: لم يتم العثور على مفتاح الوصول (API Key) في إعدادات Cloudflare." 
            : "Error: API Key not found in Cloudflare settings.";
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = 'gemini-3-flash-preview';

    // إعداد التعليمات البرمجية للنظام
    const systemInstruction = `
    IDENTITY: SGS Smart Assistant for Saudi Ground Services.
    LANGUAGE: Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.
    CONTEXT: ${JSON.stringify(baggageContext)}
    
    RULES:
    1. Only use info from CONTEXT.
    2. Be extremely brief (max 20 words).
    3. If status is "Delivered", be very polite and congratulate them.
    4. Do not mention technical IDs.
    `;

    try {
        // بناء التاريخ مع استبعاد الرسالة الأخيرة لاستخدامها كمدخل لـ sendMessage
        const history = conversation.slice(0, -1).map(m => ({
            role: m.sender === MessageSender.USER ? 'user' : 'model',
            parts: [{ text: m.text || "..." }]
        })).filter(h => h.parts[0].text !== "...");

        // تأمين تعاقب الأدوار: يجب أن يبدأ التاريخ دائماً بـ user
        if (history.length > 0 && history[0].role === 'model') {
            history.shift();
        }

        const chat = ai.chats.create({
            model: modelName,
            config: {
                systemInstruction,
                temperature: 0.2,
            },
            history: history
        });

        const lastMessage = conversation[conversation.length - 1];
        const response = await chat.sendMessage({ message: lastMessage.text });
        
        return response.text || (lang === 'ar' ? "لم أستطع معالجة طلبك حالياً." : "Could not process your request.");

    } catch (err: any) {
        console.error("Gemini Chat API Error Detailed:", err);
        // في حال فشل الاستجابة بسبب 403 (الصلاحيات)
        if (err.message?.includes("403")) {
            return lang === 'ar' ? "فشل التحقق من صلاحية مفتاح الـ API. يرجى مراجعة إعدادات الدفع." : "API Key permission failed. Please check billing.";
        }
        throw err;
    }
};

export const findPotentialMatchesByDescription = async (
    description: string,
    bagsToFilter: BaggageRecord[],
    imageUrl?: string,
    lang: 'ar' | 'en' = 'ar'
): Promise<BaggageRecord[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || bagsToFilter.length === 0) return [];
    
    const ai = new GoogleGenAI({ apiKey });
    const bagsList = bagsToFilter.map(b => ({ pir: b.PIR, features: b.AiFeatures }));
    const prompt = `Based on description "${description}", identify matching bags from: ${JSON.stringify(bagsList)}. Return ONLY a JSON array of PIR strings.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { 
                responseMimeType: "application/json", 
                temperature: 0.0,
            }
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
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey });
    try {
        const imageParts = await Promise.all(imageUrls.map(async (url) => {
            const { base64, mimeType } = await imageToBase64(url);
            return { inlineData: { data: base64, mimeType } };
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ 
                role: 'user',
                parts: [
                    { text: "Analyze baggage. Return JSON: { \"name\": \"string\", \"description\": \"string\", \"features\": { \"brand\": \"string\", \"color\": \"string\", \"size\": \"Small|Medium|Large|Extra Large\", \"type\": \"string\", \"distinctiveMarks\": \"string\" } }" }, 
                    ...imageParts
                ] 
            }],
            config: { 
                responseMimeType: "application/json", 
                temperature: 0.1,
            }
        });
        
        const textResponse = response.text;
        if (!textResponse) throw new Error("Empty response");
        return JSON.parse(cleanJsonResponse(textResponse));
    } catch (error) { 
        console.error("Photo Analysis Error:", error);
        throw new Error("Analysis failed"); 
    }
};

export const getInitialBotMessage = (record: BaggageRecord, lang: 'ar' | 'en' = 'ar'): { chatResponse: string; baggageInfo: BaggageInfo } => {
    const baggageInfo = recordToBaggageInfo(record);
    const chatResponse = lang === 'ar' 
        ? `تم تحديد سجل الحقيبة (${record.PIR}). كيف يمكنني مساعدتكم بخصوص هذه الرحلة؟`
        : `Baggage record (${record.PIR}) located. How can I assist you further?`;
    return { chatResponse, baggageInfo };
};

export const compareBaggageImages = async (pImg: string, sImg: string) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') return "ERROR: API KEY MISSING";
    
    const ai = new GoogleGenAI({ apiKey });
    try {
        const [p64, s64] = await Promise.all([imageToBase64(pImg), imageToBase64(sImg)]);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ 
                role: 'user',
                parts: [
                    { text: "Compare 2 bags. Is it a match? Return MATCH or NO_MATCH + reason." },
                    { inlineData: { data: p64.base64, mimeType: p64.mimeType } },
                    { inlineData: { data: s64.base64, mimeType: s64.mimeType } }
                ] 
            }],
            config: { temperature: 0 }
        });
        return response.text || "NO_MATCH";
    } catch { return "MATCH_SERVICE_UNAVAILABLE"; }
};
