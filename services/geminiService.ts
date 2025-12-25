
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // استخدام Gemini 3 Pro لضمان أعلى مستويات المنطق ومنع الهلوسة
    const model = 'gemini-3-pro-preview';
    
    // فحص تقني صارم جداً للروابط قبل إرسالها للذكاء الاصطناعي
    const hasFront = !!baggageContext.baggagePhotoUrl && baggageContext.baggagePhotoUrl.startsWith('http') && baggageContext.baggagePhotoUrl.length > 20;
    const hasBack = !!baggageContext.baggagePhotoUrl_2 && baggageContext.baggagePhotoUrl_2.startsWith('http') && baggageContext.baggagePhotoUrl_2.length > 20;
    const totalPhotos = (hasFront ? 1 : 0) + (hasBack ? 1 : 0);

    const systemInstruction = `
    IDENTITY: You are the SGS Smart Auditor. You are NOT a helpful concierge, you are a TECHNICAL LOG AUDITOR.
    
    DATA SOURCE (TRUTH): ${JSON.stringify(baggageContext)}
    
    VERIFIED_IMAGE_STATUS (MANDATORY):
    - Photo_Front_In_Database: ${hasFront ? 'YES (Link Active)' : 'NO (Null/Empty)'}
    - Photo_Back_In_Database: ${hasBack ? 'YES (Link Active)' : 'NO (Null/Empty)'}
    - TOTAL_PHOTOS_AVAILABLE: ${totalPhotos}
    
    CRITICAL SECURITY RULES:
    1. IF TOTAL_PHOTOS_AVAILABLE IS 0: You are FORBIDDEN from saying "نعم" (Yes) or "متوفر" (Available) regarding photos. You MUST apologize and state that no images are registered in the current record.
    2. TRUTH OVER COURTESY: It is better to say "I don't know" or "Data not available" than to provide a false confirmation. False confirmation is a SECURITY BREACH.
    3. NO HALLUCINATION: If the data says location is "LHR", do not say "المطار" generally, say "LHR". If no location is provided, say "Location not registered".
    4. NO LINKS: NEVER generate or mention URLs/links.
    5. OWNERSHIP: You cannot confirm ownership. Only the "Confirm Ownership" button in the UI can do that.
    6. LENGTH: Keep responses under 25 words.
    
    RESPONSE PROTOCOL FOR PHOTO QUESTIONS:
    - User: "هل يوجد صورة؟" (Is there a photo?)
    - If TOTAL_PHOTOS_AVAILABLE = 0 -> "نعتذر، لا تتوفر صور ملتقطة لهذه الحقيبة في سجلاتنا الرسمية حالياً."
    - If TOTAL_PHOTOS_AVAILABLE = 1 -> "نعم، تتوفر صورة واحدة للحقيبة من زاوية واحدة."
    - If TOTAL_PHOTOS_AVAILABLE = 2 -> "نعم، تتوفر صورتان للحقيبة (توثيق مزدوج) في النظام."
    `;

    const contents = conversation.map(m => ({
        role: m.sender === MessageSender.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    try {
        const response = await ai.models.generateContent({ 
            model, 
            contents, 
            config: { 
                systemInstruction,
                temperature: 0.0, // قتل الإبداع لضمان الالتزام بالنص
                thinkingConfig: { thinkingBudget: 2000 } // إجبار النموذج على تحليل البيانات قبل الرد
            } 
        });
        
        return response.text ?? (lang === 'ar' ? "لا توجد بيانات متاحة." : "No data available.");
    } catch (err) {
        console.error("Gemini AI Core Error:", err);
        return lang === 'ar' ? "عفواً، واجهت مشكلة في الوصول للسجلات." : "Error accessing records.";
    }
};

export const findPotentialMatchesByDescription = async (
    description: string,
    bagsToFilter: BaggageRecord[],
    imageUrl?: string,
    lang: 'ar' | 'en' = 'ar'
): Promise<BaggageRecord[]> => {
    if (bagsToFilter.length === 0) return [];
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const bagsList = bagsToFilter.map(b => ({ pir: b.PIR, features: b.AiFeatures }));
    const prompt = `SGS Baggage Search Protocol:
    1. Analyze description: "${description}"
    2. List of warehouse bags: ${JSON.stringify(bagsList)}
    3. Identify PIRs with >90% confidence. Return ONLY a JSON array.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", temperature: 0.0 }
        });
        const matchingPirs: string[] = JSON.parse(cleanJsonResponse(response.text || '[]'));
        return bagsToFilter.filter(b => matchingPirs.includes(b.PIR));
    } catch { return []; }
};

export const analyzeFoundBaggagePhoto = async (imageUrls: string[]): Promise<{ 
    name?: string, 
    description: string,
    features: AiFeatures 
}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview'; 
    try {
        const imageParts = await Promise.all(imageUrls.map(async (url) => {
            const { base64, mimeType } = await imageToBase64(url);
            return { inlineData: { data: base64, mimeType } };
        }));

        const response = await ai.models.generateContent({
            model,
            contents: [{ 
                parts: [
                    { text: "Analyze these photos of the SAME baggage for Saudi Ground Services (SGS). Extract visual details and return ONLY a JSON object: { \"name\": \"Optional Passenger Name\", \"description\": \"summary\", \"features\": { \"brand\": \"string\", \"color\": \"string\", \"size\": \"Small|Medium|Large|Extra Large\", \"type\": \"string\", \"distinctiveMarks\": \"string\" } }." }, 
                    ...imageParts
                ] 
            }],
            config: { responseMimeType: "application/json", temperature: 0.1 }
        });
        const result = JSON.parse(cleanJsonResponse(response.text || '{}'));
        return result;
    } catch (error) { 
        console.error("Gemini Photo Analysis Error:", error);
        throw new Error("Analysis failed"); 
    }
};

export const getInitialBotMessage = (record: BaggageRecord, lang: 'ar' | 'en' = 'ar'): { chatResponse: string; baggageInfo: BaggageInfo } => {
    const baggageInfo = recordToBaggageInfo(record);
    const chatResponse = lang === 'ar' 
        ? `أهلاً بك في SGS. تم تحديد موقع حقيبتك (${record.PIR}). تفاصيل الحالة متاحة بالأسفل.`
        : `Welcome to SGS. Bag (${record.PIR}) located. Details below.`;
    return { chatResponse, baggageInfo };
};

export const compareBaggageImages = async (pImg: string, sImg: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const [p64, s64] = await Promise.all([imageToBase64(pImg), imageToBase64(sImg)]);
    const response = await ai.models.generateContent({
        model,
        contents: [{ 
            parts: [
                { text: "SGS Security: Compare these 2 bags. Is it a match? Return MATCH or NO_MATCH plus reason." },
                { inlineData: { data: p64.base64, mimeType: p64.mimeType } },
                { inlineData: { data: s64.base64, mimeType: s64.mimeType } }
            ] 
        }]
    });
    return response.text ?? "NO_MATCH";
};
