
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

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(VIEW.PASSENGER);
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
