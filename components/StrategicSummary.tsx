
import React, { useState } from 'react';
import Card from './common/Card';
import { SparklesIcon, CheckCircleIcon, ChartIcon, WorldIcon } from './common/icons';

const StrategicSummary: React.FC = () => {
  const [copySuccess, setCopySuccess] = useState(false);

  const executiveText = `
ملخص تنفيذي: مبادرة نظام تتبع الأمتعة الذكي (SGS)
----------------------------------------------
الرؤية: تحويل قسم الأمتعة إلى وحدة ذكية تتماشى مع رؤية 2030.
الحوكمة: نظام ذكي محمي ضد التلاعب (Prompt Injection) ومقيد ببيانات الحقيقة فقط.

الأهداف الاستراتيجية:
1. أتمتة عمليات الاستفسار بنسبة 60%.
2. رفع دقة المطابقة البصرية إلى 95%.
3. تقليل زمن الحل من 24 ساعة إلى أقل من 6 ساعات.

نظام الثقة (AI Trust):
- منع الهلوسة: المساعد لا يجيب إلا من واقع السجلات.
- حظر الروابط: لا يمكن للنظام إرسال روابط خارجية أو وهمية.
- التحقق المادي: الدردشة لا تعوض الفحص البصري والمطابقة الرسمية.
  `;

  const handleCopy = () => {
    navigator.clipboard.writeText(executiveText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-brand-green/20 pb-6 gap-4">
        <div className="text-right">
          <h2 className="text-3xl font-black text-white">الملخص التنفيذي الاستراتيجي</h2>
          <p className="text-brand-green font-medium">مشروع التحول الرقمي لقسم خدمات الأمتعة - SGS</p>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green/10 border border-brand-green/30 text-brand-green rounded-lg hover:bg-brand-green hover:text-brand-gray-dark transition-all font-bold text-sm"
        >
          {copySuccess ? 'تم النسخ ✓' : 'نسخ الملخص للتقرير الرسمي'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-brand-gray-dark/40 border-l-4 border-l-brand-green">
           <div className="flex items-center gap-3 mb-3">
              <SparklesIcon className="w-6 h-6 text-brand-green" />
              <h4 className="font-bold text-white">الرؤية الرقمية</h4>
           </div>
           <p className="text-xs text-gray-300 leading-relaxed">
             استبدال العمليات اليدوية بنظام ذكي يقلل الأخطاء البشرية ويوفر تجربة رقمية فاخرة تعزز مكانة SGS العالمية.
           </p>
        </Card>
        <Card className="bg-brand-gray-dark/40 border-l-4 border-l-blue-500">
           <div className="flex items-center gap-3 mb-3">
              <ChartIcon className="w-6 h-6 text-blue-500" />
              <h4 className="font-bold text-white">حوكمة الذكاء الاصطناعي</h4>
           </div>
           <p className="text-xs text-gray-300 leading-relaxed">
             النظام مقيد ببروتوكول "الحقيقة المطلقة"؛ المساعد لا يجتهد ولا يؤلف معلومات، بل ينقل البيانات الموثقة فقط.
           </p>
        </Card>
        <Card className="bg-brand-gray-dark/40 border-l-4 border-l-purple-500">
           <div className="flex items-center gap-3 mb-3">
              <WorldIcon className="w-6 h-6 text-purple-500" />
              <h4 className="font-bold text-white">نطاق التغطية</h4>
           </div>
           <p className="text-xs text-gray-300 leading-relaxed">
             يغطي المطار والمستودعات مع ربط آلي مع WorldTracer لضمان تكامل البيانات العابرة للحدود.
           </p>
        </Card>
      </div>

      {/* Comparison Section */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
           <ChartIcon className="w-5 h-5 text-brand-green" />
           خارطة التحول والسيطرة التشغيلية
        </h3>
        <div className="overflow-hidden rounded-xl border border-brand-gray-light shadow-2xl">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-brand-gray-dark/80 text-white border-b border-brand-gray-light">
                <th className="p-4">الوظيفة</th>
                <th className="p-4 text-red-400">الوضع السابق</th>
                <th className="p-4 text-brand-green">الوضع الاستراتيجي (SGS Smart)</th>
              </tr>
            </thead>
            <tbody className="bg-brand-gray/30">
              <tr className="border-b border-brand-gray-light/30">
                <td className="p-4 font-bold text-white">دقة المعلومات</td>
                <td className="p-4 text-gray-400">تعتمد على اجتهاد الموظف وسرعة رده.</td>
                <td className="p-4 text-gray-200">مقيدة ببروتوكول AI Factual (لا مجال للخطأ).</td>
              </tr>
              <tr className="border-b border-brand-gray-light/30">
                <td className="p-4 font-bold text-white">المطابقة الأمنية</td>
                <td className="p-4 text-gray-400">مطابقة وصف يدوي بسيط.</td>
                <td className="p-4 text-gray-200">تحليل بصري ذكي + تأكيد رسمي ثلاثي المراحل.</td>
              </tr>
              <tr className="border-b border-brand-gray-light/30">
                <td className="p-4 font-bold text-white">التحكم في التلاعب</td>
                <td className="p-4 text-gray-200 opacity-50">سهولة إقناع الموظف بالادعاءات.</td>
                <td className="p-4 text-brand-green font-bold">رفض آلي لأي ادعاء غير موثق بالصور والبيانات.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* KPIs */}
      <section className="bg-brand-gray-dark/60 p-6 rounded-2xl border border-brand-green/20">
         <h4 className="text-lg font-bold text-white mb-4">الأهداف التشغيلية الاستراتيجية</h4>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-brand-gray rounded-lg">
               <p className="text-[10px] text-gray-400 mb-1">أتمتة الاستفسارات</p>
               <p className="text-2xl font-black text-brand-green">60%+</p>
            </div>
            <div className="text-center p-3 bg-brand-gray rounded-lg">
               <p className="text-[10px] text-gray-400 mb-1">نسبة الخطأ التقني</p>
               <p className="text-2xl font-black text-blue-400">~0%</p>
            </div>
            <div className="text-center p-3 bg-brand-gray rounded-lg">
               <p className="text-[10px] text-gray-400 mb-1">زمن الإغلاق</p>
               <p className="text-2xl font-black text-purple-400">-70%</p>
            </div>
            <div className="text-center p-3 bg-brand-gray rounded-lg">
               <p className="text-[10px] text-gray-400 mb-1">التوفير السنوي</p>
               <p className="text-2xl font-black text-yellow-400">محسوب</p>
            </div>
         </div>
      </section>
    </div>
  );
};

export default StrategicSummary;
