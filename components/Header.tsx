
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
    <header className="bg-brand-gray-dark/90 backdrop-blur-sm text-white sticky top-0 z-40 border-b border-brand-gray-light shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button
            onClick={() => setCurrentView(VIEW.PASSENGER)}
            className="flex items-center space-x-4 space-x-reverse text-start group"
            aria-label="العودة إلى الصفحة الرئيسية للركاب"
          >
            {logoUrl && <img src={logoUrl} alt="شعار الشركة" className="h-12 w-auto max-w-[200px] object-contain" />}
            <div>
                <h1 className="text-xl font-bold text-white">نظام تتبع الأمتعة الذكي</h1>
                <p className="text-xs text-gray-300 group-hover:text-white transition-colors">مقدم من الشركة السعودية للخدمات الأرضية</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
