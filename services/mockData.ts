
import { BaggageInfo, BaggageReport } from '../types';

export const mockBaggageInfo: BaggageInfo = {
  pir: 'JEDSV12345',
  status: "متأخرة - أُعيد توجيهها",
  currentLocation: "مطار لندن هيثرو (LHR)",
  nextStep: "مجدولة على رحلة GA458 إلى دبي (DXB) في 27 أكتوبر الساعة 9:00 صباحًا.",
  estimatedArrival: "27 أكتوبر 2024، حوالي الساعة 5:00 مساءً",
  history: [
    {
      timestamp: "2024-10-27 09:00",
      status: "مجدولة على الطائرة",
      location: "مطار لندن هيثرو (LHR)",
      details: "تمت جدولة الأمتعة على رحلة GA458 المتجهة إلى دبي.",
    },
    {
      timestamp: "2024-10-26 20:00",
      status: "تم تحديد الخطأ",
      location: "مطار لندن هيثرو (LHR)",
      details: "تم تحديد الأمتعة كـ 'موجهة بشكل خاطئ' وجاري إعادة توجيهها.",
    },
    {
      timestamp: "2024-10-26 17:45",
      status: "مسح ضوئي في منطقة النقل",
      location: "مطار لندن هيثرو (LHR)",
      details: "تم توجيهها بطريق الخطأ إلى رحلة BA283.",
    },
    {
      timestamp: "2024-10-26 17:00",
      status: "تم تفريغها من الطائرة",
      location: "مطار لندن هيثرو (LHR)",
      details: "تم تفريغ الأمتعة من رحلة GA123.",
    },
    {
      timestamp: "2024-10-26 10:00",
      status: "تسجيل الوصول",
      location: "مطار جون إف كينيدي (JFK)",
      details: "تم استلام الأمتعة عند كاونتر تسجيل الوصول.",
    },
  ],
  baggagePhotoUrl: 'https://images.unsplash.com/photo-1588795998132-73722cb34856?q=80&w=400',
  passengerPhotoUrl: 'https://images.unsplash.com/photo-1566433534342-2313a0a386b1?q=80&w=400',
  isConfirmedByPassenger: false,
};

const now = new Date();
export const mockStaffReports: BaggageReport[] = [
    { id: 'BG72398', passengerName: 'فاطمة الأحمدي', flight: 'SV122', status: 'Urgent', lastUpdate: new Date(now.getTime() - 5 * 60 * 1000), pir: 'JEDSV12345' },
    { id: 'BG10934', passengerName: 'محمد عبدالله', flight: 'EK204', status: 'In Progress', lastUpdate: new Date(now.getTime() - 45 * 60 * 1000), pir: 'DXBEK54321' },
    { id: 'BG58271', passengerName: 'سارة إبراهيم', flight: 'QR101', status: 'In Progress', lastUpdate: new Date(now.getTime() - 2 * 60 * 60 * 1000), pir: 'DOHQR98765' },
];

export const mockWorldTracerStaffReports: BaggageReport[] = [
    { id: 'WT_LIVE_01', passengerName: 'أحمد المصري', flight: 'LH630', status: 'Urgent', lastUpdate: new Date(now.getTime() - 2 * 60 * 1000), pir: 'FRALH65432' },
];

export const mockManagementData = {
  kpis: [
    { title: 'رضا الراكب (CSAT)', value: '88%', change: '+5.2%', trend: 'up' },
    { title: 'متوسط وقت الحل', value: '6.4 ساعة', change: '-1.2 ساعة', trend: 'down' },
    { title: 'دقة المطابقة البصرية', value: '94.8%', change: '+3.1%', trend: 'up' },
    { title: 'بلاغات نشطة حالياً', value: '142', change: '+12', trend: 'neutral' },
  ],
  customerSentiment: [
    { name: 'راضٍ جداً', value: 450, fill: '#10b981' },
    { name: 'راضٍ', value: 300, fill: '#34d399' },
    { name: 'محايد', value: 120, fill: '#94a3b8' },
    { name: 'غير راضٍ', value: 45, fill: '#f43f5e' },
  ],
  csatTrend: [
    { month: 'يناير', score: 82 },
    { month: 'فبراير', score: 84 },
    { month: 'مارس', score: 83 },
    { month: 'أبريل', score: 86 },
    { month: 'مايو', score: 88 },
  ],
  staffPerformance: [
    { name: 'أحمد السعدني', cases: 145, avgTime: '4.2 ساعة', rating: 4.9 },
    { name: 'نورة الفارس', cases: 132, avgTime: '4.8 ساعة', rating: 4.8 },
    { name: 'ياسر العتيبي', cases: 118, avgTime: '5.1 ساعة', rating: 4.7 },
    { name: 'ريم القحطاني', cases: 98, avgTime: '3.9 ساعة', rating: 4.9 },
  ],
  reportsOverTime: [
    { name: 'الأسبوع 1', value: 280 },
    { name: 'الأسبوع 2', value: 310 },
    { name: 'الأسبوع 3', value: 290 },
    { name: 'الأسبوع 4', value: 350 },
  ],
  averageResolutionTimeByStatus: [
    { name: 'عاجل', value: 4.5 },
    { name: 'قيد المتابعة', value: 18.2 },
    { name: 'تحتاج مراجعة', value: 12.5 },
    { name: 'معثور عليها', value: 3.8 },
  ],
};
