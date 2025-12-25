
import React, { useState, useMemo, useContext, useEffect } from 'react';
import Card from './common/Card';
import { BaggageReport, BaggageRecord, DataSourceMode } from '../types';
import Fuse from 'fuse.js';
import { BaggageDataContext } from '../contexts/BaggageDataContext';
import { SettingsContext } from '../contexts/SettingsContext';
import ReportDetailModal from './ReportDetailModal';
import { DATA_SOURCE_MODE } from '../constants';
import CreateTicketModal from './CreateTicketModal';
import FoundBaggageModal from './FoundBaggageModal';
import { findBaggageByPir, fetchGlobalReports } from '../services/worldTracerService';
import BaggageTimer from './common/BaggageTimer';

const REPORTS_PER_PAGE = 20;

const AQUATIC_BTN_CYAN = "flex items-center gap-2 px-4 py-2 bg-cyan-500 text-brand-gray-dark font-black rounded-lg border border-cyan-300/50 hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]";
const AQUATIC_BTN_GREEN = "flex items-center gap-2 px-4 py-2 bg-brand-green text-brand-gray-dark font-black rounded-lg border border-cyan-400/50 hover:bg-brand-green-light transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)]";

const SecurityStatusBar: React.FC<{ isSyncingGlobal: boolean }> = ({ isSyncingGlobal }) => {
    const settings = useContext(SettingsContext);
    const isConnected = settings?.wtConfig?.isConnected;
    
    return (
        <div className={`flex items-center justify-between px-4 py-2 rounded-lg border mb-6 transition-all duration-500 ${isConnected ? 'bg-green-500/10 border-cyan-400/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isSyncingGlobal ? 'bg-blue-400 animate-spin' : (isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400')}`}></div>
                <span className="text-xs font-bold text-gray-200">
                    {isSyncingGlobal ? 'جاري مزامنة قاعدة البيانات العالمية...' : (isConnected ? 'قناة اتصال مشفرة ومفوضة نشطة' : 'وضع المعاينة المحدود')}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Security Level: AES-256</span>
            </div>
        </div>
    );
};

const getStatusColor = (status: BaggageReport['status']) => {
    switch (status) {
        case 'Urgent': return 'bg-red-500/20 text-red-200 border-red-400/30';
        case 'Needs Staff Review': return 'bg-purple-500/20 text-purple-200 border-purple-400/30';
        case 'Found - Awaiting Claim': return 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30';
        case 'In Progress': return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30';
        case 'Out for Delivery': return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
        case 'Delivered':
        case 'Resolved': return 'bg-green-500/20 text-green-200 border-cyan-400/30';
        default: return 'bg-slate-500/20 text-slate-200 border-slate-400/30';
    }
}

const statusTextMap: Record<BaggageReport['status'], string> = {
    'Urgent': 'عاجل', 'In Progress': 'قيد المتابعة', 'Resolved': 'تم الحل', 'Needs Staff Review': 'تحتاج مراجعة',
    'Out for Delivery': 'خرجت للتوصيل', 'Delivered': 'تم التسليم', 'Found - Awaiting Claim': 'معثور عليها'
};

const formatRelativeTime = (date: Date): string => {
    try {
        const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
        const now = new Date();
        const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
        if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
        const minutes = Math.round(seconds / 60);
        if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
        const hours = Math.round(minutes / 60);
        if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
        return rtf.format(Math.round(hours / 24), 'day');
    } catch { return "منذ فترة"; }
};

const ReportCard: React.FC<{ report: BaggageReport; onViewDetails: (report: BaggageReport) => void; }> = ({ report, onViewDetails }) => (
    <Card className="flex flex-col relative group overflow-hidden border-transparent hover:border-cyan-400/50 transition-all duration-300">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-white">{report.passengerName || 'راكب غير محدد'}</h3>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(report.status)}`}>
                {statusTextMap[report.status] || report.status}
            </span>
        </div>
        
        <div className="mb-4">
            <BaggageTimer startTime={report.lastUpdate.toISOString()} />
        </div>

        <div className="mt-2 space-y-2 text-sm text-gray-300 flex-grow">
            <p><span className="font-semibold text-gray-100">رحلة:</span> {report.flight}</p>
            <p><span className="font-semibold text-gray-100">PIR:</span> {report.pir}</p>
            <p><span className="font-semibold text-gray-100">آخر تحديث:</span> {formatRelativeTime(report.lastUpdate)}</p>
        </div>
        <div className="mt-6 flex justify-end">
            <button onClick={() => onViewDetails(report)} className="px-4 py-2 text-sm font-bold text-white bg-brand-gray-light rounded-lg border border-cyan-400/20 hover:bg-brand-gray transition-colors">
                عرض الملف
            </button>
        </div>
    </Card>
);

const StaffView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | BaggageReport['status']>('All');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFoundBaggageModalOpen, setIsFoundBaggageModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<BaggageReport | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
    const [visibleCount, setVisibleCount] = useState(REPORTS_PER_PAGE);

    const dataContext = useContext(BaggageDataContext);
    const settingsContext = useContext(SettingsContext);

    if (!dataContext) return null;
    const { dataSource, setDataSource, baggageData, wtReports, setWtReports, updateBaggageRecord, addBaggageRecord } = dataContext;

    const handleFullSync = async () => {
        setIsSyncingGlobal(true);
        try {
            const globalRecords = await fetchGlobalReports();
            const formatted = globalRecords.map(r => ({
                id: r.PIR,
                passengerName: r.PassengerName,
                flight: r.Flight,
                pir: r.PIR,
                status: (r.Status as any) || 'In Progress',
                lastUpdate: new Date(r.LastUpdate)
            }));
            setWtReports(formatted);
        } catch (error) {
            console.error("Sync failed:", error);
        } finally {
            setTimeout(() => setIsSyncingGlobal(false), 1000);
        }
    };

    useEffect(() => {
        if (dataSource === DATA_SOURCE_MODE.WORLDTRACER && wtReports.length === 0) {
            handleFullSync();
        }
    }, [dataSource]);

    useEffect(() => {
        const performBackgroundSync = async () => {
            if (!baggageData || baggageData.length === 0 || !settingsContext?.wtConfig?.isConnected) return;
            const urgentReports = baggageData.filter(r => r.Status === 'Urgent');
            if (urgentReports.length === 0) return;
            setIsSyncing(true);
            for (const record of urgentReports) {
                try {
                    const globalUpdate = await findBaggageByPir(record.PIR);
                    if (globalUpdate) updateBaggageRecord(record.PIR, { ...globalUpdate });
                } catch (error) { console.error(error); }
            }
            setTimeout(() => setIsSyncing(false), 2000);
        };
        const timerId = setInterval(performBackgroundSync, 60000);
        return () => clearInterval(timerId);
    }, [baggageData, updateBaggageRecord, settingsContext?.wtConfig?.isConnected]);

    // تحويل السجلات إلى تقارير واجهة مع ضمان الاستجابة الفورية لتحديثات السياق
    // تم ربطها بـ wtReports لضمان تحديث البطاقة فور تغيير الحالة في الـ Context
    const reportsData = useMemo(() => {
        if (dataSource === DATA_SOURCE_MODE.EXCEL) {
            return (baggageData || []).map(r => ({
                id: r.PIR,
                passengerName: r.PassengerName,
                flight: r.Flight,
                pir: r.PIR,
                status: (r.Status as any) || 'In Progress',
                lastUpdate: new Date(r.LastUpdate)
            }));
        }
        return wtReports;
    }, [baggageData, dataSource, wtReports]);

    const filteredReports = useMemo(() => {
        let currentReports = [...reportsData];
        if (searchTerm.trim()) {
            const fuse = new Fuse(currentReports, { keys: ['passengerName', 'flight', 'pir'], threshold: 0.4 });
            currentReports = fuse.search(searchTerm).map(r => r.item);
        }
        if (statusFilter !== 'All') currentReports = currentReports.filter(r => r.status === statusFilter);
        return currentReports.slice(0, visibleCount);
    }, [searchTerm, statusFilter, reportsData, visibleCount]);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <SecurityStatusBar isSyncingGlobal={isSyncingGlobal} />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                     <h2 className="text-3xl font-black text-white">لوحة متابعة البلاغات</h2>
                     {(isSyncing || isSyncingGlobal) && (
                         <div className="flex items-center gap-2 bg-brand-green/10 px-3 py-1 rounded-full border border-cyan-400/30 animate-pulse">
                            <span className="text-[10px] font-bold text-brand-green uppercase">مزامنة أمنية...</span>
                         </div>
                     )}
                </div>
                
                <div className="flex items-center gap-3">
                    {dataSource === DATA_SOURCE_MODE.WORLDTRACER && (
                        <button 
                            onClick={handleFullSync}
                            disabled={isSyncingGlobal}
                            className="px-6 py-2 bg-blue-600 text-white font-black rounded-lg border border-cyan-400/40 hover:bg-blue-500 transition-all shadow-lg disabled:opacity-50"
                        >
                            تزامن البيانات
                        </button>
                    )}
                    <button 
                        onClick={() => setIsFoundBaggageModalOpen(true)}
                        className={AQUATIC_BTN_CYAN}
                    >
                        تسجيل معثورات
                    </button>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className={AQUATIC_BTN_GREEN}
                    >
                        بلاغ جديد
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 w-full flex gap-2">
                    <div className="relative flex-1">
                        <input type="text" placeholder="بحث بالاسم أو الرحلة..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-brand-gray border border-cyan-400/30 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-brand-green" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-4 py-2 bg-brand-gray border border-cyan-400/30 rounded-md text-white focus:outline-none">
                        <option value="All">كل الحالات</option>
                        <option value="Urgent">عاجل</option>
                        <option value="Needs Staff Review">تحتاج مراجعة</option>
                        <option value="In Progress">قيد المتابعة</option>
                        <option value="Found - Awaiting Claim">معثور عليها</option>
                    </select>
                </div>
                <div className="bg-brand-gray-dark p-1 rounded-lg flex border border-cyan-400/30">
                    <button onClick={() => setDataSource(DATA_SOURCE_MODE.EXCEL)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${dataSource === DATA_SOURCE_MODE.EXCEL ? 'bg-brand-gray text-white' : 'text-gray-400'}`}>Excel</button>
                    <button onClick={() => setDataSource(DATA_SOURCE_MODE.WORLDTRACER)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${dataSource === DATA_SOURCE_MODE.WORLDTRACER ? 'bg-brand-gray text-white' : 'text-gray-400'}`}>WorldTracer</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isSyncingGlobal && wtReports.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-brand-gray-dark/40 border border-brand-gray-light rounded-lg animate-pulse"></div>
                    ))
                ) : filteredReports.length > 0 ? (
                    filteredReports.map(report => (
                        <ReportCard key={report.id} report={report as any} onViewDetails={(r) => { setSelectedReport(r); setIsDetailModalOpen(true); }} />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-gray-400 font-medium">لا توجد بلاغات حالياً.</p>
                    </div>
                )}
            </div>

            {isDetailModalOpen && selectedReport && (
                <ReportDetailModal report={selectedReport} onClose={() => setIsDetailModalOpen(false)} />
            )}

            <CreateTicketModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onTicketCreate={(record) => {
                    addBaggageRecord(record);
                    setIsCreateModalOpen(false);
                }} 
            />

            <FoundBaggageModal 
                isOpen={isFoundBaggageModalOpen} 
                onClose={() => setIsFoundBaggageModalOpen(false)} 
                onRecordCreate={(record) => {
                    addBaggageRecord(record);
                    setIsFoundBaggageModalOpen(false);
                }} 
            />
        </div>
    );
};

export default StaffView;
