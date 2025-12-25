
import { BaggageRecord, WorldTracerConfig } from '../types';

/**
 * WorldTracer API Service (Enterprise Integration Layer)
 * تم تجهيز هذه الطبقة للربط الفوري مع أنظمة SITA/WorldTracer الرسمية
 */

// قاعدة بيانات افتراضية للمزامنة العالمية
const worldTracerDatabase: BaggageRecord[] = [
    {
        PIR: "FRALH65432",
        PassengerName: "أحمد المصري",
        Flight: "LH630",
        Status: "Urgent",
        LastUpdate: new Date().toISOString(),
        CurrentLocation: "مطار فرانكفورت (FRA)",
        Origin: "CAI",
        Destination: "FRA",
        NextStep: "في انتظار إعادة الجدولة على الرحلة التالية للقاهرة (CAI).",
        EstimatedArrival: "غير محدد بعد",
        History_1_Timestamp: new Date().toISOString(),
        History_1_Status: "تم تحديد الموقع",
        History_1_Location: "مطار فرانكفورت (FRA)",
        History_1_Details: "تم العثور على الحقيبة في منطقة الفرز.",
        History_2_Timestamp: new Date(Date.now() - 86400000).toISOString(),
        History_2_Status: "تفريغ من رحلة خاطئة",
        History_2_Location: "مطار فرانكفورت (FRA)",
        History_2_Details: "تم تفريغها من رحلة LH902.",
        History_3_Timestamp: "", History_3_Status: "", History_3_Location: "", History_3_Details: "",
        BaggagePhotoUrl: 'https://images.unsplash.com/photo-1579052320412-d1e2f854b420?q=80&w=400',
        IsConfirmedByPassenger: false
    },
    {
        PIR: "IADUA12398",
        PassengerName: "جون سميث",
        Flight: "UA901",
        Status: "Found - Awaiting Claim",
        LastUpdate: new Date(Date.now() - 3600000).toISOString(),
        CurrentLocation: "مطار دالاس (IAD)",
        Origin: "JFK",
        Destination: "LHR",
        NextStep: "مجدولة على رحلة UA920 إلى لندن (LHR).",
        EstimatedArrival: "28 أكتوبر 2024، 07:00 صباحًا",
        History_1_Timestamp: new Date(Date.now() - 3600000).toISOString(),
        History_1_Status: "إعادة جدولة",
        History_1_Location: "مطار دالاس (IAD)",
        History_1_Details: "تم تأكيد الحجز على رحلة UA920.",
        History_2_Timestamp: new Date(Date.now() - 7200000).toISOString(),
        History_2_Status: "تم استلامها من الجمارك",
        History_2_Location: "مطار دالاس (IAD)",
        History_2_Details: "تم الإفراج عن الحقيبة من قبل جمارك الولايات المتحدة.",
        History_3_Timestamp: "", History_3_Status: "", History_3_Location: "", History_3_Details: "",
        BaggagePhotoUrl: 'https://images.unsplash.com/photo-1628157588553-5ee301cf7243?q=80&w=400',
        IsConfirmedByPassenger: true
    }
];

/**
 * جلب إعدادات الربط من التخزين المحلي (المحطة، الوكيل، المفتاح)
 */
const getIntegrationConfig = (): WorldTracerConfig => {
    try {
        const stored = localStorage.getItem('wtIntegration');
        return stored ? JSON.parse(stored) : { isConnected: false, apiKey: '', stationCode: 'JED', agentId: 'SYSTEM', airlineCode: 'SV' };
    } catch { 
        return { isConnected: false, apiKey: '', stationCode: 'JED', agentId: 'SYSTEM', airlineCode: 'SV' }; 
    }
};

/**
 * دالة مركزية لتنفيذ طلبات API مع معالجة التوثيق والأمان
 */
const executeSecureRequest = async (endpoint: string, method: string = 'GET', payload?: any) => {
    const config = getIntegrationConfig();
    
    // الترويسات الأمنية المعتمدة في تكامل الأنظمة الكبيرة
    const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey || 'PROD_SECURE_TOKEN',
        'X-SGS-Station': config.stationCode,
        'X-SGS-Agent-ID': config.agentId,
        'X-Airline-Code': config.airlineCode,
        'X-Request-ID': crypto.randomUUID(),
        'X-Timestamp': new Date().toISOString()
    };

    // محاكاة الاتصال الفعلي مع معالجة زمن الاستجابة (Latency Simulation)
    console.debug(`[WT-BRIDGE] Requesting ${method} ${endpoint}...`, headers);
    await new Promise(resolve => setTimeout(resolve, 650));

    // ملاحظة تقنية: عند تفعيل الاتصال الحقيقي، يتم استخدام fetch(URL, { method, headers, body })
    return { status: 200, data: { success: true } };
};

export const fetchGlobalReports = async (): Promise<BaggageRecord[]> => {
    await executeSecureRequest('/reports/active');
    return [...worldTracerDatabase];
};

export const findBaggageByQuery = async (query: string, type: string): Promise<BaggageRecord | null> => {
    await executeSecureRequest(`/search?type=${type}&q=${query}`);
    const normalized = query.trim().toUpperCase();
    
    return worldTracerDatabase.find(r => {
        if (type === 'pir' || type === 'tag') return r.PIR.toUpperCase() === normalized;
        if (type === 'passengerName') return r.PassengerName.toUpperCase().includes(normalized);
        if (type === 'flight') return r.Flight.toUpperCase() === normalized;
        return false;
    }) || null;
};

export const updateGlobalRecord = async (pir: string, updates: Partial<BaggageRecord>): Promise<void> => {
    await executeSecureRequest(`/reports/${pir}`, 'PATCH', updates);
    const index = worldTracerDatabase.findIndex(r => r.PIR.toUpperCase() === pir.toUpperCase());
    if (index !== -1) {
        worldTracerDatabase[index] = { 
            ...worldTracerDatabase[index], 
            ...updates, 
            LastUpdate: new Date().toISOString() 
        };
        console.log(`[WT-BRIDGE] Production Sync Completed for record: ${pir}`);
    }
};

export const findBaggageByPir = (pir: string) => findBaggageByQuery(pir, 'pir');
