
import React, { useContext, useMemo, useState, useEffect } from 'react';
import Modal from './common/Modal';
import Card from './common/Card';
import { BaggageReport, BaggageRecord, BaggageInfo } from '../types';
import { BaggageDataContext } from '../contexts/BaggageDataContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { recordToBaggageInfo } from '../utils/baggageUtils';
import BaggageTimeline from './BaggageTimeline';
import { findBaggageByPir } from '../services/worldTracerService';
import { UserIcon, PlaneIcon, TagIcon, CameraIcon, CheckCircleIcon } from './common/icons';
import { compareBaggageImages } from '../services/geminiService';

const InfoItem: React.FC<{ icon: React.ReactNode, label: string, value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start space-x-3 space-x-reverse">
        <div className="flex-shrink-0 text-gray-400 mt-1">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-300 font-medium">{label}</p>
            <p className="font-semibold text-white">{value}</p>
        </div>
    </div>
);

const DeliveryVerificationChecklist: React.FC<{
    onComplete: (details: { idType: string, idNumber: string, contentConfirmed: boolean }) => void;
    onCancel: () => void;
}> = ({ onComplete, onCancel }) => {
    const [checks, setChecks] = useState({
        idVerified: false,
        tagVerified: false,
        contentVerified: false
    });
    const [idInfo, setIdInfo] = useState({ type: 'Passport', number: '' });

    const isReady = checks.idVerified && checks.tagVerified && checks.contentVerified && idInfo.number.length > 5;

    return (
        <div className="bg-brand-gray-dark border border-brand-green/30 p-5 rounded-xl space-y-4 animate-in zoom-in-95 shadow-2xl relative z-20">
            <h4 className="text-brand-green font-bold text-sm border-b border-brand-green/20 pb-2 mb-4">بروتوكول التحقق الأمني للتسليم (SGS Standards)</h4>
            
            <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-brand-gray/50 rounded-lg cursor-pointer hover:bg-brand-gray transition-colors border border-transparent hover:border-brand-green/30">
                    <input type="checkbox" checked={checks.idVerified} onChange={e => setChecks({...checks, idVerified: e.target.checked})} className="w-5 h-5 accent-brand-green" />
                    <span className="text-xs text-gray-200">تم التحقق من أصل الهوية / جواز السفر للراكب</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-brand-gray/50 rounded-lg cursor-pointer hover:bg-brand-gray transition-colors border border-transparent hover:border-brand-green/30">
                    <input type="checkbox" checked={checks.tagVerified} onChange={e => setChecks({...checks, tagVerified: e.target.checked})} className="w-5 h-5 accent-brand-green" />
                    <span className="text-xs text-gray-200">تمت مطابقة رقم التاغ (Tag) أو إيصال البلاغ (PIR)</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-brand-gray/50 rounded-lg cursor-pointer hover:bg-brand-gray transition-colors border border-transparent hover:border-brand-green/30">
                    <input type="checkbox" checked={checks.contentVerified} onChange={e => setChecks({...checks, contentVerified: e.target.checked})} className="w-5 h-5 accent-brand-green" />
                    <span className="text-xs text-gray-200">سؤال الراكب عن محتويات داخلية وتمت المطابقة</span>
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-brand-gray-light">
                <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">نوع الهوية</label>
                    <select value={idInfo.type} onChange={e => setIdInfo({...idInfo, type: e.target.value})} className="w-full bg-brand-gray border border-brand-gray-light text-white text-xs rounded p-2 outline-none focus:ring-1 focus:ring-brand-green">
                        <option value="Passport">جواز سفر</option>
                        <option value="National ID">هوية وطنية</option>
                        <option value="Residence Permit">إقامة</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">رقم الهوية</label>
                    <input type="text" value={idInfo.number} onChange={e => setIdInfo({...idInfo, number: e.target.value})} placeholder="أدخل الرقم" className="w-full bg-brand-gray border border-brand-gray-light text-white text-xs rounded p-2 outline-none focus:ring-1 focus:ring-brand-green" />
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <button onClick={onCancel} className="flex-1 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">إلغاء</button>
                <button 
                    disabled={!isReady}
                    onClick={() => onComplete({ idType: idInfo.type, idNumber: idInfo.number, contentConfirmed: true })}
                    className="flex-[2] py-2 bg-brand-green text-brand-gray-dark font-black rounded text-xs hover:bg-brand-green-light transition-all disabled:opacity-30 shadow-lg shadow-brand-green/10"
                >
                    تأكيد التسليم الرسمي ✓
                </button>
            </div>
        </div>
    );
};

const VisualComparisonTool: React.FC<{ 
    passengerPhoto?: string, 
    staffPhoto1?: string, 
    staffPhoto2?: string, 
    onCompare: () => Promise<string>,
    isComparing: boolean,
    comparisonResult: string | null
}> = ({ passengerPhoto, staffPhoto1, staffPhoto2, onCompare, isComparing, comparisonResult }) => {
    return (
        <div className="bg-brand-gray-dark/50 p-4 rounded-xl border border-brand-gray-light mt-6">
            <h4 className="text-sm font-bold text-brand-green mb-4 flex items-center gap-2">
                <CameraIcon className="w-4 h-4" />
                المطابقة البصرية الذكية (SGS AI)
            </h4>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="space-y-1 text-center">
                    <p className="text-[8px] text-gray-400 uppercase font-bold">الراكب</p>
                    <div className="aspect-square bg-brand-gray rounded border border-brand-gray-light overflow-hidden">
                        {passengerPhoto ? <img src={passengerPhoto} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[8px] text-gray-600">N/A</div>}
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <p className="text-[8px] text-gray-400 uppercase font-bold">SGS - وجه 1</p>
                    <div className="aspect-square bg-brand-gray rounded border border-brand-gray-light overflow-hidden">
                        {staffPhoto1 ? <img src={staffPhoto1} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[8px] text-gray-600">N/A</div>}
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <p className="text-[8px] text-gray-400 uppercase font-bold">SGS - وجه 2</p>
                    <div className="aspect-square bg-brand-gray rounded border border-brand-gray-light overflow-hidden">
                        {staffPhoto2 ? <img src={staffPhoto2} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[8px] text-gray-600">N/A</div>}
                    </div>
                </div>
            </div>

            {passengerPhoto && (staffPhoto1 || staffPhoto2) && (
                <div className="space-y-3">
                    <button 
                        onClick={onCompare}
                        disabled={isComparing}
                        className="w-full py-2 bg-brand-green/20 text-brand-green border border-brand-green/30 rounded-lg text-xs font-bold hover:bg-brand-green/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isComparing ? 'جاري التحليل والمطابقة...' : '🤖 بدء المطابقة البصرية'}
                    </button>
                    {comparisonResult && (
                        <div className={`p-3 rounded-lg text-[10px] leading-relaxed border ${comparisonResult.includes('YES') ? 'bg-green-500/10 border-green-500/30 text-green-200' : 'bg-brand-gray border-brand-gray-light text-gray-300'}`}>
                            <div className="flex items-center gap-2 mb-1 font-bold">
                                {comparisonResult.includes('YES') ? <CheckCircleIcon className="w-3 h-3 text-green-400" /> : null}
                                نتيجة التحليل:
                            </div>
                            {comparisonResult}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface ReportDetailModalProps {
    report: BaggageReport;
    onClose: () => void;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
    const dataContext = useContext(BaggageDataContext);
    const settingsContext = useContext(SettingsContext);
    const [detailedRecord, setDetailedRecord] = useState<BaggageRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeliveryVerification, setShowDeliveryVerification] = useState(false);
    
    const [currentStatus, setCurrentStatus] = useState<BaggageReport['status']>(report.status);
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<string | null>(null);
    const [timelineInfo, setTimelineInfo] = useState<BaggageInfo | null>(null);

    const recordFromContext = useMemo(() => {
        return dataContext?.baggageData?.find(r => r.PIR.toUpperCase() === report.pir.toUpperCase());
    }, [dataContext?.baggageData, report.pir]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!dataContext) return;
            // جلب السجل من Excel أو WorldTracer لضمان أحدث البيانات
            let record = dataContext.dataSource === 'excel' ? recordFromContext : await findBaggageByPir(report.pir);
            if (record) {
                setDetailedRecord(record);
                setTimelineInfo(recordToBaggageInfo(record));
                setCurrentStatus(record.Status as any);
            }
            setIsLoading(false);
        };
        fetchDetails();
    }, [report.pir, dataContext?.dataSource, recordFromContext]);
    
    const handleAiCompare = async () => {
        if (!detailedRecord?.PassengerPhotoUrl || !detailedRecord?.BaggagePhotoUrl) return "";
        setIsComparing(true);
        try {
            const result = await compareBaggageImages(detailedRecord.PassengerPhotoUrl, detailedRecord.BaggagePhotoUrl);
            setComparisonResult(result);
            return result;
        } catch { return "Service unavailable"; } finally { setIsComparing(false); }
    };

    const handleFinalDelivery = async (deliveryDetails: { idType: string, idNumber: string }) => {
        if (!dataContext || !detailedRecord) return;
        const now = new Date().toISOString();
        const pir = detailedRecord.PIR;

        // تنفيذ التحديث الأمني في السياق الموحد (Excel + Tracer)
        await dataContext.updateBaggageRecord(pir, { 
            Status: 'Delivered', 
            LastUpdate: now,
            IsConfirmedByPassenger: true,
            History_1_Timestamp: now,
            History_1_Status: 'تم التسليم النهائي',
            History_1_Location: detailedRecord.CurrentLocation,
            History_1_Details: `إتمام بروتوكول التسليم الأمني المعتمد (SGS). هويّة الراكب (${deliveryDetails.idType}): ${deliveryDetails.idNumber}. تم التحقق من كافة الشروط أمنياً.`
        });

        // توثيق العملية في سجل التدقيق الاستراتيجي
        settingsContext?.addAuditLog({
            user: 'SGS Operations Agent',
            category: 'Security',
            action: 'توثيق تسليم أمني نهائي',
            details: `تم تسليم الحقيبة ${pir} للراكب ${detailedRecord.PassengerName} بعد مطابقة الهوية (${deliveryDetails.idNumber}) والتحقق من المحتويات.`,
            status: 'Success'
        });

        setCurrentStatus('Delivered');
        alert(`تم إتمام تسليم الحقيبة ${pir} وتوثيق الحالة في قاعدة بيانات SGS و WorldTracer بنجاح.`);
        onClose();
    };

    const statusText: { [key in BaggageReport['status']]: string } = {
        'Urgent': 'عاجل', 'In Progress': 'قيد المتابعة', 'Resolved': 'تم الحل', 'Needs Staff Review': 'تحتاج مراجعة',
        'Out for Delivery': 'خرجت للتوصيل', 'Delivered': 'تم التسليم', 'Found - Awaiting Claim': 'معثور عليها'
    };

    const getStatusColorClass = (status: string) => {
        switch (status) {
            case 'Urgent': return 'bg-red-500/20 text-red-200';
            case 'Delivered': return 'bg-green-500/20 text-green-200';
            case 'Found - Awaiting Claim': return 'bg-cyan-500/20 text-cyan-200';
            default: return 'bg-slate-500/20 text-slate-200';
        }
    }

    const canInitiateDelivery = currentStatus !== 'Delivered' && 
        (detailedRecord?.Status === 'Found - Awaiting Claim' || detailedRecord?.Status === 'In Progress' || detailedRecord?.IsConfirmedByPassenger);

    return (
        <Modal isOpen={true} onClose={onClose} title="إدارة ملف الأمتعة (SGS Strategic Portal)" size="5xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* الجزء الجانبي للإجراءات الأمنية */}
                <div className="lg:col-span-2 space-y-6">
                    {canInitiateDelivery && (
                        <div className="animate-in slide-in-from-top-4 duration-500">
                            {!showDeliveryVerification ? (
                                <button 
                                    onClick={() => setShowDeliveryVerification(true)} 
                                    className="w-full py-4 bg-brand-green text-brand-gray-dark font-black rounded-xl hover:bg-brand-green-light shadow-xl shadow-brand-green/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                    بدء إجراءات التسليم الأمني
                                </button>
                            ) : (
                                <DeliveryVerificationChecklist onCancel={() => setShowDeliveryVerification(false)} onComplete={handleFinalDelivery} />
                            )}
                        </div>
                    )}

                    <VisualComparisonTool 
                        passengerPhoto={detailedRecord?.PassengerPhotoUrl}
                        staffPhoto1={detailedRecord?.BaggagePhotoUrl}
                        staffPhoto2={detailedRecord?.BaggagePhotoUrl_2}
                        onCompare={handleAiCompare}
                        isComparing={isComparing}
                        comparisonResult={comparisonResult}
                    />

                    <div className="bg-brand-gray p-4 rounded-xl border border-brand-gray-light">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">تحديث الحالة التشغيلية</label>
                        <select 
                            value={currentStatus} 
                            onChange={(e) => {
                                const newStatus = e.target.value as any;
                                setCurrentStatus(newStatus);
                                dataContext?.updateBaggageRecord(report.pir, { Status: newStatus, LastUpdate: new Date().toISOString() });
                            }} 
                            className="w-full px-4 py-2.5 bg-brand-gray-dark border border-brand-gray-light text-white rounded-lg outline-none focus:ring-1 focus:ring-brand-green"
                        >
                            {Object.entries(statusText).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                </div>

                {/* الجزء الرئيسي للمعلومات والمسار */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="grid grid-cols-2 gap-6 border-brand-green/10">
                        <InfoItem icon={<UserIcon className="h-5 w-5"/>} label="الراكب" value={detailedRecord?.PassengerName || report.passengerName} />
                        <InfoItem icon={<PlaneIcon className="h-5 w-5"/>} label="الرحلة" value={detailedRecord?.Flight || report.flight} />
                        <InfoItem icon={<TagIcon className="h-5 w-5"/>} label="PIR / TAG" value={report.pir} />
                        <div>
                             <p className="text-sm text-gray-300 font-medium mb-1">الحالة الحالية</p>
                             <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${getStatusColorClass(currentStatus)}`}>
                                    {statusText[currentStatus] || currentStatus}
                                </span>
                                {(detailedRecord?.IsConfirmedByPassenger || currentStatus === 'Delivered') && (
                                    <span className="bg-brand-green text-brand-gray-dark px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse">
                                        مصادق ✓
                                    </span>
                                )}
                             </div>
                        </div>
                    </Card>
                    
                    <div className="bg-brand-gray-dark/40 rounded-2xl p-6 border border-brand-gray-light max-h-[50vh] overflow-y-auto custom-scrollbar">
                        <h4 className="text-sm font-bold text-white mb-6 border-b border-white/5 pb-2">التسلسل الزمني للبلاغ (Security Audit Trail)</h4>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                                <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs font-bold animate-pulse">جاري جلب السجلات الرسمية...</p>
                            </div>
                        ) : timelineInfo && (
                            <BaggageTimeline baggageInfo={timelineInfo} />
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ReportDetailModal;
