import React, { useContext } from 'react';
import { View } from '../types';
import { VIEW } from '../constants';
import { SettingsContext } from '../contexts/SettingsContext';

interface HeaderProps {
  setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ setCurrentView }) => {
  const settingsContext = useContext(SettingsContext);
  const logoUrl = settingsContext?.logoUrl;

  return (
    <header className="bg-brand-gray-dark/95 backdrop-blur-md text-white sticky top-0 z-40 border-b border-brand-green/20 shadow-2xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <button
            onClick={() => setCurrentView(VIEW.PASSENGER)}
            className="flex items-center space-x-5 space-x-reverse text-start group transition-all"
            aria-label="العودة إلى الصفحة الرئيسية للمبادرة"
          >
            <div className="relative">
                {logoUrl ? (
                    <img src={logoUrl} alt="شعار SGS" className="h-14 w-auto max-w-[220px] object-contain drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
                ) : (
                    <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center shadow-lg shadow-brand-green/20 group-hover:scale-110 transition-transform">
                        <span className="text-brand-gray-dark font-black text-xl">SGS</span>
                    </div>
                )}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-green rounded-full border-2 border-brand-gray-dark animate-pulse"></div>
            </div>
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight">نظام تتبع الأمتعة الذكي</h1>
                <p className="text-[10px] font-bold text-brand-green uppercase tracking-[0.2em] group-hover:text-white transition-colors">Strategic Internal Initiative 2025</p>
            </div>
          </button>
          
          <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">الوضع التشغيلي</span>
                  <span className="text-xs text-brand-green font-black flex items-center gap-2">
                      <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></span>
                      متصل بالبوابة الموحدة
                  </span>
              </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;