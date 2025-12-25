
import React, { useState, useEffect } from 'react';

interface BaggageTimerProps {
  startTime: string; // ISO String
  limitHours?: number;
}

const BaggageTimer: React.FC<BaggageTimerProps> = ({ startTime, limitHours = 24 }) => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      setElapsed(Math.floor((now - start) / 1000));
    };

    calculate();
    const interval = setInterval(calculate, 60000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  
  const isExpired = hours >= limitHours;
  const isWarning = hours >= limitHours * 0.75;

  let colorClass = "bg-green-500/20 text-green-400 border-green-500/30";
  if (isExpired) colorClass = "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse";
  else if (isWarning) colorClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded border text-[10px] font-bold ${colorClass}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        {isExpired ? 'تجاوزت المهلة: ' : 'مدة البقاء: '}
        {hours}س {minutes}د
      </span>
    </div>
  );
};

export default BaggageTimer;
