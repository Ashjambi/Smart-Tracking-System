
import React, { useState, useRef, useContext } from 'react';
import Modal from './common/Modal';
import { BaggageRecord, AiFeatures } from '../types';
import { CameraIcon, SparklesIcon } from './common/icons';
import { base64FromFile } from '../utils/imageUtils';
import { analyzeFoundBaggagePhoto } from '../services/geminiService';
import { BaggageDataContext } from '../contexts/BaggageDataContext';

interface FoundBaggageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRecordCreate: (newRecord: BaggageRecord) => void;
}

const FoundBaggageModal: React.FC<FoundBaggageModalProps> = ({ isOpen, onClose, onRecordCreate }) => {
    const [pir, setPir] = useState('');
    const [currentLocation, setCurrentLocation] = useState('');
    const [hasNoTag, setHasNoTag] = useState(false);
    const [passengerName, setPassengerName] = useState('غير محدد');
    
    // States for two photos
    const [photo1, setPhoto1] = useState<{file: File | null, preview: string | null}>({file: null, preview: null});
    const [photo2, setPhoto2] = useState<{file: File | null, preview: string | null}>({file: null, preview: null});

    const [aiFeatures, setAiFeatures] = useState<AiFeatures>({
        brand: '',
        color: '',
        size: 'Medium',
        type: '',
        distinctiveMarks: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    
    const fileInput1Ref = useRef<HTMLInputElement>(null);
    const fileInput2Ref = useRef<HTMLInputElement>(null);
    const dataContext = useContext(BaggageDataContext);

    const handlePhotoChange = (slot: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const preview = reader.result as string;
                if (slot === 1) setPhoto1({file, preview});
                else setPhoto2({file, preview});
                setAiError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleManualAnalyze = async () => {
        const photosToAnalyze = [photo1.preview, photo2.preview].filter(p => p !== null) as string[];
        if (photosToAnalyze.length === 0) return;
        
        setIsAnalyzing(true);
        setAiError(null);
        try {
            const analysis = await analyzeFoundBaggagePhoto(photosToAnalyze);
            
            if (analysis.name && analysis.name !== 'null') setPassengerName(analysis.name);
            
            if (analysis.features) {
                setAiFeatures({
                    brand: analysis.features.brand || '',
                    color: analysis.features.color || '',
                    size: analysis.features.size || 'Medium',
                    type: analysis.features.type || '',
                    distinctiveMarks: analysis.features.distinctiveMarks || ''
                });
            }
            
            if (hasNoTag && !pir) {
                setPir(`UNTG-${Date.now().toString().slice(-4)}`);
            }
        } catch (err: any) {
            console.error("AI Analysis failed", err);
            setAiError("عذراً، تعذر تحليل الصور ذكياً. يرجى التأكد من جودة الإضاءة.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentLocation || !photo1.file) {
            alert("يرجى تحديد الموقع والتقاط صورة واحدة على الأقل (الوجه الأمامي).");
            return;
        }

        setIsLoading(true);
        try {
            const photoUrl1 = await base64FromFile(photo1.file);
            const photoUrl2 = photo2.file ? await base64FromFile(photo2.file) : '';

            const newRecord: BaggageRecord = {
                PIR: (pir || `UNTAGGED-${Date.now()}`).toUpperCase(),
                PassengerName: passengerName,
                Flight: "N/A",
                Status: "Found - Awaiting Claim",
                LastUpdate: new Date().toISOString(),
                CurrentLocation: currentLocation,
                NextStep: "بانتظار مطابقة الراكب.",
                EstimatedArrival: "N/A",
                History_1_Timestamp: new Date().toISOString(),
                History_1_Status: "تم العثور عليها وتصنيفها مزدوجاً",
                History_1_Location: currentLocation,
                History_1_Details: `[AI Multi-View] الماركة: ${aiFeatures.brand || 'N/A'}، اللون: ${aiFeatures.color || 'N/A'}. ${aiFeatures.distinctiveMarks || ''}`,
                History_2_Timestamp: '', History_2_Status: '', History_2_Location: '', History_2_Details: '',
                History_3_Timestamp: '', History_3_Status: '', History_3_Location: '', History_3_Details: '',
                BaggagePhotoUrl: photoUrl1,
                BaggagePhotoUrl_2: photoUrl2,
                IsConfirmedByPassenger: false,
                AiFeatures: aiFeatures
            };

            onRecordCreate(newRecord);
            onClose();
        } catch (err) {
            alert("حدث خطأ أثناء حفظ البلاغ.");
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = "w-full px-3 py-2 bg-brand-gray border border-brand-gray-light rounded-lg text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-brand-green outline-none transition-all";
    const labelStyle = "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تسجيل حقيبة (توثيق مزدوج)" size="3xl">
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-2 p-3 bg-brand-gray-dark rounded-md border border-brand-gray-light/30">
                        <input type="checkbox" id="noTag" checked={hasNoTag} onChange={(e) => { setHasNoTag(e.target.checked); if (e.target.checked) setPir(''); }} className="w-4 h-4 accent-brand-green cursor-pointer" />
                        <label htmlFor="noTag" className="text-white text-xs font-medium cursor-pointer">الحقيبة لا تحمل ملصق (No Tag)</label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!hasNoTag && (
                            <div className="space-y-1">
                                <label className={labelStyle}>رقم الملصق (PIR)</label>
                                <input type="text" value={pir} onChange={e => setPir(e.target.value)} placeholder="JEDSV12345" className={inputStyle} />
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className={labelStyle}>الموقع الحالي</label>
                            <input type="text" value={currentLocation} onChange={e => setCurrentLocation(e.target.value)} placeholder="مستودع صالة 1" className={inputStyle} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className={labelStyle}>الوجه الأمامي (أساسي)</label>
                            <div onClick={() => fileInput1Ref.current?.click()} className="relative border-2 border-dashed border-brand-gray-light rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-brand-green overflow-hidden">
                                {photo1.preview ? <img src={photo1.preview} className="w-full h-full object-cover" /> : <CameraIcon className="w-8 h-8 text-gray-500" />}
                                <input ref={fileInput1Ref} type="file" className="sr-only" accept="image/*" onChange={(e) => handlePhotoChange(1, e)} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className={labelStyle}>الوجه الخلفي/الجانبي</label>
                            <div onClick={() => fileInput2Ref.current?.click()} className="relative border-2 border-dashed border-brand-gray-light rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-brand-green overflow-hidden">
                                {photo2.preview ? <img src={photo2.preview} className="w-full h-full object-cover" /> : <CameraIcon className="w-8 h-8 text-gray-500" />}
                                <input ref={fileInput2Ref} type="file" className="sr-only" accept="image/*" onChange={(e) => handlePhotoChange(2, e)} />
                            </div>
                        </div>
                    </div>

                    {(photo1.preview || photo2.preview) && (
                        <div className="space-y-2">
                            <button type="button" onClick={handleManualAnalyze} disabled={isAnalyzing} className={`w-full py-2 border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${isAnalyzing ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-brand-green/20 text-brand-green border-brand-green/30 hover:bg-brand-green/30'}`}>
                                {isAnalyzing ? "جاري دمج الرؤية وتحليل الوجهين..." : <><SparklesIcon className="w-4 h-4" /> تحليل المواصفات آلياً (رؤية مزدوجة)</>}
                            </button>
                            {aiError && <p className="text-[10px] text-red-400 font-bold text-center animate-pulse">{aiError}</p>}
                        </div>
                    )}

                    <div className="p-4 bg-brand-gray-dark/50 border border-brand-gray-light/50 rounded-xl space-y-4">
                        <h4 className="text-[10px] font-bold text-brand-green flex items-center gap-2 border-b border-brand-green/20 pb-2">
                            <SparklesIcon className="w-3 h-3" /> مواصفات البصمة المستخرجة
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={labelStyle}>الماركة</label><input type="text" value={aiFeatures.brand} onChange={e => setAiFeatures({...aiFeatures, brand: e.target.value})} className={inputStyle} /></div>
                            <div><label className={labelStyle}>اللون</label><input type="text" value={aiFeatures.color} onChange={e => setAiFeatures({...aiFeatures, color: e.target.value})} className={inputStyle} /></div>
                            <div>
                                <label className={labelStyle}>الحجم</label>
                                <select value={aiFeatures.size} onChange={e => setAiFeatures({...aiFeatures, size: e.target.value as any})} className={inputStyle}>
                                    <option value="Small">صغيرة</option><option value="Medium">متوسطة</option><option value="Large">كبيرة</option><option value="Extra Large">جداً كبيرة</option>
                                </select>
                            </div>
                            <div><label className={labelStyle}>النوع</label><input type="text" value={aiFeatures.type} onChange={e => setAiFeatures({...aiFeatures, type: e.target.value})} className={inputStyle} /></div>
                        </div>
                        <div><label className={labelStyle}>العلامات المميزة (من الوجهين)</label><textarea value={aiFeatures.distinctiveMarks} onChange={e => setAiFeatures({...aiFeatures, distinctiveMarks: e.target.value})} className={`${inputStyle} h-16`} /></div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-brand-gray-light/30">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-white font-bold rounded-xl hover:bg-white/5">إلغاء</button>
                        <button type="submit" disabled={isLoading} className="flex-[2] py-3 bg-brand-green text-brand-gray-dark font-black rounded-xl hover:bg-brand-green-light shadow-lg">
                            {isLoading ? 'جاري الحفظ...' : 'حفظ البلاغ المزدوج'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default FoundBaggageModal;
