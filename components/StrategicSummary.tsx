import React, { useState } from 'react';
import Card from './common/Card';
import { SparklesIcon, CheckCircleIcon, ChartIcon, WorldIcon } from './common/icons';

const StrategicSummary: React.FC = () => {
  const [copySuccess, setCopySuccess] = useState(false);

  const executiveText = `
ملخص تنفيذي: مبادرة نظام تتبع الأمتعة الذكي (SGS)
----------------------------------------------
الرؤية: تحويل العمليات الأرضية إلى خدمات ذكية تتماشى مع رؤية المملكة 2030.
الحوكمة: نظام تدقيق ذكي محمي ببروتوكولات أمنية متقدمة.

الأهداف الاستراتيجية:
1. تقليص الفجوة الزمنية في استجابة خدمة العملاء بنسبة 80%.
2. رفع معدل النجاح في المطابقة البصرية للأمتعة المفقودة إلى 97%.
3. خفض التكاليف التشغيلية المتعلقة بالأمتعة الضائعة بنسبة 35% سنوياً.
  `;

  const handleCopy = () => {
    navigator.clipboard.writeText(executiveText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-6xl mx-auto pb-24 relative overflow-hidden">
      {/* Decorative Strategic Lines */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-green/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-brand-green/20 pb-8 gap-6 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="bg-red-600/90 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase shadow-lg shadow-red-600/20">CONFIDENTIAL / INTERNAL USE ONLY</span>
            <span className="text-brand-green font-mono text-[10px] uppercase tracking-widest border border-brand-green/30 px-3 py-1 rounded-full">Project: Smart-Audit-2025</span>
          </div>
          <h2 className="text-5xl font-black text-white leading-tight">الوثيقة الاستراتيجية للمبادرة</h2>
          <p className="text-brand-green/80 font-bold text-xl">نظام التتبع اللوجستي المدعوم بالذكاء الاصطناعي | SGS Digital Hub</p>
        </div>
        <button 
          onClick={handleCopy}
          className="group relative flex items-center gap-3 px-8 py-4 bg-brand-green text-brand-gray-dark rounded-2xl hover:bg-brand-green-light transition-all font-black text-sm shadow-2xl shadow-brand-green/30 overflow-hidden"
        >
          <span className="relative z-10">{copySuccess ? 'تم النسخ بنجاح ✓' : 'تصدير التقرير التنفيذي'}</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        </button>
      </div>

      {/* Strategic Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <Card className="bg-brand-dark/80 border-t-4 border-t-brand-green hover:translate-y-[-4px] transition-all">
           <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green border border-brand-green/20">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <h4 className="font-black text-white text-xl">التميز التشغيلي</h4>
           </div>
           <p className="text-gray-300 leading-relaxed font-medium text-sm">
             أتمتة شاملة لعمليات التحقق والمطابقة، مما يقلل هامش الخطأ البشري في منطقة فرز الأمتعة ويضمن انسيابية الحركة اللوجستية في المطارات الرئيسية.
           </p>
        </Card>
        
        <Card className="bg-brand-dark/80 border-t-4 border-t-blue-500 hover:translate-y-[-4px] transition-all">
           <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <ChartIcon className="w-7 h-7" />
              </div>
              <h4 className="font-black text-white text-xl">حوكمة البيانات</h4>
           </div>
           <p className="text-gray-300 leading-relaxed font-medium text-sm">
             تطبيق بروتوكول "التدقيق المزدوج" عبر الذكاء الاصطناعي، حيث لا يتم تأكيد أي بلاغ إلا بمطابقة بصرية ومعلوماتية مشفرة لضمان أمن ممتلكات المسافرين.
           </p>
        </Card>

        <Card className="bg-brand-dark/80 border-t-4 border-t-purple-500 hover:translate-y-[-4px] transition-all">
           <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                <WorldIcon className="w-7 h-7" />
              </div>
              <h4 className="font-black text-white text-xl">النمو الاستراتيجي</h4>
           </div>
           <p className="text-gray-300 leading-relaxed font-medium text-sm">
             بناء بنية تحتية رقمية قابلة للتوسع عالمياً، تدعم طموح الشركة السعودية للخدمات الأرضية في قيادة الحلول اللوجستية الذكية في منطقة الشرق الأوسط.
           </p>
        </Card>
      </div>

      {/* Comparison Matrix */}
      <section className="space-y-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-2 bg-brand-green rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
          <h3 className="text-3xl font-black text-white">مقارنة الأداء والجدول الزمني</h3>
        </div>
        
        <div className="overflow-hidden rounded-3xl border border-brand-green/20 glass-card">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-brand-green/5 text-white border-b border-brand-green/20">
                <th className="p-6 font-black text-sm uppercase">مؤشر الأداء الرئيسي (KPI)</th>
                <th className="p-6 text-red-400 font-bold bg-red-400/5">النظام الحالي</th>
                <th className="p-6 text-brand-green font-black bg-brand-green/10">مبادرة SGS Smart 2025</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-6 font-bold text-white">متوسط وقت حل البلاغ</td>
                <td className="p-6 text-gray-400">18 - 24 ساعة</td>
                <td className="p-6 text-brand-green font-black">أقل من 4 ساعات</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-6 font-bold text-white">دقة التعرف البصري</td>
                <td className="p-6 text-gray-400">يدوي (دقة 60-70%)</td>
                <td className="p-6 text-brand-green font-black">آلي (دقة +97%)</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-6 font-bold text-white">تفاعل المسافر</td>
                <td className="p-6 text-gray-400">سلبي (انتظار رد الموظف)</td>
                <td className="p-6 text-brand-green font-black">تفاعلي (خدمة ذاتية ذكية 24/7)</td>
              </tr>
              <tr className="bg-brand-green/5">
                <td className="p-6 font-black text-brand-green">العائد على الاستثمار المتوقع</td>
                <td className="p-6 text-gray-400 italic">تكاليف متزايدة</td>
                <td className="p-6 text-brand-green font-black text-xl">توفير 40% من النفقات اللوجستية</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Strategic Footer Card */}
      <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-brand-gray/40 to-brand-dark/80 border border-brand-green/30 shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
         <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
            <div className="space-y-3 text-center md:text-right flex-1">
               <h4 className="text-2xl font-black text-white">المستهدفات الاستراتيجية الختامية</h4>
               <p className="text-gray-400 text-sm leading-relaxed max-w-xl">تم تصميم هذا النظام ليكون حجر الزاوية في التحول الرقمي للشركة، مع الالتزام الكامل بمعايير أمن المعلومات والخصوصية المعمول بها محلياً ودولياً.</p>
            </div>
            <div className="flex gap-6">
               <div className="p-6 bg-brand-dark rounded-3xl border border-brand-green/20 text-center shadow-2xl">
                  <p className="text-[10px] text-brand-green font-black uppercase mb-2 tracking-widest">معدل التحول</p>
                  <p className="text-4xl font-black text-white">85%</p>
               </div>
               <div className="p-6 bg-brand-dark rounded-3xl border border-blue-500/20 text-center shadow-2xl">
                  <p className="text-[10px] text-blue-400 font-black uppercase mb-2 tracking-widest">رضا المستخدم</p>
                  <p className="text-4xl font-black text-white">4.9/5</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StrategicSummary;