
import React, { useState, useRef } from 'react';
import Modal from './common/Modal';
import { BaggageRecord } from '../types';
import { CameraIcon } from './common/icons';
import { base64FromFile } from '../utils/imageUtils';

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTicketCreate: (newRecord: BaggageRecord) => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose, onTicketCreate }) => {
    const [formData, setFormData] = useState({
        pir: '',
        passengerName: '',
        flight: '',
        origin: '',
        destination: '',
        currentLocation: '',
        status: 'In Progress',
    });
    const [baggagePhoto, setBaggagePhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBaggagePhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!formData.pir || !formData.passengerName || !formData.flight) {
            setError('يرجى ملء الحقول المطلوبة: رقم البلاغ، اسم الراكب، ورقم الرحلة.');
            return;
        }

        let photoUrl = '';
        if (baggagePhoto) {
            photoUrl = await base64FromFile(baggagePhoto);
        }

        const newRecord: BaggageRecord = {
            PIR: formData.pir.toUpperCase(),
            PassengerName: formData.passengerName,
            Flight: formData.flight.toUpperCase(),
            Status: formData.status,
            LastUpdate: new Date().toISOString(),
            CurrentLocation: formData.currentLocation,
            Origin: formData.origin.toUpperCase(),
            Destination: formData.destination.toUpperCase(),
            NextStep: 'تم تسجيل البلاغ، في انتظار المراجعة الأولية.',
            EstimatedArrival: 'غير محدد بعد',
            History_1_Timestamp: new Date().toISOString(),
            History_1_Status: 'تم إنشاء البلاغ',
            History_1_Location: formData.currentLocation,
            History_1_Details: 'تم إنشاء البلاغ يدويًا بواسطة موظف.',
            History_2_Timestamp: '', History_2_Status: '', History_2_Location: '', History_2_Details: '',
            History_3_Timestamp: '', History_3_Status: '', History_3_Location: '', History_3_Details: '',
            BaggagePhotoUrl: photoUrl,
            IsConfirmedByPassenger: false,
        };

        onTicketCreate(newRecord);
        // Reset form for next time
        setFormData({ pir: '', passengerName: '', flight: '', origin: '', destination: '', currentLocation: '', status: 'In Progress' });
        setBaggagePhoto(null);
        setPhotoPreview(null);
    };
    
    const commonInputStyle = "w-full px-3 py-2 text-sm text-white bg-brand-gray border border-brand-gray-light rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green";
    const optionStyle = "bg-brand-gray-dark text-white";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="إنشاء بلاغ أمتعة جديد" size="3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Required Fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">رقم البلاغ (PIR) *</label>
                        <input type="text" name="pir" value={formData.pir} onChange={handleInputChange} className={commonInputStyle} placeholder="مثال: JEDSV12345" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">اسم الراكب *</label>
                        <input type="text" name="passengerName" value={formData.passengerName} onChange={handleInputChange} className={commonInputStyle} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">رقم الرحلة *</label>
                        <input type="text" name="flight" value={formData.flight} onChange={handleInputChange} className={commonInputStyle} placeholder="مثال: SV123" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">الحالة الأولية</label>
                         <select name="status" value={formData.status} onChange={handleInputChange} className={commonInputStyle}>
                            <option value="In Progress" className={optionStyle}>قيد المتابعة</option>
                            <option value="Needs Staff Review" className={optionStyle}>تحتاج مراجعة</option>
                            <option value="Urgent" className={optionStyle}>عاجل</option>
                        </select>
                    </div>

                    {/* Optional Fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">نقطة الإقلاع</label>
                        <input type="text" name="origin" value={formData.origin} onChange={handleInputChange} className={commonInputStyle} placeholder="مثال: JED" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">نقطة الوصول</label>
                        <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} className={commonInputStyle} placeholder="مثال: RUH" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-200 mb-1">الموقع الحالي للحقيبة</label>
                        <input type="text" name="currentLocation" value={formData.currentLocation} onChange={handleInputChange} className={commonInputStyle} placeholder="مثال: منطقة الفرز، مطار الملك خالد" />
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-200 mb-1">إرفاق صورة للحقيبة</label>
                         <div onClick={() => fileInputRef.current?.click()} className="mt-1 flex justify-center items-center h-40 px-6 pt-5 pb-6 border-2 border-brand-gray-light border-dashed rounded-md cursor-pointer hover:border-brand-green">
                            <div className="space-y-1 text-center">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="معاينة" className="mx-auto h-32 w-auto object-contain rounded-md" />
                                ) : (
                                    <>
                                        <CameraIcon className="mx-auto h-12 w-12 text-gray-500" />
                                        <p className="text-sm text-gray-400">انقر لرفع صورة</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handlePhotoChange}/>
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm font-semibold text-center">{error}</p>}

                <div className="pt-6 border-t border-brand-gray-light flex justify-end gap-4">
                     <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-brand-gray-light rounded-lg hover:bg-brand-gray">
                        إلغاء
                    </button>
                    <button type="submit" className="px-6 py-2 font-bold text-brand-gray-dark bg-brand-green rounded-lg hover:bg-brand-green-light transition-colors">
                        حفظ البلاغ
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateTicketModal;
