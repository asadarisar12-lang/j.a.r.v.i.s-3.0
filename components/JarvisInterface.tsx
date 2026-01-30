
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal, Cpu, Activity, Search, Shield, Zap, MessageSquare, Globe, Radar, BarChart3, Wifi } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { LiveClient } from '../services/liveClient';
import Reactor from './Reactor';
import { StatusPanel, Diagnostics } from './StatusPanel';
import HolographicWindow from './HolographicWindow';
import { LogEntry } from '../types';

interface AppWindow {
  id: string;
  title: string;
  type: string;
  content?: any;
}

const JarvisInterface: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("DORMANT");
  const [volume, setVolume] = useState({ input: 0, output: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [transcription, setTranscription] = useState<{text: string, isUser: boolean} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const clientRef = useRef<LiveClient | null>(null);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setLogs(prev => [...prev.slice(-8), { timestamp: new Date(), message: message.toUpperCase(), type }]);
  }, []);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    addLog(`INITIATING GLOBAL SEARCH: ${query}`, 'info');
    
    const id = Date.now().toString();
    const newWindow: AppWindow = { id, title: `RESULT: ${query.slice(0, 15)}`, type: 'SEARCH', content: { text: "Accessing Global Matrix satellite uplink...", sources: [] } };
    setWindows(prev => [newWindow, ...prev]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "Database returned null.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Data Node",
        uri: chunk.web?.uri || "#"
      })) || [];

      setWindows(prev => prev.map(w => w.id === id ? { ...w, content: { text, sources } } : w));
      addLog(`SEARCH COMPLETE`, 'success');
    } catch (error) {
      console.error("Search failed:", error);
      setWindows(prev => prev.map(w => w.id === id ? { ...w, content: { text: "ACCESS DENIED: Satellite link interrupted.", sources: [] } } : w));
      addLog(`SEARCH FAILED`, 'warning');
    } finally {
      setIsSearching(false);
    }
  };

  const handleToolExecution = async (toolName: string, args: any) => {
    if (toolName === 'type_text') {
      try { await navigator.clipboard.writeText(args.content); } catch (e) {}
      addLog(`BUFFER SYNCED TO CLIPBOARD`, 'success');
      return "Clipboard updated, Sir.";
    }

    if (toolName === 'launch_app') {
      const id = Date.now().toString();
      const appName = args.app_id.toUpperCase();
      let type = 'TERMINAL';
      
      if (appName.includes('SECURITY')) type = 'SECURITY';
      else if (appName.includes('MAP')) type = 'MAPS';
      else if (appName.includes('HEALTH') || appName.includes('VITAL')) type = 'HEALTH';
      else if (appName.includes('WEATHER')) type = 'SEARCH'; // Reuse search for weather

      setWindows(prev => [{ id, title: appName, type }, ...prev].slice(0, 4));
      addLog(`MODULE ${appName} DEPLOYED`, 'success');
      return `Very good, Sir. The ${appName} interface is live.`;
    }

    if (toolName === 'web_search') {
      performSearch(args.query);
      return "Searching the global matrix now. One moment, Sir.";
    }

    return "Awaiting next command.";
  };

  useEffect(() => {
    clientRef.current = new LiveClient(
      (input, output) => setVolume({ input, output }),
      (statusUpdate) => setStatus(statusUpdate),
      (text, isUser) => setTranscription({ text, isUser }),
      handleToolExecution
    );

    return () => clientRef.current?.disconnect();
  }, [addLog]);

  const toggleConnection = async () => {
    if (connected) {
      clientRef.current?.disconnect();
      setConnected(false);
      setStatus("DORMANT");
      setWindows([]);
      setTranscription(null);
    } else {
      try {
        await clientRef.current?.connect();
        setConnected(true);
        addLog("SYSTEM BOOT SEQUENCE COMPLETE", "success");
      } catch (e) {
        setStatus("BOOT ERROR");
        setConnected(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      setSearchQuery("");
    }
  };

  return (
    <div className="relative z-10 w-full max-w-full mx-auto h-screen p-6 flex flex-col font-tech select-none overflow-hidden">
      {/* Corner Brackets Decorations */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-cyan-500/30"></div>
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-cyan-500/30"></div>
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-cyan-500/30"></div>
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-cyan-500/30"></div>

      <header className="flex justify-between items-start mb-6 border-b border-cyan-500/20 pb-4">
        <div className="flex gap-6">
           <StatusPanel label="SYSTEM" value="V2.5" active={connected} />
           <StatusPanel label="USER" value="ASAD" active={true} />
           <div className="hidden lg:flex flex-col border-l-2 border-cyan-500/30 pl-3 py-1">
              <span className="text-[10px] tracking-widest text-cyan-600 font-bold uppercase">LINK STATUS</span>
              <div className="flex items-center gap-1">
                 <Wifi size={12} className={connected ? "text-cyan-400" : "text-cyan-900"} />
                 <span className="text-xs text-cyan-500/60 uppercase">Encrypted</span>
              </div>
           </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-8 relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ACCESS GLOBAL MATRIX DATABASE..."
            className="w-full bg-cyan-950/10 border border-cyan-500/20 rounded-none py-2 px-10 text-xs text-cyan-400 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-400/50 focus:bg-cyan-950/20 transition-all uppercase tracking-widest font-tech"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-700" size={14} />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1 h-3 bg-cyan-500 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          )}
        </form>

        <div className="text-right">
           <h2 className="text-3xl font-black text-cyan-400 hologram-glow uppercase tracking-tighter leading-none">J.A.R.V.I.S.</h2>
           <div className="text-[8px] text-cyan-600 tracking-[0.4em] uppercase font-bold mt-1">Matrix v2.5 // Stark Ind.</div>
        </div>
      </header>

      <main className="flex-1 relative flex">
        {/* Left HUD Panel */}
        <aside className="w-48 hidden xl:flex flex-col gap-8 py-10 opacity-60">
           <div className="space-y-4">
              <div className="text-[10px] text-cyan-700 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <Radar size={12} /> SCANNING...
              </div>
              <div className="h-20 border border-cyan-500/10 bg-cyan-950/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent animate-pulse" />
                <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400/50 animate-[scan_2s_linear_infinite]" />
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="text-[10px] text-cyan-700 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <BarChart3 size={12} /> SYSTEM LOAD
              </div>
              <Diagnostics />
           </div>
        </aside>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          {connected && transcription && (
            <div className="absolute top-0 w-full max-w-2xl text-center z-30 pointer-events-none">
              <div className="inline-flex items-start gap-3 bg-black/60 border border-cyan-500/20 px-8 py-4 rounded-none backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.1)]">
                <MessageSquare size={16} className={transcription.isUser ? "text-cyan-600 mt-1" : "text-cyan-400 mt-1 animate-pulse"} />
                <div className="flex flex-col items-start text-left">
                  <span className="text-[9px] uppercase tracking-widest text-cyan-600 font-bold mb-1">
                    {transcription.isUser ? "USER IDENTIFIED" : "JARVIS_VOICE_OUT"}
                  </span>
                  <p className="text-cyan-100 text-sm font-medium leading-relaxed max-w-lg">
                    {transcription.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="cursor-pointer relative z-20 group" onClick={toggleConnection}>
            <Reactor isActive={connected} outputLevel={volume.output} inputLevel={volume.input} />
            {!connected && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-black/80 border border-cyan-500/30 px-8 py-3 font-bold text-cyan-400 text-sm animate-pulse tracking-[0.3em] uppercase group-hover:bg-cyan-500 group-hover:text-black transition-all">
                   INITIATE
                 </div>
              </div>
            )}
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
             <div className="inline-flex items-center gap-4 bg-cyan-950/20 border border-cyan-500/10 px-6 py-2 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-cyan-400 shadow-[0_0_10px_#00f0ff]' : 'bg-red-800 animate-pulse'}`} />
                <span className="text-cyan-400 tracking-[0.3em] text-[10px] uppercase font-bold">{status}</span>
             </div>
             {connected && (
               <div className="flex gap-2">
                 <div className="text-[10px] text-cyan-800 uppercase animate-pulse">Neural Link: 98%</div>
                 <div className="text-[10px] text-cyan-800 uppercase animate-pulse delay-500">Biometric: Sync</div>
               </div>
             )}
          </div>
        </div>

        {/* Right HUD Panel */}
        <aside className="w-48 hidden xl:flex flex-col items-end gap-8 py-10 opacity-60">
           <div className="space-y-4 w-full">
              <div className="text-[10px] text-cyan-700 font-bold uppercase tracking-[0.2em] flex items-center justify-end gap-2">
                ACTIVE PROTOCOLS <Activity size={12} />
              </div>
              <div className="space-y-1">
                {['MARK_42', 'HOUSE_PARTY', 'VERONICA'].map(p => (
                   <div key={p} className="text-[9px] text-cyan-900 border-r border-cyan-900/50 pr-2 text-right hover:text-cyan-500 cursor-help transition-colors">{p} // STANDBY</div>
                ))}
              </div>
           </div>
        </aside>

        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {windows.map((win, idx) => (
            <div key={win.id} className="absolute pointer-events-auto transition-all duration-500" style={{ left: 10 + (idx * 30), top: 80 + (idx * 25) }}>
              <HolographicWindow 
                id={win.id} 
                title={win.title} 
                type={win.type} 
                content={win.content} 
                onClose={() => setWindows(prev => prev.filter(w => w.id !== win.id))} 
              />
            </div>
          ))}
        </div>
      </main>

      <footer className="h-24 flex items-end justify-between border-t border-cyan-500/10 mt-6 pt-4">
         <div className="flex-1 overflow-hidden relative group">
           <div className="absolute left-0 top-0 text-[8px] text-cyan-700/50 uppercase tracking-widest font-bold mb-2">Internal Log Stream</div>
           <div className="flex flex-col-reverse h-16 pt-4 overflow-hidden">
             {logs.map((log, i) => (
               <div key={i} className={`text-[10px] font-mono tracking-wider mb-0.5 ${log.type === 'success' ? 'text-cyan-400' : log.type === 'warning' ? 'text-red-500' : 'text-cyan-800'}`}>
                 [{log.timestamp.toLocaleTimeString()}] >> {log.message}
               </div>
             ))}
           </div>
         </div>
         <div className="flex flex-col items-end">
            <div className="flex gap-4 mb-2">
              <Cpu size={14} className="text-cyan-900" />
              <Shield size={14} className="text-cyan-900" />
              <Terminal size={14} className="text-cyan-900" />
            </div>
            <div className="text-[10px] text-cyan-900 tracking-[0.5em] uppercase font-bold">STARK INDUSTRIES // {new Date().getFullYear()}</div>
         </div>
      </footer>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(80px); }
        }
      `}</style>
    </div>
  );
};

export default JarvisInterface;
