import React, { useState } from 'react';
import Jarvis from './components/Jarvis';
import { Activity, ShieldCheck, Cpu, Fingerprint } from 'lucide-react';

const App: React.FC = () => {
  const [isSystemReady, setIsSystemReady] = useState(false);

  const initializeSystem = () => {
    setIsSystemReady(true);
  };

  if (!isSystemReady) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80"></div>
        
        <div className="z-10 text-center space-y-8 p-8 border border-cyan-900/50 rounded-2xl bg-black/40 backdrop-blur-md box-glow max-w-md w-full mx-4">
          <div className="space-y-2">
            <h1 className="text-5xl font-tech font-bold text-cyan-400 hologram-glow tracking-widest">J.A.R.V.I.S.</h1>
            <p className="text-cyan-700 font-medium tracking-[0.2em] text-sm uppercase">Just A Rather Very Intelligent System</p>
          </div>
          
          <div className="flex justify-center space-x-4 text-cyan-600">
            <Cpu className="w-6 h-6 animate-pulse" />
            <Activity className="w-6 h-6 animate-pulse delay-75" />
            <ShieldCheck className="w-6 h-6 animate-pulse delay-150" />
          </div>

          <div className="flex flex-col items-center gap-2 py-4">
             <Fingerprint className="w-12 h-12 text-cyan-500/80 animate-pulse" />
             <div className="text-xs text-cyan-500/60 font-mono tracking-widest">BIOMETRICS RECOGNIZED</div>
             <div className="text-lg text-cyan-100 font-bold font-tech tracking-wider uppercase drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
                ASAD ARISAR
             </div>
          </div>

          <button
            onClick={initializeSystem}
            className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-md border border-cyan-500/50 transition-all hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] w-full"
          >
            <div className="absolute inset-0 w-0 bg-cyan-500/10 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
            <span className="relative text-cyan-400 font-tech tracking-wider group-hover:text-cyan-200">ENGAGE PROTOCOLS</span>
          </button>
          
          <div className="text-[10px] text-cyan-900 font-mono pt-4">
            SECURE SERVER // LOCALHOST // RESTRICTED ACCESS
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-cyan-100 overflow-hidden relative selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black -z-10"></div>
      
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
      
      <Jarvis />
    </div>
  );
};

export default App;