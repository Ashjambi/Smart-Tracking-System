
import React, { useContext, useEffect, useState } from 'react';
import { View } from '../types';
import { VIEW } from '../constants';
import { SettingsContext } from '../contexts/SettingsContext';
import { isAiReady } from '../services/geminiService';

interface HeaderProps {
  setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ setCurrentView }) => {
  const settingsContext = useContext(SettingsContext);
  const [aiStatus, setAiStatus] = useState<'connected' | 'checking'>('checking');
  const logoUrl = settingsContext?.logoUrl;

  useEffect(() => {
      const check = async () => {
          const ready = await isAiReady();
          setAiStatus(ready ? 'connected' : 'checking');
      };
      check();
      const interval = setInterval(check, 10000); // Re-check periodically
      return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-brand-dark/95 backdrop-blur-xl text-white sticky top-0 z-50 border-b border-brand-green/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-24">
          <button
            onClick={() => setCurrentView(VIEW.PASSENGER)}
            className="flex items-center space-x-6 space-x-reverse text-start group transition-transform active:scale-95"
            aria-label="العودة للمبادرة"
          >
            <div className="relative">
                {logoUrl ? (
                    <img src={logoUrl} alt="SGS" className="h-14 w-auto max-w-[200px] object-contain drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]" />
                ) : (
                    <div className="w-14 h-14 bg-brand-green rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)] group-hover:rotate-6 transition-transform">
                        <span className="text-brand-dark font-black text-2xl">SGS</span>
                    </div>
                )}
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-4 border-brand-dark shadow-[0_0_10px_rgba(52,211,153,1)] ${aiStatus === 'connected' ? 'bg-brand-green animate-pulse' : 'bg-yellow-500 animate-bounce'}`}></div>
            </div>
            <div className="hidden sm:block">
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">تتبع الأمتعة الذكي</h1>
                <p className="text-[10px] font-bold text-brand-green uppercase tracking-[0.25em] mt-1 opacity-80">Strategic Initiative 2025</p>
            </div>
          </button>
          
          <div className="flex items-center gap-8">
              <div className="hidden lg:flex flex-col items-end border-r border-white/10 pr-6 mr-6">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Operational Status</span>
                  <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${aiStatus === 'connected' ? 'bg-brand-green animate-pulse' : 'bg-yellow-500'}`}></span>
                      <span className={`text-xs font-bold ${aiStatus === 'connected' ? 'text-brand-green' : 'text-yellow-500'}`}>
                          {aiStatus === 'connected' ? 'Secure AI Engine Active' : 'Waiting for AI Link'}
                      </span>
                  </div>
              </div>
              
              <div className="flex gap-4">
                  <button 
                    onClick={() => setCurrentView(VIEW.PASSENGER)} 
                    className="px-5 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-brand-green transition-colors"
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => setCurrentView(VIEW.MANAGEMENT)} 
                    className="bg-brand-green/10 text-brand-green border border-brand-green/30 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-green hover:text-brand-dark transition-all shadow-lg"
                  >
                    Executive Dashboard
                  </button>
              </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
