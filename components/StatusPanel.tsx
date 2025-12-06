import React, { useEffect, useState } from 'react';

interface StatusPanelProps {
  label: string;
  value: string | number;
  active?: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ label, value, active }) => (
  <div className="flex flex-col border-l-2 border-cyan-500/30 pl-3 py-1 bg-gradient-to-r from-cyan-900/10 to-transparent">
    <span className="text-[10px] tracking-widest text-cyan-600 font-bold uppercase">{label}</span>
    <span className={`font-tech text-lg ${active ? 'text-cyan-300 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]' : 'text-cyan-800'}`}>
      {value}
    </span>
  </div>
);

export const Diagnostics: React.FC = () => {
  const [randomData, setRandomData] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRandomData(Array.from({ length: 8 }, () => Math.random()));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-1 h-8 items-end opacity-70">
      {randomData.map((h, i) => (
        <div 
          key={i} 
          className="bg-cyan-500/40 w-full transition-all duration-200"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
};