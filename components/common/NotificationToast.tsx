
import React, { useEffect, useState } from 'react';
import { AppNotification } from '../../types';
import { BellIcon, CheckCircleIcon, SparklesIcon } from './icons';

interface NotificationToastProps {
    notification: AppNotification;
    onClose: (id: string) => void;
    lang?: 'ar' | 'en';
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose, lang = 'ar' }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(notification.id), 500);
        }, 6000);

        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    const getTypeStyles = () => {
        switch (notification.type) {
            case 'urgent': return 'bg-red-500/90 border-red-400 text-white';
            case 'success': return 'bg-green-600/90 border-green-400 text-white';
            case 'warning': return 'bg-yellow-500/90 border-yellow-300 text-brand-gray-dark';
            default: return 'bg-brand-gray-dark/95 border-brand-green/50 text-white';
        }
    };

    const isRtl = lang === 'ar';

    return (
        <div 
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md p-4 rounded-2xl border-2 shadow-2xl backdrop-blur-md transition-all duration-500 transform ${
                isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95'
            } ${getTypeStyles()}`}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-full animate-bounce">
                    {notification.type === 'success' ? <CheckCircleIcon className="w-6 h-6" /> : <BellIcon className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                    <h4 className="font-black text-sm mb-1">{notification.title}</h4>
                    <p className="text-xs font-medium opacity-90 leading-relaxed">{notification.message}</p>
                </div>
                <button 
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => onClose(notification.id), 500);
                    }}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full overflow-hidden rounded-b-2xl">
                <div className="h-full bg-white/60 animate-[progress_6s_linear]" />
            </div>
            <style>{`
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export default NotificationToast;
