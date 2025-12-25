
import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { BaggageRecord, DataSourceMode, BaggageReport } from '../types';
import { DATA_SOURCE_MODE } from '../constants';
import { updateGlobalRecord } from '../services/worldTracerService';

interface BaggageDataContextType {
    baggageData: BaggageRecord[] | null;
    setBaggageData: (data: BaggageRecord[]) => void;
    wtReports: BaggageReport[];
    setWtReports: (reports: BaggageReport[]) => void;
    fileName: string | null;
    setFileName: (name: string | null) => void;
    dataSource: DataSourceMode;
    setDataSource: (mode: DataSourceMode) => void;
    updateBaggageRecord: (pir: string, updates: Partial<BaggageRecord>) => Promise<void>;
    addBaggageRecord: (record: BaggageRecord) => void;
}

export const BaggageDataContext = createContext<BaggageDataContextType | undefined>(undefined);

export const BaggageDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [baggageData, setBaggageData] = useState<BaggageRecord[] | null>(null);
    const [wtReports, setWtReports] = useState<BaggageReport[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<DataSourceMode>(DATA_SOURCE_MODE.EXCEL);

    const handleSetDataSource = (mode: DataSourceMode) => {
        setDataSource(mode);
    };

    /**
     * تحديث سجل في قاعدة البيانات مع ضمان المزامنة اللحظية (Reactive Update)
     */
    const updateBaggageRecord = useCallback(async (pir: string, updates: Partial<BaggageRecord>) => {
        const searchPir = pir.trim().toUpperCase();
        const now = updates.LastUpdate || new Date().toISOString();
        
        // 1. تحديث قاعدة بيانات الـ Excel المحملة (للمزامنة الداخلية)
        setBaggageData(currentData => {
            if (!currentData) return null;
            return currentData.map(record => {
                if (record.PIR.trim().toUpperCase() === searchPir) {
                    return { ...record, ...updates, LastUpdate: now };
                }
                return record;
            });
        });

        // 2. تحديث قائمة التقارير (wtReports) التي يعتمد عليها StaffView لرسم البطاقات
        // هذا يضمن أن البطاقة ستتغير حالتها فور إغلاق النافذة المنبثقة أو حتى قبلها
        setWtReports(currentReports => {
            const updatedReports = currentReports.map(report => {
                if (report.pir.trim().toUpperCase() === searchPir) {
                    return {
                        ...report,
                        status: (updates.Status as any) || report.status,
                        lastUpdate: new Date(now)
                    };
                }
                return report;
            });
            // العودة بنسخة جديدة لضمان تفاعل React
            return [...updatedReports];
        });

        // 3. تحديث السجل في الخادم العالمي إذا كان النمط نشطاً
        if (dataSource === DATA_SOURCE_MODE.WORLDTRACER) {
            try {
                await updateGlobalRecord(searchPir, { ...updates, LastUpdate: now });
            } catch (error) {
                console.error("[WT-ERROR] Failed to update global record:", error);
            }
        }
    }, [dataSource]);

    const addBaggageRecord = useCallback((record: BaggageRecord) => {
        const formattedRecord = { ...record, PIR: record.PIR.toUpperCase() };
        
        setBaggageData(currentData => [formattedRecord, ...(currentData || [])]);
        
        const newReport: BaggageReport = {
            id: formattedRecord.PIR,
            passengerName: formattedRecord.PassengerName,
            flight: formattedRecord.Flight,
            pir: formattedRecord.PIR,
            status: formattedRecord.Status as any,
            lastUpdate: new Date()
        };
        setWtReports(current => [newReport, ...current]);
    }, []);

    return (
        <BaggageDataContext.Provider value={{ 
            baggageData, setBaggageData, 
            wtReports, setWtReports,
            fileName, setFileName,
            dataSource, setDataSource: handleSetDataSource,
            updateBaggageRecord,
            addBaggageRecord
        }}>
            {children}
        </BaggageDataContext.Provider>
    );
};
