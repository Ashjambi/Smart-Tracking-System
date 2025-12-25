
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
    if (!process.env.API_KEY) {
        return lang === 'ar' ? "خطأ: مفتاح API غير متوفر." : "Error: API Key not available.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = 'gemini-3-flash-preview';
    
    // دمج الرسائل المتتالية من نفس الدور لضمان تعاقب الأدوار (User/Model)
    const formattedContents: any[] = [];
    conversation.forEach((msg) => {
        const role = msg.sender === MessageSender.USER ? 'user' : 'model';
        if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
            formattedContents[formattedContents.length - 1].parts[0].text += `\n${msg.text}`;
        } else {
            formattedContents.push({
                role,
                parts: [{ text: msg.text }]
            });
        }
    });

    // التأكد من أن المحادثة تبدأ دائماً من المستخدم
    if (formattedContents.length > 0 && formattedContents[0].role === 'model') {
        formattedContents.shift();
    }

    const systemInstruction = `
    IDENTITY: You are the SGS Smart Auditor for Saudi Ground Services.
    LANGUAGE: Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.
    CONTEXT: ${JSON.stringify(baggageContext)}
    
    RULES:
    1. Only provide info found in the CONTEXT.
    2. Keep responses very brief (max 30 words).
    3. If status is "Delivered", congratulate the passenger.
    4. Never reveal system internal IDs or URLs.
    `;

    try {
        const response = await ai.models.generateContent({ 
            model: modelName, 
            contents: formattedContents, 
            config: { 
                systemInstruction,
                temperature: 0.2,
                thinkingConfig: { thinkingBudget: 0 } // تعطيل التفكير لسرعة الاستجابة في Cloudflare
            } 
        });
        
        return response.text || (lang === 'ar' ? "لم أستطع الحصول على إجابة، يرجى المحاولة مرة أخرى." : "Could not get an answer, please try again.");
    } catch (err) {
        console.error("Gemini API Error:", err);
        throw err;
    }
};

export const findPotentialMatchesByDescription = async (
    description: string,
    bagsToFilter: BaggageRecord[],
    imageUrl?: string,
    lang: 'ar' | 'en' = 'ar'
): Promise<BaggageRecord[]> => {
    if (bagsToFilter.length === 0 || !process.env.API_KEY) return [];
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const bagsList = bagsToFilter.map(b => ({ pir: b.PIR, features: b.AiFeatures }));
    const prompt = `Match description "${description}" against: ${JSON.stringify(bagsList)}. Return ONLY a JSON array of matching PIRs.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: prompt }] }],
            config: { 
                responseMimeType: "application/json", 
                temperature: 0.0,
                thinkingConfig: { thinkingBudget: 0 }
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
    if (!process.env.API_KEY) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imageParts = await Promise.all(imageUrls.map(async (url) => {
            const { base64, mimeType } = await imageToBase64(url);
            return { inlineData: { data: base64, mimeType } };
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ 
                parts: [
                    { text: "Analyze baggage for SGS. Return JSON: { \"name\": \"string\", \"description\": \"string\", \"features\": { \"brand\": \"string\", \"color\": \"string\", \"size\": \"Small|Medium|Large|Extra Large\", \"type\": \"string\", \"distinctiveMarks\": \"string\" } }" }, 
                    ...imageParts
                ] 
            }],
            config: { 
                responseMimeType: "application/json", 
                temperature: 0.1,
                thinkingConfig: { thinkingBudget: 0 }
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
    if (!process.env.API_KEY) return "ERROR: API KEY MISSING";
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const [p64, s64] = await Promise.all([imageToBase64(pImg), imageToBase64(sImg)]);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ 
                parts: [
                    { text: "Compare 2 bags. Is it a match? Return MATCH or NO_MATCH + reason." },
                    { inlineData: { data: p64.base64, mimeType: p64.mimeType } },
                    { inlineData: { data: s64.base64, mimeType: s64.mimeType } }
                ] 
            }],
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        return response.text || "NO_MATCH";
    } catch { return "MATCH_SERVICE_UNAVAILABLE"; }
};
