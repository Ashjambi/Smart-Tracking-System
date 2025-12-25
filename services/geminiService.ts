
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
 * الحصول على مفتاح API الحالي من البيئة المحقونة
 */
const getApiKey = (): string | undefined => {
    const key = process.env.API_KEY;
    if (key && key !== 'undefined' && key !== 'null' && key !== '' && key !== '${API_KEY}') {
        return key;
    }
    return undefined;
};

/**
 * التحقق من جاهزية النظام الذكي للعمل
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

    // تحقق برمجي قطعي من وجود الصورة (Hard Logic)
    const photoExists = !!baggageContext.baggagePhotoUrl && baggageContext.baggagePhotoUrl.length > 20;
    
    // سياق محدود جداً لمنع المساعد من رؤية الروابط الأصلية لكي لا يقوم بطباعتها
    const filteredContext = {
        pir: baggageContext.pir,
        status: baggageContext.status,
        location: baggageContext.currentLocation,
        next_step: baggageContext.nextStep,
        photo_status: photoExists ? "EXISTS_ON_SGS_DASHBOARD" : "NOT_UPLOADED_YET"
    };

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // تعليمات نظام استراتيجية صارمة جداً (Anti-Hallucination Protocol)
        const systemInstruction = `
        ROLE: SGS Strategic Virtual Assistant. 
        PURPOSE: Provide status updates based ONLY on the provided JSON data.

        DATA_SOURCE: ${JSON.stringify(filteredContext)}

        STRICT CONSTRAINTS (VIOLATION = SYSTEM FAILURE):
        1. PHOTO POLICY: 
           - If photo_status is "NOT_UPLOADED_YET", you MUST explicitly apologize and say "No photo is available in the system." 
           - NEVER say "view the photo below" or "it is available" if photo_status is NOT_UPLOADED_YET.
           - If photo_status is "EXISTS_ON_SGS_DASHBOARD", tell the user "The photo is available in the tracking panel below." NEVER provide a direct URL.
        2. NO LINKS: Never output "http", "https", "www", or ".com". Link generation is strictly forbidden.
        3. NO INVENTIONS: Do not invent names, contact numbers, or flight details not present in DATA_SOURCE.
        4. BREVITY: Maximum 20 words.
        5. TONE: Corporate, dry, helpful but strictly factual.
        6. LANGUAGE: Answer in ${lang === 'ar' ? 'Arabic' : 'English'}.
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
                temperature: 0.0, // صفر عشوائية لضمان الحقيقة الرقمية
                topP: 0.1,
                topK: 1
            }
        });

        let reply = (response.text || "").trim();
        
        // بروتوكول حماية أخير (Hard-stop Filter)
        const bannedPhrases = ["http", "unsplash", "nimb.ws", "cloudinary", "imgur"];
        const hallucinationDetected = bannedPhrases.some(p => reply.toLowerCase().includes(p));
        
        if (hallucinationDetected || (!photoExists && (reply.includes("نعم") || reply.includes("متاحة")) && (reply.includes("صورة") || reply.includes("الصورة")))) {
            return lang === 'ar' 
                ? "عذراً، هذه المعلومة غير متوفرة في سجلاتنا الرسمية حالياً." 
                : "Apologies, this information is not available in our official records.";
        }

        return reply;
    } catch (err: any) {
        console.error("Gemini Critical Error:", err);
        return lang === 'ar' ? `النظام الذكي تحت التحديث.` : `Smart system is updating.`;
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
        const prompt = `Match description "${description}" against ${JSON.stringify(bagsList)}. Return ONLY a JSON array of PIRs.`;

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
            parts: [{ text: "Extract features. JSON only." }, ...imageParts] 
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
                    { text: "Security Match: YES or NO?" },
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
        ? `أهلاً بك. تم العثور على سجل الحقيبة (${record.PIR}). كيف يمكن لمساعد SGS الذكي خدمتك؟`
        : `Welcome. Your baggage record (${record.PIR}) was found. How can I help you today?`;
    return { chatResponse, baggageInfo };
};
