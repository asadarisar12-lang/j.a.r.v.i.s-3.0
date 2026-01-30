
import React, { useState, useEffect } from 'react';
import { X, Terminal, Shield, Map, Search, Globe, ExternalLink, Zap, Heart, Activity, Crosshair } from 'lucide-react';

interface WindowProps {
  id: string;
  title: string;
  type: string;
  content?: any;
  onClose: () => void;
}

const HolographicWindow: React.FC<WindowProps> = ({ title, type, content, onClose }) => {
  const [typedContent, setTypedContent] = useState("");
  const [mockValue, setMockValue] = useState(0);
  
  useEffect(() => {
    if (type === 'SEARCH' && content?.text) {
      let i = 0;
      const interval = setInterval(() => {
        setTypedContent(content.text.slice(0, i));
        i += 3;
        if (i > content.text.length) {
          setTypedContent(content.text);
          clearInterval(interval);
        }
      }, 10);
      return () => clearInterval(interval);
    }
  }, [content, type]);

  useEffect(() => {
    const timer = setInterval(() => setMockValue(Math.random()), 1500);
    return () => clearInterval(timer);
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'SECURITY': return <Shield size={14} />;
      case 'MAPS': return <Map size={14} />;
      case 'SEARCH': return <Search size={14} />;
      case 'HEALTH': return <Heart size={14} />;
      default: return <Terminal size={14} />;
    }
  };

  const renderModuleContent = () => {
    switch (type) {
      case 'SEARCH':
        return (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap leading-relaxed text-cyan-300/90 font-sans text-xs">
              {typedContent}
              {typedContent.length < (content?.text?.length || 0) && <span className="inline-block w-1 h-3 bg-cyan-400 ml-1 animate-pulse" />}
            </div>
            {content?.sources?.length > 0 && (
              <div className="pt-4 border-t border-cyan-900/50">
                <div className="flex items-center gap-2 mb-2 text-[8px] text-cyan-600 tracking-widest uppercase font-bold">
                  <Globe size={10} /> Matrix Nodes
                </div>
                <div className="space-y-1.5">
                  {content.sources.map((source: any, i: number) => (
                    <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group p-2 rounded bg-cyan-900/10 border border-cyan-500/10 hover:border-cyan-400/50 transition-all">
                      <span className="truncate max-w-[180px] text-cyan-400 group-hover:text-cyan-100 text-[10px]">{source.title}</span>
                      <ExternalLink size={10} className="text-cyan-700 group-hover:text-cyan-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'HEALTH':
        return (
          <div className="space-y-6 flex flex-col items-center">
            <div className="w-full flex justify-between items-center text-[10px] text-cyan-600 font-bold border-b border-cyan-900/30 pb-2">
              <span>BIOMETRIC SCAN</span>
              <span>USER: ASAD ARISAR</span>
            </div>
            <div className="relative py-4 flex flex-col items-center">
               <Heart size={48} className={`text-red-600/60 animate-pulse duration-[${600 + Math.floor(mockValue * 400)}ms]`} />
               <div className="text-4xl font-black text-cyan-100 mt-2">74 <span className="text-xs text-cyan-600">BPM</span></div>
            </div>
            <div className="w-full space-y-2">
               <div className="flex justify-between text-[9px]">
                  <span className="text-cyan-700">NEURAL SYNC</span>
                  <span className="text-cyan-400">98.4%</span>
               </div>
               <div className="h-1 bg-cyan-950 w-full overflow-hidden">
                  <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: '98%' }} />
               </div>
               <div className="flex justify-between text-[9px] pt-2">
                  <span className="text-cyan-700">OXYGEN SAT</span>
                  <span className="text-cyan-400">99.1%</span>
               </div>
               <div className="h-1 bg-cyan-950 w-full overflow-hidden">
                  <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: '99%' }} />
               </div>
            </div>
            <div className="text-[8px] text-cyan-900 font-mono">STATUS: OPTIMAL CONDITION</div>
          </div>
        );

      case 'SECURITY':
        return (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-video bg-black/40 border border-cyan-500/20 relative group overflow-hidden">
                 <div className="absolute top-1 left-1 text-[7px] text-cyan-500/80 font-bold">CAM_{i.toString().padStart(2, '0')}</div>
                 <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#00f0ff_3px)]" />
                 <div className="absolute bottom-1 right-1 flex gap-1">
                    <div className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
                    <span className="text-[7px] text-red-600 uppercase font-bold">LIVE</span>
                 </div>
                 <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Crosshair size={12} className="text-cyan-400" />
                 </div>
              </div>
            ))}
            <div className="col-span-2 pt-4 border-t border-cyan-900/50">
               <div className="text-[8px] text-cyan-600 uppercase mb-1 font-bold">Threat Assessment</div>
               <div className="text-[10px] text-cyan-400 font-mono">No hostiles detected in proximity.</div>
            </div>
          </div>
        );

      case 'MAPS':
        return (
          <div className="h-full flex flex-col space-y-4">
             <div className="flex-1 bg-cyan-950/20 border border-cyan-500/10 relative overflow-hidden group">
                {/* SVG Mock Wireframe Map */}
                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
                   <path d="M0,50 L100,50 M50,0 L50,100" stroke="#00f0ff" strokeWidth="0.2" />
                   <circle cx="50" cy="50" r="30" fill="none" stroke="#00f0ff" strokeWidth="0.1" strokeDasharray="2" />
                   <circle cx="45" cy="40" r="1" fill="#00f0ff" className="animate-ping" />
                </svg>
                <div className="absolute top-2 left-2 text-[8px] text-cyan-500/60 font-mono">
                   LAT: 34.0522 N<br/>LONG: 118.2437 W
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="text-[10px] text-cyan-400/20 font-bold tracking-widest uppercase">Global Positioning</div>
                </div>
             </div>
             <div className="space-y-1">
                <div className="text-[8px] text-cyan-600 uppercase font-bold">Location Tracking</div>
                <div className="text-[10px] text-cyan-300">Target identified: Malibu Point</div>
             </div>
          </div>
        );

      default:
        return (
          <div className="font-mono text-[10px] space-y-1">
             <div className="text-cyan-600">> JARVIS_INIT_PROTOCOLS...</div>
             <div className="text-cyan-600">> NEURAL_LINK_STABLE: [OK]</div>
             <div className="text-cyan-600">> ACCESSING_STARK_SERVER...</div>
             <div className="text-cyan-400 animate-pulse">> {title} ONLINE.</div>
             <div className="pt-4 text-cyan-900">Awaiting input, Sir. Matrix interface ready for command.</div>
          </div>
        );
    }
  };

  return (
    <div className="w-80 h-[28rem] bg-black/90 backdrop-blur-2xl border border-cyan-500/40 rounded-none flex flex-col shadow-[0_0_60px_rgba(0,240,255,0.1)] overflow-hidden animate-in zoom-in duration-300">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-900/50 bg-cyan-950/40 relative">
        <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-400 w-12" />
        <div className="flex items-center gap-2 text-cyan-400">
          {getIcon()}
          <span className="text-[10px] tracking-[0.2em] font-black uppercase">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onClose} className="p-1 hover:bg-cyan-500 group transition-colors">
            <X size={10} className="text-cyan-700 group-hover:text-black" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5 font-tech text-[11px] text-cyan-100 overflow-y-auto scrollbar-hide">
        {renderModuleContent()}
      </div>

      {/* Footer Decoration */}
      <div className="px-4 py-2 border-t border-cyan-900/30 flex justify-between items-center bg-cyan-950/20">
         <div className="text-[7px] text-cyan-800 tracking-[0.3em] uppercase font-bold">LINK: GLOBAL MATRIX</div>
         <div className="flex gap-2">
            <Activity size={10} className="text-cyan-900" />
            <Zap size={10} className="text-cyan-400 animate-pulse" />
         </div>
      </div>
    </div>
  );
};

export default HolographicWindow;
