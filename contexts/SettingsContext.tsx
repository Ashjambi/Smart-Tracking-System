
import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, WorldTracerConfig, AuditEntry, AuditCategory } from '../types';

interface SettingsContextType {
    logoUrl: string | null;
    setLogoUrl: (url: string | null) => void;
    users: User[];
    addUser: (user: User) => void;
    removeUser: (userId: string) => void;
    updateUser: (userId: string, updates: Partial<User>) => void;
    wtConfig: WorldTracerConfig;
    updateWtConfig: (config: Partial<WorldTracerConfig>) => void;
    auditLogs: AuditEntry[];
    addAuditLog: (entry: Omit<AuditEntry, 'id' | 'timestamp' | 'ip'>) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const initialWtConfig: WorldTracerConfig = {
    agentId: '',
    stationCode: '',
    airlineCode: 'SV',
    apiKey: '',
    isConnected: false
};

const initialUsers: User[] = [
    { id: '1001', name: 'علي الغامدي', employeeId: '1001', role: 'Manager', status: 'Active' },
    { id: '1002', name: 'سارة عبدالله', employeeId: '1002', role: 'Staff', status: 'Active' },
];

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [logoUrl, setLogoUrlState] = useState<string | null>(() => {
        try {
            return localStorage.getItem('companyLogo');
        } catch {
            return null;
        }
    });
    
    const [users, setUsersState] = useState<User[]>(() => {
        try {
            const storedUsers = localStorage.getItem('companyUsers');
            return storedUsers ? JSON.parse(storedUsers) : initialUsers;
        } catch {
            return initialUsers;
        }
    });

    const [wtConfig, setWtConfig] = useState<WorldTracerConfig>(() => {
        try {
            const stored = localStorage.getItem('wtIntegration');
            return stored ? JSON.parse(stored) : initialWtConfig;
        } catch {
            return initialWtConfig;
        }
    });

    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => {
        try {
            const stored = localStorage.getItem('auditLogs');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            if (logoUrl) {
                localStorage.setItem('companyLogo', logoUrl);
            } else {
                localStorage.removeItem('companyLogo');
            }
        } catch (error) {
            console.error("Failed to save logo to localStorage:", error);
        }
    }, [logoUrl]);

    useEffect(() => {
        try {
            localStorage.setItem('companyUsers', JSON.stringify(users));
        } catch (error) {
            console.error("Failed to save users to localStorage:", error);
        }
    }, [users]);

    useEffect(() => {
        try {
            localStorage.setItem('wtIntegration', JSON.stringify(wtConfig));
        } catch (error) {
            console.error("Failed to save WT config to localStorage:", error);
        }
    }, [wtConfig]);

    useEffect(() => {
        try {
            localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
        } catch (error) {
            console.error("Failed to save audit logs to localStorage:", error);
        }
    }, [auditLogs]);
    
    const addAuditLog = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp' | 'ip'>) => {
        const newLog: AuditEntry = {
            ...entry,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            ip: '10.1.42.112' // Mock IP for demonstration
        };
        setAuditLogs(current => [newLog, ...current].slice(0, 5000)); // Increased capacity for "robust" logs
    }, []);

    const setLogoUrl = (url: string | null) => {
        setLogoUrlState(url);
        addAuditLog({
            user: 'System Admin',
            category: 'System',
            action: 'تغيير شعار الشركة',
            details: url ? 'تم تحميل شعار جديد لتخصيص واجهة المنصة' : 'تم حذف الشعار المخصص والعودة للوضع الافتراضي',
            status: 'Success'
        });
    };

    const addUser = useCallback((user: User) => {
        setUsersState(currentUsers => {
            if (currentUsers.some(u => u.employeeId === user.employeeId)) {
                alert('الرقم الوظيفي موجود مسبقاً.');
                return currentUsers;
            }
            addAuditLog({
                user: 'System Admin',
                category: 'Security',
                action: 'منح صلاحيات وصول',
                details: `تم إنشاء حساب جديد: ${user.name} بدور ${user.role}`,
                status: 'Success'
            });
            return [user, ...currentUsers];
        });
    }, [addAuditLog]);

    const removeUser = useCallback((userId: string) => {
        const userToRemove = users.find(u => u.id === userId);
        if(window.confirm('هل أنت متأكد من سحب كافة الصلاحيات من هذا الموظف؟')){
            setUsersState(currentUsers => currentUsers.filter(user => user.id !== userId));
            addAuditLog({
                user: 'System Admin',
                category: 'Security',
                action: 'سحب صلاحيات وصول',
                details: `تم حذف حساب الموظف: ${userToRemove?.name || userId}`,
                status: 'Success'
            });
        }
    }, [users, addAuditLog]);

    const updateUser = useCallback((userId: string, updates: Partial<User>) => {
        const userToUpdate = users.find(u => u.id === userId);
        setUsersState(currentUsers => currentUsers.map(u => 
            u.id === userId ? { ...u, ...updates } : u
        ));
        addAuditLog({
            user: 'System Admin',
            category: 'Security',
            action: 'تعديل بيانات مستخدم',
            details: `تحديث ${Object.keys(updates).join(', ')} للموظف ${userToUpdate?.name}`,
            status: 'Success'
        });
    }, [users, addAuditLog]);

    const updateWtConfig = useCallback((updates: Partial<WorldTracerConfig>) => {
        setWtConfig(current => ({ ...current, ...updates }));
        if (updates.isConnected !== undefined) {
             addAuditLog({
                user: 'System Admin',
                category: 'System',
                action: 'تكامل WorldTracer',
                details: updates.isConnected ? 'نجاح مصادقة الاتصال مع النظام العالمي' : 'فشل محاولة الربط مع خادم WorldTracer',
                status: updates.isConnected ? 'Success' : 'Failed'
            });
        }
    }, [addAuditLog]);

    return (
        <SettingsContext.Provider value={{ 
            logoUrl, setLogoUrl, users, addUser, removeUser, updateUser,
            wtConfig, updateWtConfig, auditLogs, addAuditLog
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
