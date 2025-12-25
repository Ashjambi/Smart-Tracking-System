
import React from 'react';
import { BaggageInfo } from '../types';
import Card from './common/Card';

const TimelineStep: React.FC<{isFirst?: boolean}> = ({ isFirst = false }) => (
    <div className={`absolute -start-4 flex items-center justify-center w-8 h-8 rounded-full ring-8 ring-brand-gray border ${isFirst ? 'bg-brand-green border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'bg-brand-gray-light border-white/10'}`}>
        {/* تم حذف الأيقونة من داخل الدائرة */}
    </div>
);

interface BaggageTimelineProps {
    baggageInfo: BaggageInfo | null;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

const BaggageTimeline: React.FC<BaggageTimelineProps> = ({ baggageInfo, onRefresh, isRefreshing }) => {
    if (!baggageInfo) {
        return (
            <Card>
                <div className="text-center p-8">
                    <h3 className="font-bold text-lg mb-2 text-white">معلومات الأمتعة</h3>
                    <p className="text-gray-300">سيتم عرض مسار الأمتعة هنا بعد بدء المحادثة.</p>
                </div>
            </Card>
        );
    }

    const formatTimestamp = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString('ar-SA', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return timestamp;
        }
    };

    return (
        <div className="space-y-8">
            <Card className="border-cyan-400/20">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                    <h3 className="font-bold text-xl text-white">حالة الأمتعة الحالية</h3>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="px-4 py-1.5 rounded-full bg-brand-gray-light text-white text-xs font-bold border border-cyan-400/30 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] disabled:opacity-50 transition-all"
                        >
                            {isRefreshing ? 'جاري التحديث...' : 'تحديث البيانات'}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="space-y-1">
                        <p className="font-bold text-gray-200">الحالة:</p>
                        <p>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${ baggageInfo.status.includes('متأخرة') ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-green-500/20 text-green-200 border-cyan-400/30' }`}>
                                {baggageInfo.status}
                            </span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-gray-200">الموقع الحالي:</p>
                        <p className="text-gray-300">{baggageInfo.currentLocation}</p>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                        <p className="font-bold text-gray-200">الخطوة التالية:</p>
                        <p className="text-gray-300">{baggageInfo.nextStep}</p>
                    </div>
                     <div className="sm:col-span-2 space-y-1">
                        <p className="font-bold text-gray-200">الوصول المتوقع:</p>
                        <p className="text-gray-300">{baggageInfo.estimatedArrival}</p>
                    </div>
                </div>
            </Card>
            
            <Card className="border-cyan-400/20">
                <h3 className="font-bold text-xl text-white mb-6">سجل تتبع الأمتعة</h3>
                <ol className="relative border-s-2 border-brand-gray-light ms-4">
                    {baggageInfo.history.map((event, index) => (
                        <li key={index} className="mb-10 ms-8">
                            <TimelineStep isFirst={index === 0} />
                            <h4 className={`flex items-center mb-1 text-lg font-semibold ${index === 0 ? 'text-brand-green' : 'text-white'}`}>{event.status}</h4>
                            <time className="block mb-2 text-sm font-normal leading-none text-gray-400">{formatTimestamp(event.timestamp)} - {event.location}</time>
                            <p className="text-base text-gray-300">{event.details}</p>
                        </li>
                    ))}
                </ol>
            </Card>
        </div>
    );
};

export default BaggageTimeline;
