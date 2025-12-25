
import React from 'react';
import { View } from '../types';
import { VIEW } from '../constants';

interface FooterProps {
  setCurrentView: (view: View) => void;
}

const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  return (
    <footer className="bg-brand-gray-dark/90 backdrop-blur-sm text-white mt-auto border-t border-brand-gray-light shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Side: Platform Goals */}
          <div className="text-center md:text-start md:w-2/3">
            <h3 className="font-bold text-base text-white mb-2">أهداف المنصة</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              يهدف هذا النظام إلى تحسين تجربة الركاب وتقليل أوقات انتظار الأمتعة من خلال توفير تتبع فوري ودعم ذكي، مع تزويد الموظفين والإدارة بأدوات فعالة للمراقبة والتحكم الاستراتيجي.
            </p>
          </div>

          {/* Right Side: Portals and Copyright */}
          <div className="text-center md:text-end">
            <div className="flex justify-center md:justify-end items-center space-x-4 space-x-reverse mb-2">
              <button
                onClick={() => setCurrentView(VIEW.STAFF)}
                className="text-sm text-gray-300 hover:text-brand-green transition-colors duration-300"
              >
                بوابة الموظفين
              </button>
              <span className="text-gray-500">|</span>
              <button
                onClick={() => setCurrentView(VIEW.MANAGEMENT)}
                className="text-sm text-gray-300 hover:text-brand-green transition-colors duration-300"
              >
                بوابة الإدارة
              </button>
            </div>
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} الشركة السعودية للخدمات الأرضية. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
