
import React, { memo } from 'react';

interface ReactorProps {
  isActive: boolean;
  outputLevel: number;
  inputLevel: number;
}

const Reactor: React.FC<ReactorProps> = memo(({ isActive, outputLevel, inputLevel }) => {
  const intensity = isActive ? 0.3 + (outputLevel * 0.7) + (inputLevel * 0.2) : 0.05;
  const scale = 1 + (outputLevel * 0.15);
  const rotation = isActive ? 'animate-[spin_10s_linear_infinite]' : '';

  return (
    <div className="relative w-72 h-72 flex items-center justify-center transition-transform duration-300" style={{ transform: `scale(${scale})` }}>
      {/* Outer Static Frame */}
      <div className="absolute inset-0 rounded-full border border-cyan-500/5 shadow-[inset_0_0_30px_rgba(0,240,255,0.02)]"></div>
      
      {/* Orbiting Tech Rings */}
      <div className={`absolute inset-4 rounded-full border-t border-b border-cyan-400/20 ${rotation}`} />
      <div className={`absolute inset-8 rounded-full border-l border-r border-cyan-500/10 animate-[spin_15s_linear_infinite_reverse]`} />
      
      {/* Pulsing Core Glow */}
      <div 
        className="absolute w-40 h-40 rounded-full transition-all duration-150 blur-2xl"
        style={{
          background: `radial-gradient(circle, rgba(0,240,255,${intensity}) 0%, transparent 70%)`,
          opacity: isActive ? 1 : 0.1
        }}
      ></div>

      {/* Center Core Structure */}
      <div className={`relative w-28 h-28 rounded-full border-2 border-cyan-400/40 flex items-center justify-center bg-cyan-950/10 backdrop-blur-md shadow-[0_0_40px_rgba(0,240,255,0.1)] overflow-hidden ${!isActive ? 'grayscale opacity-20' : ''}`}>
        {/* Reactor Fins */}
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-1 h-8 bg-cyan-400/20" 
            style={{ 
              transform: `rotate(${i * 30}deg) translateY(-20px)`,
              opacity: isActive ? 0.8 : 0.1
            }} 
          />
        ))}
        
        {/* The Central Light Source */}
        <div className={`w-14 h-14 rounded-full transition-all duration-300 ${isActive ? 'bg-cyan-100 shadow-[0_0_50px_#00f0ff,0_0_100px_rgba(0,240,255,0.5)]' : 'bg-cyan-900/40'}`}>
           <div className="w-full h-full rounded-full border-4 border-white/20 animate-pulse" />
        </div>
      </div>

      {/* Tech Elements Visualizer */}
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 8" className="text-cyan-500" />
        {isActive && (
          <>
            <circle 
              cx="50" cy="50" 
              r={40 + outputLevel * 5} 
              fill="none" stroke="currentColor" 
              strokeWidth="0.5" 
              className="text-cyan-300 transition-all duration-75" 
            />
            <path 
              d="M50,10 L50,15 M90,50 L85,50 M50,90 L50,85 M10,50 L15,50" 
              stroke="#00f0ff" strokeWidth="1" 
            />
          </>
        )}
      </svg>
    </div>
  );
});

export default Reactor;
