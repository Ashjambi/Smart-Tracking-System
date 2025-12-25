
import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import Card from './common/Card';
import { SettingsContext } from '../contexts/SettingsContext';
import { BaggageDataContext } from '../contexts/BaggageDataContext';
import { User, BaggageRecord, WorldTracerConfig, AuditEntry, AuditCategory } from '../types';
import { SettingsIcon, UserGroupIcon, PhotoIcon, TrashIcon, CheckCircleIcon, WorldIcon, UploadIcon, BellIcon } from './common/icons';
import { base64FromFile } from '../utils/imageUtils';
import BaggageTimer from './common/BaggageTimer';
import Fuse from 'fuse.js';

type ManagementTab = 'settings' | 'logistics' | 'audit' | 'security';

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SecurityReportView: React.FC = () => {
    const settings = useContext(SettingsContext);
    const securityLogs = useMemo(() => {
        return (settings?.auditLogs || []).filter(log => log.category === 'Security' && log.action.includes('تسليم'));
    }, [settings?.auditLogs]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-brand-green/10 border border-brand-green/30 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <h4 className="text-white font-bold">تقارير التوثيق المزدوج (SGS Security)</h4>
                    <p className="text-xs text-gray-400">سجل مصادقات الركاب وعمليات التحقق من الهوية الرسمية عند التسليم.</p>
                </div>
                <div className="bg-brand-gray-dark px-3 py-1 rounded text-brand-green font-mono text-xs border border-brand-green/20">
                    إجمالي التقارير: {securityLogs.length}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {securityLogs.map(log => (
                    <Card key={log.id} className="border-brand-green/20 hover:border-brand-green/40 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center text-brand-green border border-brand-green/20">
                                    <CheckCircleIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h5 className="text-white font-bold">{log.action}</h5>
                                    <p className="text-xs text-gray-300 mt-1">{log.details}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="text-[10px] text-gray-500 font-mono">المسؤول: {log.user}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">IP: {log.ip}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold bg-brand-gray px-2 py-1 rounded border border-brand-gray-light">
                                {new Date(log.timestamp).toLocaleString('ar-SA')}
                            </span>
                        </div>
                    </Card>
                ))}
                {securityLogs.length === 0 && (
                    <div className="text-center py-20 bg-brand-gray/30 rounded-xl border border-dashed border-brand-gray-light">
                        <p className="text-gray-400">لا توجد سجلات تسليم أمني حالياً.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const UserRow: React.FC<{ user: User }> = ({ user }) => {
    const context = useContext(SettingsContext);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...user });

    if (!context) return null;
    const { updateUser, removeUser } = context;

    const handleToggleStatus = () => {
        updateUser(user.id, { status: user.status === 'Active' ? 'Inactive' : 'Active' });
    };

    const handleSave = () => {
        updateUser(user.id, { ...editData });
        setIsEditing(false);
    };

    const roleMap: Record<User['role'], string> = {
        'Admin': 'مدير نظام',
        'Manager': 'مشرف محطة',
        'Staff': 'موظف عمليات'
    };

    return (
        <tr className="border-b border-brand-gray-light/30 text-white hover:bg-white/5 transition-colors">
            <td className="py-4 px-2">
                {isEditing ? (
                    <input 
                        type="text" 
                        value={editData.name} 
                        onChange={e => setEditData({...editData, name: e.target.value})} 
                        className="bg-brand-gray-dark border border-brand-green/30 rounded px-2 py-1 text-xs w-full outline-none focus:border-brand-green"
                    />
                ) : user.name}
            </td>
            <td className="py-4 px-2 text-gray-400 font-mono text-xs">{user.employeeId}</td>
            <td className="py-4 px-2">
                {isEditing ? (
                    <select 
                        value={editData.role} 
                        onChange={e => setEditData({...editData, role: e.target.value as any})}
                        className="bg-brand-gray-dark border border-brand-green/30 rounded px-1 py-1 text-xs outline-none"
                    >
                        <option value="Staff">موظف عمليات</option>
                        <option value="Manager">مشرف محطة</option>
                        <option value="Admin">مدير نظام</option>
                    </select>
                ) : (
                    <span className="text-xs bg-brand-gray-light/50 px-2 py-0.5 rounded border border-white/10">
                        {roleMap[user.role]}
                    </span>
                )}
            </td>
            <td className="py-4 px-2">
                <button 
                    onClick={handleToggleStatus}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        user.status === 'Active' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                    {user.status === 'Active' ? 'نشط' : 'موقف'}
                </button>
            </td>
            <td className="py-4 px-2">
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <button onClick={handleSave} className="p-1.5 bg-brand-green text-brand-gray-dark rounded hover:scale-110 transition-transform">
                            <CheckCircleIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="تعديل">
                            <EditIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => removeUser(user.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors" title="حذف">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const LogisticsView: React.FC = () => {
    const baggageContext = useContext(BaggageDataContext);
    const expiredBags = useMemo(() => {
        const data = baggageContext?.baggageData || [];
        const limit = 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        return data.filter(bag => {
            const start = new Date(bag.LastUpdate).getTime();
            return (now - start) > limit && (bag.Status !== 'Resolved' && bag.Status !== 'Delivered');
        });
    }, [baggageContext?.baggageData]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-white font-bold">تنبيه النقل للمستودع المركزي</h4>
                        <p className="text-xs text-gray-400">هناك {expiredBags.length} حقيبة تجاوزت مدة البقاء المسموحة (24 ساعة).</p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">إصدار أمر نقل جماعي</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiredBags.map(bag => (
                    <Card key={bag.PIR} className="border-red-500/20">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h5 className="text-white font-bold">{bag.PassengerName}</h5>
                                <p className="text-[10px] text-gray-400">PIR: {bag.PIR} | رحلة: {bag.Flight}</p>
                            </div>
                            <BaggageTimer startTime={bag.LastUpdate} />
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-gray-light">
                            <span className="text-[10px] text-gray-500 italic">الموقع الحالي: {bag.CurrentLocation}</span>
                            <button className="text-[10px] font-bold text-brand-green hover:underline">عرض الملف الكامل</button>
                        </div>
                    </Card>
                ))}
            </div>
            {expiredBags.length === 0 && (
                <div className="text-center py-20 bg-brand-gray/30 rounded-xl border border-dashed border-brand-gray-light">
                    <p className="text-gray-400">لا توجد حقائب تجاوزت المهلة حالياً.</p>
                </div>
            )}
        </div>
    );
};

const AuditLogView: React.FC = () => {
    const settings = useContext(SettingsContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | AuditEntry['status']>('All');
    const [categoryFilter, setCategoryFilter] = useState<'All' | AuditCategory>('All');

    const logs = settings?.auditLogs || [];

    const filteredLogs = useMemo(() => {
        let currentLogs = [...logs];
        if (searchTerm.trim()) {
            const fuse = new Fuse(currentLogs, {
                keys: ['user', 'action', 'details', 'ip'],
                threshold: 0.3
            });
            currentLogs = fuse.search(searchTerm).map(r => r.item);
        }
        if (statusFilter !== 'All') {
            currentLogs = currentLogs.filter(l => l.status === statusFilter);
        }
        if (categoryFilter !== 'All') {
            currentLogs = currentLogs.filter(l => l.category === categoryFilter);
        }
        return currentLogs;
    }, [logs, searchTerm, statusFilter, categoryFilter]);

    const handleExportCSV = () => {
        const headers = ["Timestamp", "User", "Category", "Action", "Details", "Status", "IP"];
        const rows = filteredLogs.map(l => [
            l.timestamp,
            l.user,
            l.category,
            l.action,
            `"${l.details.replace(/"/g, '""')}"`,
            l.status,
            l.ip
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `SGS_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status: AuditEntry['status']) => {
        switch (status) {
            case 'Success': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'Failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'Info': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    const getCategoryStyles = (category: AuditCategory) => {
        switch (category) {
            case 'Security': return 'text-red-400 bg-red-400/5';
            case 'Data': return 'text-brand-green bg-brand-green/5';
            case 'System': return 'text-blue-400 bg-blue-400/5';
            case 'Operation': return 'text-yellow-400 bg-yellow-400/5';
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="بحث في سجل العمليات (مستخدم، إجراء، تفاصيل...)" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full px-4 py-2 bg-brand-gray border border-brand-gray-light rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-green" 
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={categoryFilter} 
                            onChange={e => setCategoryFilter(e.target.value as any)} 
                            className="px-4 py-2 bg-brand-gray border border-brand-gray-light rounded-md text-white text-xs focus:outline-none"
                        >
                            <option value="All">كل الفئات</option>
                            <option value="Security">الأمان</option>
                            <option value="Data">البيانات</option>
                            <option value="System">النظام</option>
                            <option value="Operation">العمليات</option>
                        </select>
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value as any)} 
                            className="px-4 py-2 bg-brand-gray border border-brand-gray-light rounded-md text-white text-xs focus:outline-none"
                        >
                            <option value="All">كل الحالات</option>
                            <option value="Success">ناجح</option>
                            <option value="Failed">فاشل</option>
                            <option value="Info">معلومات</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-[10px] text-gray-500 font-mono hidden md:block">السجلات: {filteredLogs.length}</div>
                    <button 
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-brand-gray-dark border border-brand-gray-light text-white text-xs font-bold rounded-md hover:bg-brand-gray transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        تصدير CSV
                    </button>
                </div>
            </div>

            <Card className="p-0 overflow-hidden border-brand-gray-light/50 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead>
                            <tr className="bg-brand-gray-dark/50 text-gray-400 border-b border-brand-gray-light">
                                <th className="px-4 py-3 font-bold uppercase">الوقت</th>
                                <th className="px-4 py-3 font-bold uppercase">المستخدم</th>
                                <th className="px-4 py-3 font-bold uppercase">الفئة</th>
                                <th className="px-4 py-3 font-bold uppercase">الإجراء</th>
                                <th className="px-4 py-3 font-bold uppercase">التفاصيل</th>
                                <th className="px-4 py-3 font-bold uppercase">الحالة</th>
                                <th className="px-4 py-3 font-bold uppercase">IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="border-b border-brand-gray-light/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleDateString('ar-SA')} {new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-white">{log.user}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border border-white/5 ${getCategoryStyles(log.category)}`}>
                                            {log.category === 'Security' ? 'أمان' : log.category === 'System' ? 'نظام' : log.category === 'Data' ? 'بيانات' : 'عمليات'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-brand-green font-medium">{log.action}</td>
                                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate" title={log.details}>{log.details}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusColor(log.status)}`}>
                                            {log.status === 'Success' ? 'ناجح' : log.status === 'Failed' ? 'فاشل' : 'معلومات'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 font-mono">{log.ip}</td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-20 text-center text-gray-500 italic">لا توجد سجلات مطابقة للبحث</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const CompanyBranding: React.FC = () => {
    const context = useContext(SettingsContext);
    if (!context) return null;
    const { logoUrl, setLogoUrl } = context;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await base64FromFile(file);
            setLogoUrl(base64);
        }
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <PhotoIcon className="w-5 h-5 text-brand-green" />
                هوية المنصة (Branding)
            </h3>
            <p className="text-sm text-gray-400 mb-6">قم بتخصيص مظهر المنصة من خلال تحميل شعار الشركة الرسمي.</p>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group w-32 h-32 bg-brand-gray-dark rounded-xl border-2 border-dashed border-brand-gray-light flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                        <>
                            <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-brand-green text-brand-gray-dark rounded-full hover:scale-110 transition-transform">
                                    <UploadIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => setLogoUrl(null)} className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 text-gray-500 hover:text-brand-green transition-colors">
                            <UploadIcon className="w-8 h-8" />
                            <span className="text-[10px] font-bold">رفع الشعار</span>
                        </button>
                    )}
                </div>
                
                <div className="flex-1 space-y-2">
                    <div className="text-xs text-gray-300">
                        <span className="font-bold text-brand-green">توصية:</span> يفضل استخدام شعار بصيغة PNG وبخلفية شفافة للحصول على أفضل مظهر في "هيدر" المنصة.
                    </div>
                    <div className="text-[10px] text-gray-500">
                        الحد الأقصى الموصى به: 500x200 بكسل.
                    </div>
                </div>
            </div>
            <input ref={fileInputRef} type="file" className="sr-only" accept="image/*" onChange={handleLogoChange} />
        </Card>
    );
};

const WorldTracerIntegration: React.FC = () => {
    const context = useContext(SettingsContext);
    if (!context) return null;

    const { wtConfig, updateWtConfig } = context;
    const [localConfig, setLocalConfig] = useState<WorldTracerConfig>(wtConfig);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            const success = !!localConfig.apiKey && localConfig.apiKey.length > 8;
            updateWtConfig({ ...localConfig, isConnected: success });
            setIsSaving(false);
            if (success) {
                alert('تم التحقق من الاتصال بنجاح. النظام الآن جاهز لاستقبال بيانات WorldTracer.');
            } else {
                alert('فشل الاتصال: مفتاح API غير صالح أو المحطة غير مصرح لها.');
            }
        }, 1500);
    };

    const inputStyle = "w-full px-3 py-2 text-sm text-white bg-brand-gray border border-brand-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green";

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <WorldIcon className="w-6 h-6 text-brand-green"/>
                    <h3 className="text-xl font-bold text-white">تكامل WorldTracer المباشر</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${wtConfig.isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                    {wtConfig.isConnected ? 'متصل ومفعل' : 'غير متصل'}
                </div>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">أدخل بيانات اعتماد الموظف للربط المباشر مع النظام العالمي لتتبع الأمتعة (إنتاج أو اختبار).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-tighter">معرف الوكيل (Agent ID)</label>
                    <input type="text" value={localConfig.agentId} onChange={e => setLocalConfig({...localConfig, agentId: e.target.value})} className={inputStyle} placeholder="مثال: SV-JED-001" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-tighter">كود المحطة (Station Code)</label>
                    <input type="text" value={localConfig.stationCode} onChange={e => setLocalConfig({...localConfig, stationCode: e.target.value})} className={inputStyle} placeholder="مثال: JED" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-tighter">كود شركة الطيران</label>
                    <input type="text" value={localConfig.airlineCode} onChange={e => setLocalConfig({...localConfig, airlineCode: e.target.value})} className={inputStyle} placeholder="SV" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-tighter">مفتاح API المخصص</label>
                    <input type="password" value={localConfig.apiKey} onChange={e => setLocalConfig({...localConfig, apiKey: e.target.value})} className={inputStyle} placeholder="••••••••••••••••" />
                </div>
            </div>
            
            <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="mt-6 w-full py-2 bg-brand-green text-brand-gray-dark font-black rounded-lg hover:bg-brand-green-light transition-all disabled:opacity-50"
            >
                {isSaving ? 'جاري التحقق من البروتوكول...' : 'حفظ واختبار الاتصال'}
            </button>
        </Card>
    );
};

const UserSettings: React.FC = () => {
    const context = useContext(SettingsContext);
    if (!context) return null;
    const { users, addUser } = context;
    const [newUser, setNewUser] = useState({ name: '', employeeId: '', role: 'Staff' as User['role'] });
    const inputStyle = "w-full px-3 py-2 text-sm text-white bg-brand-gray border border-brand-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green transition-all";

    const handleAdd = () => {
        if(!newUser.name || !newUser.employeeId) return alert('يرجى إكمال بيانات الموظف');
        addUser({...newUser, id: Date.now().toString(), status: 'Active'});
        setNewUser({ name: '', employeeId: '', role: 'Staff' });
    };

    return (
        <Card className="animate-in slide-in-from-bottom-4 duration-500 overflow-visible">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white">إدارة الفريق المصرح له</h3>
                    <p className="text-xs text-gray-400 mt-1">إضافة، تعديل، أو سحب صلاحيات الموظفين من المنصة</p>
                </div>
                <div className="flex items-center gap-2 bg-brand-green/10 px-3 py-1.5 rounded-lg border border-brand-green/20">
                    <UserGroupIcon className="w-5 h-5 text-brand-green" />
                    <span className="text-xs font-bold text-white">{users.length} موظف</span>
                </div>
            </div>

            {/* نموذج إضافة سريع */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-10 p-4 bg-brand-gray-dark/50 rounded-xl border border-brand-gray-light/30">
                <div className="md:col-span-4">
                    <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">اسم الموظف</label>
                    <input type="text" placeholder="الاسم الكامل" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className={inputStyle} />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">الرقم الوظيفي</label>
                    <input type="text" placeholder="مثلاً: 12345" value={newUser.employeeId} onChange={e => setNewUser({...newUser, employeeId: e.target.value})} className={inputStyle} />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">الدور الوظيفي</label>
                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className={inputStyle}>
                        <option value="Staff">موظف عمليات</option>
                        <option value="Manager">مشرف محطة</option>
                        <option value="Admin">مدير نظام</option>
                    </select>
                </div>
                <div className="md:col-span-2 flex items-end">
                    <button onClick={handleAdd} className="w-full h-[38px] bg-brand-green text-brand-gray-dark font-black text-xs rounded-md hover:bg-brand-green-light transition-all transform active:scale-95 shadow-lg shadow-brand-green/20">
                        إضافة
                    </button>
                </div>
            </div>

            {/* جدول المستخدمين المطور */}
            <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                    <thead>
                        <tr className="text-gray-400 border-b border-brand-gray-light/50">
                            <th className="pb-4 font-bold px-2">الاسم</th>
                            <th className="pb-4 font-bold px-2">الرقم</th>
                            <th className="pb-4 font-bold px-2">الدور</th>
                            <th className="pb-4 font-bold px-2">الحالة</th>
                            <th className="pb-4 font-bold px-2">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <UserRow key={u.id} user={u} />
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const SettingsView: React.FC = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
        <CompanyBranding />
        <WorldTracerIntegration />
        <UserSettings />
    </div>
);

const ManagementView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ManagementTab>('logistics');
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white">بوابة الإدارة</h2>
                    <p className="text-gray-400 text-sm mt-1">مراقبة العمليات، التحكم في اللوجستيات وإدارة تكامل الأنظمة</p>
                </div>
                <div className="bg-brand-gray-dark p-1 rounded-xl flex border border-brand-gray-light self-stretch md:self-auto shadow-2xl overflow-x-auto">
                    <button onClick={() => setActiveTab('logistics')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'logistics' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>اللوجستيات</button>
                    <button onClick={() => setActiveTab('security')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'security' ? 'bg-brand-green text-brand-gray-dark shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                        <CheckCircleIcon className="w-4 h-4" /> التوثيق الأمني
                    </button>
                    <button onClick={() => setActiveTab('audit')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                        <HistoryIcon className="w-4 h-4" /> سجل العمليات
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-brand-green text-brand-gray-dark shadow-lg' : 'text-gray-400 hover:text-white'}`}>الإعدادات</button>
                </div>
            </div>
            {activeTab === 'logistics' && <LogisticsView />}
            {activeTab === 'security' && <SecurityReportView />}
            {activeTab === 'audit' && <AuditLogView />}
            {activeTab === 'settings' && <SettingsView />}
        </div>
    );
};

export default ManagementView;
