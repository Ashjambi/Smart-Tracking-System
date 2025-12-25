
import React, { useState, useContext, useEffect } from 'react';
import Header from './components/Header';
import PassengerView from './components/PassengerView';
import StaffView from './components/StaffView';
import ManagementView from './components/ManagementView';
import { VIEW } from './constants';
import { View } from './types';
import { BaggageDataProvider } from './contexts/BaggageDataContext';
import Footer from './components/Footer';
import { SettingsProvider, SettingsContext } from './contexts/SettingsContext';
import { isAiReady } from './services/geminiService';
import Card from './components/common/Card';
import { SparklesIcon } from './components/common/icons';

const ApiKeyGate: React.FC<{ onAuthorized: () => void }> = ({ onAuthorized }) => {
    const [loading, setLoading] = useState(true);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const check = async () => {
            const ready = await isAiReady();
            if (ready) {
                onAuthorized();
            } else {
                setLoading(false);
                setShowButton(true);
            }
        };
        check();
    }, [onAuthorized]);

    const handleAuthorize = async () => {
        if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            // حسب التعليمات، نفترض النجاح وننتقل للتطبيق
            onAuthorized();
        } else {
            alert("Strategic Error: AI Studio Gateway not found. Please ensure your Cloudflare API_KEY environment variable is set.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark text-white p-8">
            <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-brand-green font-bold animate-pulse">Initializing Strategic AI Systems...</p>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-strategic p-6">
            <Card className="max-w-md w-full text-center space-y-6 border-brand-green/30 shadow-2xl bg-brand-dark/90 backdrop-blur-xl">
                <div className="w-20 h-20 bg-brand-green/10 rounded-3xl flex items-center justify-center mx-auto border border-brand-green/20">
                    <SparklesIcon className="w-10 h-10 text-brand-green" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">بوابة SGS الاستراتيجية</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">يرجى تفويض خدمات الذكاء الاصطناعي للبدء في تتبع وإدارة الأمتعة عبر النظام الموحد.</p>
                </div>
                
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-200 text-right leading-relaxed">
                    <p className="font-bold mb-1">تنبيه تقني:</p>
                    مفتاح API غير محقون تلقائياً. يرجى اختيار مفتاح صالح من "قائمة المشاريع المدفوعة" لتفعيل المبادرة.
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block mt-2 text-brand-green underline">وثائق الفوترة والدفع</a>
                </div>

                <button 
                    onClick={handleAuthorize}
                    className="w-full py-4 bg-brand-green text-brand-gray-dark font-black rounded-2xl hover:bg-brand-green-light transition-all shadow-xl shadow-brand-green/20 transform active:scale-95"
                >
                    تفعيل الخدمات الذكية الذاتية
                </button>
                
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">SGS Digital Transformation 2025</p>
            </Card>
        </div>
    );
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(VIEW.PASSENGER);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const settings = useContext(SettingsContext);

  const handleViewChange = (view: View) => {
    if (view !== VIEW.PASSENGER) {
      settings?.addAuditLog({
        user: 'Anonymous (Admin Access)',
        category: 'Security',
        action: 'دخول إلى بوابة إدارية',
        details: `تم طلب الوصول إلى بوابة: ${view === VIEW.STAFF ? 'الموظفين' : 'الإدارة'}`,
        status: 'Info'
      });
    }
    setCurrentView(view);
  };

  if (!isAuthorized) {
    return <ApiKeyGate onAuthorized={() => setIsAuthorized(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case VIEW.STAFF:
        return <StaffView />;
      case VIEW.MANAGEMENT:
        return <ManagementView />;
      case VIEW.PASSENGER:
      default:
        return <PassengerView />;
    }
  };

  return (
    <BaggageDataProvider>
      <div className="min-h-screen font-sans flex flex-col text-gray-200 bg-brand-gray-dark/40 backdrop-blur-[2px]">
        <Header setCurrentView={handleViewChange} />
        <main className="p-4 sm:p-6 lg:p-8 flex-grow container mx-auto">
          {renderView()}
        </main>
        <Footer setCurrentView={handleViewChange} />
      </div>
    </BaggageDataProvider>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;
