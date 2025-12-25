
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
     * تحديث سجل في قاعدة البيانات مع ضمان المزامنة اللحظية الشاملة لبروتوكول "التسليم الأمني"
     */
    const updateBaggageRecord = useCallback(async (pir: string, updates: Partial<BaggageRecord>) => {
        const searchPir = pir.trim().toUpperCase();
        const now = updates.LastUpdate || new Date().toISOString();
        
        // 1. تحديث قاعدة بيانات الـ Local (Excel/Memory)
        setBaggageData(currentData => {
            if (!currentData) return null;
            const exists = currentData.some(r => r.PIR.toUpperCase() === searchPir);
            
            // إضافة السجل إذا لم يكن موجوداً محلياً (سجل قادم من Tracer)
            if (!exists && updates.PIR) {
                return [{ ...updates, PIR: searchPir, LastUpdate: now } as BaggageRecord, ...currentData];
            }
            
            return currentData.map(record => {
                if (record.PIR.toUpperCase() === searchPir) {
                    return { ...record, ...updates, LastUpdate: now };
                }
                return record;
            });
        });

        // 2. تحديث قائمة التقارير (wtReports) لضمان الاستجابة الفورية لواجهة الموظفين
        setWtReports(currentReports => {
            const index = currentReports.findIndex(r => r.pir.toUpperCase() === searchPir);
            
            if (index === -1) {
                const newReport: BaggageReport = {
                    id: searchPir,
                    passengerName: (updates as any).PassengerName || 'Unknown',
                    flight: (updates as any).Flight || 'N/A',
                    pir: searchPir,
                    status: (updates.Status as any) || 'In Progress',
                    lastUpdate: new Date(now)
                };
                return [newReport, ...currentReports];
            }
            
            return currentReports.map(report => {
                if (report.pir.toUpperCase() === searchPir) {
                    return {
                        ...report,
                        status: (updates.Status as any) || report.status,
                        lastUpdate: new Date(now)
                    };
                }
                return report;
            });
        });

        // 3. المزامنة الإجبارية مع النظام العالمي WorldTracer عند التسليم أو تفعيل النمط
        if (dataSource === DATA_SOURCE_MODE.WORLDTRACER || updates.Status === 'Delivered') {
            try {
                await updateGlobalRecord(searchPir, { ...updates, LastUpdate: now });
                console.info(`[STRATEGIC-SYNC] Record ${searchPir} synchronized successfully with global node.`);
            } catch (error) {
                console.error("[WT-SYNC-ERROR] Critical sync failure:", error);
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
