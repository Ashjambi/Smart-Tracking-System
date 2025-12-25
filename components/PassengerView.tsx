
import React, { useState, useRef, useEffect, useContext, useCallback, useMemo } from 'react';
import ChatWindow from './ChatWindow';
import BaggageTimeline from './BaggageTimeline';
import { findBaggageRecord, getInitialBotMessage, getAiChatResponse, findPotentialMatchesByDescription } from '../services/geminiService';
import { BaggageInfo, Message, MessageSender, AppNotification, BaggageRecord } from '../types';
import { BaggageDataContext } from '../contexts/BaggageDataContext';
import Card from './common/Card';
import Modal from './common/Modal';
import NotificationToast from './common/NotificationToast';
import { recordToBaggageInfo } from '../utils/baggageUtils';

const AQUATIC_BUTTON = "w-full bg-brand-green text-brand-gray-dark font-black py-4 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.3)] border border-cyan-400/50 hover:bg-brand-green-light hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95";
const AQUATIC_SECONDARY = "w-full py-2 bg-brand-green/20 text-brand-green text-xs font-bold rounded border border-cyan-400/30 hover:bg-brand-green/40 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all relative z-10";

const translations = {
    ar: {
        welcome: "نظام التتبع الذكي - SGS",
        subWelcome: "مرحباً بكم في خدمات الشركة السعودية للخدمات الأرضية. الرجاء إدخل بياناتكم للبدء.",
        idType: "نوع التعريف",
        pir: "رقم البلاغ (PIR)",
        tagOnly: "رقم التاغ (Tag Number)",
        flightOnly: "رقم الرحلة + الاسم",
        lastNameOnly: "اسم العائلة / الراكب",
        flightLabel: "رقم الرحلة",
        lastNameLabel: "اسم العائلة",
        value: "القيمة",
        startBtn: "بدء عملية التتبع",
        foundGallery: "الحقائب المعثور عليها حالياً",
        statusFound: "حالة: معثور عليها",
        location: "الموقع",
        previewBtn: "معاينة وتأكيد الملكية",
        noFoundBags: "لم نجد حقائب تطابق هذا الوصف حالياً. فريق SGS يسعى دائماً لمساعدتكم.",
        searchPlaceholder: "اكتب استفسارك هنا...",
        botError: "عذراً، لم نجد بلاغاً مفعلاً بالبيانات ({id}). فريق الشركة السعودية للخدمات الأرضية يعرض لك كافة الحقائب المعثور عليها حالياً في مستودعاتنا لمساعدتك في التعرف على حقيبتك.",
        filterBot: "لقد وجد نظام SGS الذكي {count} حقيبة تطابق وصفك ({text}) تماماً. هل إحداها تخصك؟",
        filterNoMatch: "عذراً، لم نجد مطابقات دقيقة لوصفك '{text}' ضمن الفلترة الذكية. يمكنك معاينة كامل الحقائب في المستودع يدوياً للتأكد:",
        promptIdentify: "يرجى البدء بتسجيل بياناتك أولاً لنتمكن من مساعدتك في SGS.",
        filteringText: "جاري الفرز الذكي حسب وصفك: ",
        foundWarehouse: "كامل محتويات مستودع SGS",
        myBaggage: "هذه هي حقيبتي ({id})",
        confirmTitle: "معاينة وتأكيد الملكية",
        confirmAction: "نعم، هذه حقيبتي",
        cancelAction: "رجوع",
        description: "الوصف المرئي",
        marks: "العلامات المميزة",
        confirmationEvent: "تأكيد ملكية الراكب",
        confirmationDetails: "قام الراكب بمعاينة الصور والبيانات وتأكيد أن هذه هي حقيبته الشخصية عبر النظام الذكي.",
        pickupTitle: "تم تأكيد ملكية الحقيبة بنجاح!",
        pickupInstruction: "يرجى التوجه إلى الموقع التالي لاستلام حقيبتك الآن:",
        pickupSignoff: "موظفو الشركة السعودية للخدمات الأرضية (SGS) بانتظار خدمتك في الموقع المذكور.",
        statusUpdate: "تحديث في حالة الأمتعة",
        statusUpdateMsg: "تغيرت حالة حقيبتك ({id}) إلى: {status}",
        deliveredTitle: "تم التسليم بنجاح!",
        deliveredMsg: "تم استلام حقيبتك رسمياً. نشكركم لاختيار خدماتنا."
    },
    en: {
        welcome: "Smart Tracking System - SGS",
        subWelcome: "Welcome to Saudi Ground Services. Please enter your details to start.",
        idType: "Identification Type",
        pir: "Report Number (PIR)",
        tagOnly: "Tag Number",
        flightOnly: "Flight Number + Name",
        lastNameOnly: "Last Name / Passenger Name",
        flightLabel: "Flight Number",
        lastNameLabel: "Last Name",
        value: "Value",
        startBtn: "Start Tracking Process",
        foundGallery: "Currently Found Baggage",
        statusFound: "Status: Found",
        location: "Location",
        previewBtn: "Preview & Confirm Ownership",
        noFoundBags: "No baggage found matching this description. SGS team is here to help.",
        searchPlaceholder: "Type your query here...",
        botError: "Sorry, we couldn't find an active report with data ({id}). SGS has displayed all currently found bags in our warehouse to help you identify your belongings.",
        filterBot: "SGS Smart System found {count} bag(s) that strictly match your description ({text}). Does one of them belong to you?",
        filterNoMatch: "No precise match for '{text}' found via smart filtering. You can manually review all bags in the warehouse as a final resort:",
        promptIdentify: "Please register your details first so SGS can assist you.",
        filteringText: "Smart filtering based on your description: ",
        foundWarehouse: "All Bags in SGS Warehouse",
        myBaggage: "This is my baggage ({id})",
        confirmTitle: "Preview & Confirm Ownership",
        confirmAction: "Yes, this is my bag",
        cancelAction: "Back",
        description: "Visual Description",
        marks: "Distinctive Marks",
        confirmationEvent: "Passenger Confirmed Ownership",
        confirmationDetails: "The passenger inspected visual data and confirmed this is their personal bag via the smart system.",
        pickupTitle: "Baggage Ownership Confirmed Successfully!",
        pickupInstruction: "Please proceed to the following location to collect your bag now:",
        pickupSignoff: "Saudi Ground Services (SGS) staff are waiting to assist you at the specified location.",
        statusUpdate: "Baggage Status Update",
        statusUpdateMsg: "Your baggage ({id}) status changed to: {status}",
        deliveredTitle: "Delivered Successfully!",
        deliveredMsg: "Your bag has been officially delivered. Thank you for choosing our services."
    }
};

const IdentificationForm: React.FC<{ onIdentify: (id: string, type: string) => void, lang: 'ar' | 'en' }> = ({ onIdentify, lang }) => {
    const [identifier, setIdentifier] = useState('');
    const [lastName, setLastName] = useState('');
    const [idType, setIdType] = useState('pir');
    const t = translations[lang];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (idType === 'flight') {
            onIdentify(`${identifier}|${lastName}`, idType);
        } else {
            onIdentify(identifier, idType);
        }
    };

    const getPlaceholder = () => {
        if (idType === 'pir') return lang === 'ar' ? 'مثال: JEDSV12345' : 'e.g. JEDSV12345';
        if (idType === 'tag') return lang === 'ar' ? 'أدخل رقم التاغ المطبوع' : 'Enter Tag Number';
        if (idType === 'flight') return lang === 'ar' ? 'مثال: SV123' : 'e.g. SV123';
        if (idType === 'passengerName') return lang === 'ar' ? 'أدخل اسم العائلة' : 'Enter Last Name';
        return '';
    };

    return (
        <div className="max-w-2xl mx-auto">
             <Card>
                <h2 className="text-2xl font-bold text-center text-white mb-2">{t.welcome}</h2>
                <p className="text-center text-gray-300 mb-6 font-medium">{t.subWelcome}</p>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 uppercase font-bold px-1">{t.idType}</label>
                            <select value={idType} onChange={e => setIdType(e.target.value)} className="w-full px-4 py-3 bg-brand-gray border border-brand-gray-light rounded-lg text-white outline-none focus:ring-2 focus:ring-brand-green transition-all">
                                <option value="pir">{t.pir}</option>
                                <option value="tag">{t.tagOnly}</option>
                                <option value="flight">{t.flightOnly}</option>
                                <option value="passengerName">{t.lastNameOnly}</option>
                            </select>
                        </div>
                        
                        {idType === 'flight' ? (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase font-bold px-1">{t.flightLabel}</label>
                                    <input 
                                        type="text" 
                                        value={identifier} 
                                        onChange={e => setIdentifier(e.target.value)} 
                                        placeholder={getPlaceholder()} 
                                        className="w-full px-4 py-3 bg-brand-gray border border-brand-gray-light rounded-lg text-white outline-none focus:ring-2 focus:ring-brand-green transition-all" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase font-bold px-1">{t.lastNameLabel}</label>
                                    <input 
                                        type="text" 
                                        value={lastName} 
                                        onChange={e => setLastName(e.target.value)} 
                                        placeholder={lang === 'ar' ? 'أدخل اسم العائلة' : 'Enter Last Name'} 
                                        className="w-full px-4 py-3 bg-brand-gray border border-brand-gray-light rounded-lg text-white outline-none focus:ring-2 focus:ring-brand-green transition-all" 
                                        required 
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 uppercase font-bold px-1">{t.value}</label>
                                <input 
                                    type="text" 
                                    value={identifier} 
                                    onChange={e => setIdentifier(e.target.value)} 
                                    placeholder={getPlaceholder()} 
                                    className="w-full px-4 py-3 bg-brand-gray border border-brand-gray-light rounded-lg text-white outline-none focus:ring-2 focus:ring-brand-green transition-all" 
                                    required 
                                />
                            </div>
                        )}
                    </div>
                    <button type="submit" className={AQUATIC_BUTTON}>
                        {t.startBtn}
                    </button>
                </form>
            </Card>
        </div>
    );
};

const PotentialMatchGallery: React.FC<{ matches: BaggageRecord[], onPreview: (record: BaggageRecord) => void, title?: string, lang: 'ar' | 'en' }> = ({ matches, onPreview, title, lang }) => {
    const t = translations[lang];
    return (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-white mb-4">
                {title || t.foundGallery}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map(record => (
                    <Card key={record.PIR} className="hover:border-cyan-400/50 transition-all cursor-pointer group p-3" onClick={() => onPreview(record)}>
                        <div className="aspect-video bg-brand-gray-dark rounded-lg overflow-hidden mb-3 border border-brand-gray-light">
                            {record.BaggagePhotoUrl ? (
                                <img src={record.BaggagePhotoUrl} alt="Found bag" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-600 text-xs">No image available</div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-start">
                                <p className="text-[10px] font-bold text-brand-green uppercase">{t.statusFound}</p>
                                <p className="text-[9px] text-gray-500 font-mono">#{record.PIR.slice(-4)}</p>
                            </div>
                            <p className="text-xs text-gray-100 font-bold truncate">{t.location}: {record.CurrentLocation}</p>
                            <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{record.History_1_Details}</p>
                        </div>
                        <button 
                            onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                onPreview(record); 
                            }}
                            className={AQUATIC_SECONDARY}
                        >
                            {t.previewBtn}
                        </button>
                    </Card>
                ))}
            </div>
            {matches.length === 0 && (
                <div className="text-center py-10 bg-brand-gray/50 rounded-xl border border-dashed border-brand-gray-light">
                    <p className="text-gray-400 text-sm">{t.noFoundBags}</p>
                </div>
            )}
        </div>
    );
};

const PassengerView: React.FC = () => {
    const [lang, setLang] = useState<'ar' | 'en'>('ar');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authPir, setAuthPir] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [baggageInfo, setBaggageInfo] = useState<BaggageInfo | null>(null);
    const [allFoundBags, setAllFoundBags] = useState<BaggageRecord[]>([]);
    const [displayMatches, setDisplayMatches] = useState<BaggageRecord[]>([]);
    const [isFiltering, setIsFiltering] = useState(false);
    const [previewBag, setPreviewBag] = useState<BaggageRecord | null>(null);
    const [lastFilterQuery, setLastFilterQuery] = useState("");
    
    const dataContext = useContext(BaggageDataContext);
    const t = translations[lang];

    const activeRecord = useMemo(() => {
        if (!authPir || !dataContext?.baggageData) return null;
        return dataContext.baggageData.find(r => r.PIR === authPir) || null;
    }, [authPir, dataContext?.baggageData]);

    useEffect(() => {
        if (!activeRecord || !baggageInfo) return;
        if (activeRecord.Status !== baggageInfo.status) {
            const newStatus = activeRecord.Status;
            const notification: AppNotification = {
                id: Date.now().toString(),
                title: newStatus === 'Delivered' ? t.deliveredTitle : t.statusUpdate,
                message: newStatus === 'Delivered' 
                    ? t.deliveredMsg 
                    : t.statusUpdateMsg.replace('{id}', activeRecord.PIR).replace('{status}', newStatus),
                type: newStatus === 'Delivered' ? 'success' : (newStatus === 'Urgent' ? 'urgent' : 'info'),
                timestamp: new Date()
            };
            setNotifications(prev => [notification, ...prev]);
            setBaggageInfo(recordToBaggageInfo(activeRecord));
        }
    }, [activeRecord, baggageInfo, t]);

    const handleIdentify = async (id: string, type: string) => {
         if (!dataContext) return;
         setIsAuthenticated(true);
         setIsTyping(true);
         let { record, error } = await findBaggageRecord(id, type, dataContext.dataSource, dataContext.baggageData);
         const foundBags = (dataContext.baggageData || []).filter(r => r.Status === 'Found - Awaiting Claim');
         setAllFoundBags(foundBags);
         if (!record) {
            setDisplayMatches(foundBags);
            const displayId = id.includes('|') ? id.split('|')[0] : id;
            const welcomeMsg: Message = { id: Date.now(), text: t.botError.replace('{id}', displayId), sender: MessageSender.BOT };
            setMessages([welcomeMsg]);
         } else {
            setAuthPir(record.PIR);
            const { chatResponse, baggageInfo: info } = getInitialBotMessage(record, lang);
            setBaggageInfo(info);
            setMessages([{ id: 1, text: chatResponse, sender: MessageSender.BOT }]);
            setDisplayMatches([]); 
         }
         setIsTyping(false);
    };

    const handleSendMessage = async (text: string) => {
        const newUserMsg: Message = { id: Date.now(), text, sender: MessageSender.USER };
        setMessages(prev => [...prev, newUserMsg]);
        setIsTyping(true);
        if (!baggageInfo && allFoundBags.length > 0) {
            setIsFiltering(true);
            setLastFilterQuery(text);
            const matches = await findPotentialMatchesByDescription(text, allFoundBags, undefined, lang);
            let responseText = "";
            if (matches.length > 0) {
                setDisplayMatches(matches);
                responseText = t.filterBot.replace('{count}', matches.length.toString()).replace('{text}', text);
            } else {
                setDisplayMatches(allFoundBags); 
                responseText = t.filterNoMatch.replace('{text}', text);
            }
            setMessages(prev => [...prev, { id: Date.now() + 1, text: responseText, sender: MessageSender.BOT }]);
            setIsFiltering(false);
        } else if (baggageInfo) {
            const response = await getAiChatResponse([...messages, newUserMsg], baggageInfo, lang);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: MessageSender.BOT }]);
        } else {
             setMessages(prev => [...prev, { id: Date.now() + 1, text: t.promptIdentify, sender: MessageSender.BOT }]);
        }
        setIsTyping(false);
    };

    const handleSelectMatch = useCallback((record: BaggageRecord) => {
        if (!dataContext) return;
        const now = new Date().toISOString();
        const pickUpInstructionText = lang === 'ar' 
            ? `يرجى التوجه إلى ${record.CurrentLocation} لاستلام حقيبتك. نحن بانتظارك في الشركة السعودية للخدمات الأرضية (SGS).` 
            : `Please proceed to ${record.CurrentLocation} to collect your bag. Saudi Ground Services (SGS) team is waiting for you.`;
        const updates: Partial<BaggageRecord> = {
            IsConfirmedByPassenger: true,
            Status: 'In Progress',
            LastUpdate: now,
            NextStep: pickUpInstructionText,
            History_1_Timestamp: now,
            History_1_Status: t.confirmationEvent,
            History_1_Location: record.CurrentLocation,
            History_1_Details: t.confirmationDetails,
        };
        dataContext.updateBaggageRecord(record.PIR, updates);
        setAuthPir(record.PIR);
        const updatedRecord = { ...record, ...updates };
        const { chatResponse, baggageInfo: info } = getInitialBotMessage(updatedRecord, lang);
        setBaggageInfo({ ...info, isConfirmedByPassenger: true, nextStep: pickUpInstructionText });
        setMessages(prev => [
            ...prev, 
            { id: Date.now(), text: t.myBaggage.replace('{id}', record.PIR), sender: MessageSender.USER }, 
            { id: Date.now() + 1, text: chatResponse, sender: MessageSender.BOT }
        ]);
        setAllFoundBags([]);
        setDisplayMatches([]);
        setPreviewBag(null);
    }, [dataContext, lang, t.myBaggage, t.confirmationEvent, t.confirmationDetails]);

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getGalleryTitle = () => {
        if (isFiltering) return t.filteringText + lastFilterQuery;
        if (displayMatches.length === allFoundBags.length) return t.foundWarehouse;
        return t.foundGallery;
    }

    return (
        <div className={`max-w-6xl mx-auto space-y-8 pb-20 ${lang === 'en' ? 'text-left' : 'text-right'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="fixed top-0 left-0 right-0 z-[200] pointer-events-none">
                {notifications.map(n => (
                    <NotificationToast key={n.id} notification={n} onClose={dismissNotification} lang={lang} />
                ))}
            </div>
            <div className="flex justify-end mb-4">
                <div className="bg-brand-gray-dark/60 p-1 rounded-full border border-cyan-400/30 inline-flex shadow-xl">
                    <button onClick={() => setLang('ar')} className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${lang === 'ar' ? 'bg-brand-green text-brand-gray-dark shadow-md' : 'text-gray-400 hover:text-white'}`}>العربية</button>
                    <button onClick={() => setLang('en')} className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-brand-green text-brand-gray-dark shadow-md' : 'text-gray-400 hover:text-white'}`}>English</button>
                </div>
            </div>
            {!isAuthenticated ? (
                <IdentificationForm onIdentify={handleIdentify} lang={lang} />
            ) : (
                <>
                    {baggageInfo?.isConfirmedByPassenger && (
                        <div className="bg-brand-green/10 border-2 border-cyan-400/40 p-6 rounded-2xl shadow-xl shadow-brand-green/10 animate-in slide-in-from-top-4 duration-700">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-brand-green text-brand-gray-dark rounded-full shadow-lg">
                                    {/* تم حذف أيقونة RouteIcon */}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-brand-green">{t.pickupTitle}</h3>
                                    <p className="text-gray-100 font-bold text-lg">{t.pickupInstruction}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-2xl text-white font-black bg-brand-gray-dark px-4 py-2 rounded-lg border border-cyan-400/30 shadow-inner">
                                            📍 {baggageInfo.currentLocation}
                                        </p>
                                    </div>
                                    <p className="text-sm text-brand-green/80 font-medium italic pt-2">{t.pickupSignoff}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <Card className="p-0 flex flex-col h-[55vh] shadow-2xl overflow-hidden border-cyan-400/30">
                        <ChatWindow messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} placeholder={t.searchPlaceholder} lang={lang} />
                    </Card>
                    {displayMatches.length > 0 && (
                        <PotentialMatchGallery matches={displayMatches} onPreview={(record) => setPreviewBag(record)} title={getGalleryTitle()} lang={lang} />
                    )}
                    {baggageInfo && (
                        <div className="animate-in fade-in zoom-in-95 duration-700">
                            <BaggageTimeline baggageInfo={baggageInfo} />
                        </div>
                    )}
                    {previewBag && (
                        <Modal isOpen={true} onClose={() => setPreviewBag(null)} title={t.confirmTitle}>
                            <div className="space-y-6">
                                <div className="aspect-video bg-brand-gray rounded-xl overflow-hidden border border-brand-gray-light">
                                    <img src={previewBag.BaggagePhotoUrl} alt="Preview" className="w-full h-full object-contain" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-brand-gray rounded-lg border border-brand-gray-light">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{t.location}</p>
                                        <p className="text-sm text-white font-medium">{previewBag.CurrentLocation}</p>
                                    </div>
                                    <div className="p-3 bg-brand-gray rounded-lg border border-brand-gray-light">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">ID</p>
                                        <p className="text-sm text-white font-mono">#{previewBag.PIR}</p>
                                    </div>
                                    <div className="md:col-span-2 p-3 bg-brand-gray rounded-lg border border-brand-gray-light">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t.description}</p>
                                        <p className="text-sm text-gray-200 leading-relaxed">{previewBag.History_1_Details}</p>
                                    </div>
                                    {previewBag.AiFeatures && (
                                        <div className="md:col-span-2 flex flex-wrap gap-2 p-3 bg-brand-green/5 border border-cyan-400/20 rounded-lg">
                                            <p className="w-full text-[9px] text-brand-green font-bold uppercase mb-1">
                                                بصمة SGS الذكية:
                                            </p>
                                            {previewBag.AiFeatures.brand && <span className="bg-brand-gray-dark px-2 py-1 rounded text-[10px] text-white border border-cyan-400/30">الماركة: {previewBag.AiFeatures.brand}</span>}
                                            {previewBag.AiFeatures.color && <span className="bg-brand-gray-dark px-2 py-1 rounded text-[10px] text-white border border-cyan-400/30">اللون: {previewBag.AiFeatures.color}</span>}
                                            {previewBag.AiFeatures.size && <span className="bg-brand-gray-dark px-2 py-1 rounded text-[10px] text-white border border-cyan-400/30">الحجم: {previewBag.AiFeatures.size}</span>}
                                            {previewBag.AiFeatures.type && <span className="bg-brand-gray-dark px-2 py-1 rounded text-[10px] text-white border border-cyan-400/30">النوع: {previewBag.AiFeatures.type}</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setPreviewBag(null)} className="flex-1 py-3 bg-brand-gray-light text-white font-bold rounded-lg hover:bg-brand-gray transition-colors">
                                        {t.cancelAction}
                                    </button>
                                    <button onClick={() => handleSelectMatch(previewBag)} className="flex-[2] py-3 bg-brand-green text-brand-gray-dark font-black rounded-lg border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:bg-brand-green-light transition-all">
                                        {t.confirmAction}
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    )}
                </>
            )}
        </div>
    );
};

export default PassengerView;
