
import React, { useState } from 'react';
import Card from './common/Card';
import { SparklesIcon, CheckCircleIcon, ChartIcon, WorldIcon } from './common/icons';

const StrategicSummary: React.FC = () => {
  const [copySuccess, setCopySuccess] = useState(false);

  const executiveText = `
ملخص تنفيذي: مبادرة نظام تتبع الأمتعة الذكي (SGS)
----------------------------------------------
الرؤية: تحويل قسم الأمتعة إلى وحدة ذكية تتماشى مع رؤية 2030.
الحوكمة: نظام ذكي محمي ضد التلاعب ومقيد ببيانات الحقيقة فقط.

الأهداف الاستراتيجية:
1. أتمتة عمليات الاستفسار بنسبة 60%.
2. رفع دقة المطابقة البصرية إلى 95%.
3. تقليل زمن الحل من 24 ساعة إلى أقل من 6 ساعات.
  `;

  const handleCopy = () => {
    navigator.clipboard.writeText(executiveText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700 max-w-5xl mx-auto pb-20 relative">
      {/* Confidential Watermark */}
      <div className="absolute top-40 left-1/2 -translate-x-1/2 -rotate-12 pointer-events-none opacity-[0.03] select-none z-0">
        <h1 className="text-[12rem] font-black text-white whitespace-nowrap">SGS STRATEGIC</h1>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-brand-green/30 pb-6 gap-4 relative z-10">
        <div className="text-right">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase shadow-lg shadow-red-600/20">Secret / Confidential</span>
            <span className="bg-brand-green/20 text-brand-green text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest border border-brand-green/30">v1.0 Internal Strategic Doc</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">وثيقة المبادرة الاستراتيجية</h2>
          <p className="text-brand-green font-bold text-lg mt-1">مشروع التحول الرقمي الذكي - وحدة الأمتعة 2025</p>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-6 py-3 bg-brand-green text-brand-gray-dark rounded-xl hover:bg-brand-green-light transition-all font-black text-sm shadow-xl shadow-brand-green/20 transform hover:-translate-y-1 active:scale-95"
        >
          {copySuccess ? 'تم النسخ بنجاح ✓' : 'تصدير الملخص التنفيذي'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <Card className="bg-gradient-to-br from-brand-gray-dark to-brand-gray border-l-4 border-l-brand-green shadow-2xl hover:shadow-brand-green/10 transition-shadow">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-green/20 rounded-lg">
                <SparklesIcon className="w-6 h-6 text-brand-green" />
              </div>
              <h4 className="font-black text-white text-lg">الرؤية الرقمية</h4>
           </div>
           <p className="text-sm text-gray-300 leading-relaxed font-medium">
             تطوير منظومة ذكية متكاملة تقلل الاعتماد على التدخل البشري في رصد التناقضات، مما يضمن دقة تشغيلية تليق بالمعايير العالمية للشركة السعودية للخدمات الأرضية (SGS).
           </p>
        </Card>
        
        <Card className="bg-gradient-to-br from-brand-gray-dark to-brand-gray border-l-4 border-l-blue-500 shadow-2xl hover:shadow-blue-500/10 transition-shadow">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ChartIcon className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="font-black text-white text-lg">حوكمة الـ AI</h4>
           </div>
           <p className="text-sm text-gray-300 leading-relaxed font-medium">
             تطبيق معايير أمنية صارمة تمنع استجابات الذكاء الاصطناعي خارج نطاق "بيانات الحقيقة الموثقة" لضمان أقصى درجات الموثوقية القانونية والتشغيلية.
           </p>
        </Card>

        <Card className="bg-gradient-to-br from-brand-gray-dark to-brand-gray border-l-4 border-l-purple-500 shadow-2xl hover:shadow-purple-500/10 transition-shadow">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <WorldIcon className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="font-black text-white text-lg">الاستدامة التشغيلية</h4>
           </div>
           <p className="text-sm text-gray-300 leading-relaxed font-medium">
             المنصة مصممة للتوسع والربط البرمجي مع كافة مطارات المملكة الرئيسية، لدعم نمو حركة المسافرين المتوقعة ضمن استراتيجية الطيران الوطنية.
           </p>
        </Card>
      </div>

      <section className="space-y-6 relative z-10">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
           <div className="w-2 h-8 bg-brand-green rounded-full"></div>
           مصفوفة القيمة المضافة للإدارة التنفيذية
        </h3>
        <div className="overflow-hidden rounded-2xl border border-brand-green/20 shadow-2xl bg-brand-gray-dark/50 backdrop-blur-md">
          <table className="w-full text-right text-base">
            <thead>
              <tr className="bg-brand-gray-dark/80 text-white border-b border-brand-green/20">
                <th className="p-5 font-black uppercase tracking-wider text-sm">المجال التشغيلي</th>
                <th className="p-5 text-red-400 font-bold bg-red-400/5 text-sm">المنهجية التقليدية</th>
                <th className="p-5 text-brand-green font-bold bg-brand-green/5 text-sm">مبادرة SGS Smart (المقترحة)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-light/30">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-5 font-bold text-white">دقة التحقق البصري</td>
                <td className="p-5 text-gray-400">تعتمد على ملاحظة الموظف (نسبة خطأ 15%).</td>
                <td className="p-5 text-gray-100 font-medium">مطابقة ثنائية (Dual-View AI) بدقة تصل لـ 98%.</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-5 font-bold text-white">رضا العميل (Passenger)</td>
                <td className="p-5 text-gray-400">انتظار طويل عبر الهاتف أو الكاونتر.</td>
                <td className="p-5 text-gray-100 font-medium">خدمة ذاتية فورية 24/7 عبر القنوات الرقمية.</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-5 font-bold text-white font-black text-brand-green">العائد على الاستثمار (ROI)</td>
                <td className="p-5 text-gray-400">تكاليف تشغيلية مرتفعة وهدر زمني.</td>
                <td className="p-5 text-brand-green font-black">تحسين الكفاءة بنسبة 40% وتقليص زمن الحل.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="bg-gradient-to-r from-brand-gray-dark to-brand-gray border border-brand-green/30 p-8 rounded-3xl shadow-2xl relative z-10 overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>
         <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-2 text-center md:text-right">
               <h4 className="text-xl font-black text-white">الأثر الاستراتيجي المستهدف 2025</h4>
               <p className="text-gray-400 text-sm">تم تحديد هذه المستهدفات بناءً على تحليل الاحتياجات التشغيلية للتحول الرقمي.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
               <div className="bg-brand-gray-dark/80 px-6 py-4 rounded-2xl border border-brand-green/20 text-center min-w-[140px] shadow-lg">
                  <p className="text-[10px] text-brand-green font-black uppercase mb-1">أتمتة ذكية</p>
                  <p className="text-3xl font-black text-white">75%</p>
               </div>
               <div className="bg-brand-gray-dark/80 px-6 py-4 rounded-2xl border border-blue-500/20 text-center min-w-[140px] shadow-lg">
                  <p className="text-[10px] text-blue-400 font-black uppercase mb-1">دقة الفرز</p>
                  <p className="text-3xl font-black text-white">99%</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StrategicSummary;
