import React from 'react';

interface ReactorProps {
  isActive: boolean;
  outputLevel: number; // 0 to 1
  inputLevel: number; // 0 to 1
}

const Reactor: React.FC<ReactorProps> = ({ isActive, outputLevel, inputLevel }) => {
  // Enhance the visual impact of the audio levels
  const activeScale = 1 + (outputLevel * 0.5) + (inputLevel * 0.2);
  const glowIntensity = 0.5 + (outputLevel * 1.5) + (inputLevel * 0.5);
  
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer Ring Static */}
      <div className={`absolute inset-0 rounded-full border-4 border-cyan-900 opacity-50 ${isActive ? 'animate-[spin_10s_linear_infinite]' : ''}`}></div>
      
      {/* Outer Ring Detail */}
      <div className={`absolute inset-2 rounded-full border-2 border-dashed border-cyan-700 opacity-60 ${isActive ? 'animate-[spin_15s_linear_infinite_reverse]' : ''}`}></div>

      {/* Middle Rotating Segment */}
      <div className="absolute inset-8 rounded-full border border-cyan-500/30"></div>
      
      {/* The Core */}
      <div 
        className="absolute inset-0 rounded-full transition-all duration-75 ease-out"
        style={{
          background: `radial-gradient(circle, rgba(200,255,255,${glowIntensity}) 0%, rgba(0,240,255,${glowIntensity * 0.6}) 40%, rgba(0,0,0,0) 70%)`,
          transform: `scale(${isActive ? activeScale : 1})`,
          opacity: isActive ? 1 : 0.3
        }}
      ></div>

      {/* Core Structure */}
      <div className="absolute w-24 h-24 rounded-full border-4 border-white/80 shadow-[0_0_20px_#00f0ff] z-10 flex items-center justify-center bg-cyan-400/10 backdrop-blur-sm">
         <div className="w-16 h-16 rounded-full border-2 border-cyan-200 opacity-80"></div>
      </div>
      
      {/* Triangle Geometry Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg className="w-full h-full p-6 animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100">
           <polygon points="50,10 90,90 10,90" fill="none" stroke="rgba(0,240,255,0.3)" strokeWidth="0.5" />
           <polygon points="50,90 90,10 10,10" fill="none" stroke="rgba(0,240,255,0.3)" strokeWidth="0.5" />
        </svg>
      </div>

    </div>
  );
};

export default Reactor;