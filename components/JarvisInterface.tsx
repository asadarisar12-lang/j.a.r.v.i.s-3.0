import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Power, RefreshCw, Wifi, Activity, Terminal, ExternalLink, Zap, Shield, Thermometer } from 'lucide-react';
import { LiveClient } from '../services/liveClient';
import Reactor from './Reactor';
import { StatusPanel, Diagnostics } from './StatusPanel';
import { LogEntry } from '../types';

const JarvisInterface: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("SYSTEM STANDBY");
  const [volume, setVolume] = useState({ input: 0, output: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pendingLaunch, setPendingLaunch] = useState<{name: string, url: string} | null>(null);
  const [environment, setEnvironment] = useState({ temperature: 72, lights: 'ACTIVE', security: 'MAXIMUM' });
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<LiveClient | null>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setLogs(prev => [...prev.slice(-15), { timestamp: new Date(), message, type }]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleToolExecution = async (toolName: string, args: any) => {
    addLog(`PROTOCOL INITIATED: ${toolName.toUpperCase()}`, 'info');
    
    if (toolName === 'open_application') {
        const appName = args.appName.toLowerCase();
        let url = '';
        let confirmedName = args.appName;

        if (appName.includes('google')) url = 'https://www.google.com';
        else if (appName.includes('youtube')) url = 'https://www.youtube.com';
        else if (appName.includes('spotify')) url = 'https://open.spotify.com';
        else if (appName.includes('twitter') || appName.includes('x')) url = 'https://x.com';
        else if (appName.includes('github')) url = 'https://github.com';
        else if (appName.includes('maps')) url = 'https://maps.google.com';
        else if (appName.includes('news')) url = 'https://news.google.com';
        else if (appName.includes('openai')) url = 'https://chat.openai.com';
        else if (appName.includes('gemini')) url = 'https://gemini.google.com';
        
        if (url) {
            // Attempt to open
            const win = window.open(url, '_blank');
            if (win) {
                addLog(`LAUNCHING EXTERNAL INTERFACE: ${confirmedName.toUpperCase()}`, 'success');
                return "Application launched successfully.";
            } else {
                 addLog(`POPUP BLOCKED: ${confirmedName.toUpperCase()}`, 'warning');
                 setPendingLaunch({ name: confirmedName, url });
                 return "Authorization required for interface launch. Please confirm manually.";
            }
        } else {
            addLog(`APP UNKNOWN: ${confirmedName.toUpperCase()}`, 'warning');
            return "Application identifier not recognized in database.";
        }
    }

    if (toolName === 'run_diagnostics') {
        const system = args.system.toUpperCase();
        addLog(`DIAGNOSTIC SCAN: ${system}`, 'info');
        // Removed artificial delay for speed
        addLog(`SECTOR ${system}: INTEGRITY 100%`, 'success');
        return `Diagnostic complete for ${system}. All systems nominal.`;
    }

    if (toolName === 'set_environment') {
        const param = args.parameter.toLowerCase();
        const val = args.value;
        
        if (param.includes('temp')) {
            setEnvironment(prev => ({ ...prev, temperature: parseInt(val) || 72 }));
        } else if (param.includes('light')) {
            setEnvironment(prev => ({ ...prev, lights: val.toUpperCase() }));
        } else if (param.includes('security')) {
            setEnvironment(prev => ({ ...prev, security: val.toUpperCase() }));
        }

        addLog(`ENV UPDATE: ${param.toUpperCase()} -> ${val.toUpperCase()}`, 'success');
        return `Environment parameter ${param} set to ${val}.`;
    }

    return "Function executed.";
  };

  useEffect(() => {
    clientRef.current = new LiveClient(
      (input, output) => setVolume({ input, output }),
      (statusUpdate) => setStatus(statusUpdate),
      handleToolExecution
    );

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  const toggleConnection = async () => {
    if (connected) {
      clientRef.current?.disconnect();
      setConnected(false);
      setStatus("SYSTEM STANDBY");
      addLog("SESSION TERMINATED", 'warning');
    } else {
      try {
        await clientRef.current?.connect();
        setConnected(true);
        addLog("ESTABLISHING MAIN FRAME CONNECTION", 'info');
      } catch (e) {
        setStatus("CONNECTION FAILURE");
        setConnected(false);
        addLog("CONNECTION FAILED: CHECK NETWORK PROTOCOLS", 'warning');
      }
    }
  };

  const manualLaunch = () => {
      if (pendingLaunch) {
          window.open(pendingLaunch.url, '_blank');
          setPendingLaunch(null);
          addLog("MANUAL OVERRIDE: LAUNCH CONFIRMED", 'success');
      }
  }

  // Determine which level drives the reactor (highest priority)
  const reactorLevel = Math.max(volume.input, volume.output);

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto h-screen p-4 md:p-6 flex flex-col font-tech">
      {/* Header Bar */}
      <header className="flex justify-between items-start mb-6 border-b border-cyan-900/30 pb-4">
        <div className="flex flex-wrap gap-4 md:gap-8">
           <StatusPanel label="Protocol" value="LOW LATENCY" active={true} />
           <StatusPanel label="Security" value={environment.security} active={connected} />
           <StatusPanel label="Lang Support" value="ENG | URD | SND" active={connected} />
           <StatusPanel label="CPU Load" value={`${(12 + reactorLevel * 30).toFixed(1)}%`} active={connected} />
        </div>
        <div className="text-right hidden sm:block">
           <h2 className="text-4xl font-bold text-cyan-500 hologram-glow tracking-tighter">J.A.R.V.I.S.</h2>
           <div className="flex items-center justify-end gap-2 text-cyan-700 text-xs tracking-widest mt-1">
             <Wifi className={`w-3 h-3 ${connected ? 'text-cyan-400' : 'text-red-900'}`} />
             <span>{connected ? 'ONLINE' : 'OFFLINE'}</span>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center relative gap-8 w-full">
        
        {/* Left Data Column - System Logs */}
        <div className="hidden md:flex flex-col w-72 h-full justify-center gap-6">
           {/* Terminal Window */}
           <div className="border border-cyan-800/30 bg-black/60 p-4 rounded-lg flex-1 max-h-[60%] flex flex-col box-glow">
              <div className="flex items-center gap-2 text-cyan-500 mb-2 border-b border-cyan-800/50 pb-2">
                 <Terminal size={14} />
                 <span className="text-[10px] tracking-[0.2em] font-bold">SYSTEM_LOG</span>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-hide">
                 {logs.length === 0 && <span className="text-cyan-900 animate-pulse">WAITING FOR INPUT...</span>}
                 {logs.map((log, i) => (
                    <div key={i} className={`
                       leading-tight break-words
                       ${log.type === 'success' ? 'text-green-400' : ''}
                       ${log.type === 'warning' ? 'text-orange-400' : ''}
                       ${log.type === 'info' ? 'text-cyan-300/80' : ''}
                    `}>
                       <span className="opacity-30 mr-2">[{log.timestamp.toLocaleTimeString().split(' ')[0]}]</span>
                       {log.message}
                    </div>
                 ))}
                 <div ref={logsEndRef} />
              </div>
           </div>

           {/* Manual Launch Override Notification */}
           {pendingLaunch && (
             <div className="border border-orange-500/50 bg-orange-900/10 p-4 rounded-lg animate-pulse">
                <div className="text-orange-400 text-xs font-bold mb-2 flex items-center gap-2">
                    <Shield size={12} /> SECURITY OVERRIDE
                </div>
                <div className="text-orange-200/70 text-[10px] mb-3">
                    Browser protocol blocked automated launch of {pendingLaunch.name}.
                </div>
                <button 
                    onClick={manualLaunch}
                    className="w-full py-2 bg-orange-500/20 border border-orange-500/50 text-orange-400 text-xs hover:bg-orange-500/30 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <ExternalLink size={12} /> CONFIRM LAUNCH
                </button>
             </div>
           )}
        </div>

        {/* Central Reactor */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-[400px]">
          <div className="relative transform transition-transform duration-100" style={{ transform: `scale(${1 + reactorLevel * 0.1})` }}>
            <Reactor 
              isActive={connected} 
              outputLevel={volume.output} 
              inputLevel={volume.input}
            />
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-4 w-full text-center">
            <div className="inline-block bg-black/80 backdrop-blur-md border border-cyan-800/50 px-10 py-3 rounded-full box-glow shadow-[0_0_50px_rgba(0,240,255,0.1)]">
               <span className="font-mono text-cyan-300 tracking-[0.3em] text-sm animate-pulse uppercase flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${connected ? 'bg-cyan-400' : 'bg-red-500'} animate-ping`} />
                 {status}
               </span>
            </div>
          </div>
        </div>

        {/* Right Data Column - Environment & Diagnostics */}
        <div className="hidden md:flex flex-col w-72 h-full justify-center gap-6 text-right">
           
           {/* Environment Control Panel */}
           <div className="border border-cyan-800/30 bg-black/60 p-4 rounded-lg box-glow">
              <div className="flex items-center justify-end gap-2 text-cyan-500 mb-4 border-b border-cyan-800/50 pb-2">
                 <span className="text-[10px] tracking-[0.2em] font-bold">ENVIRONMENT</span>
                 <Zap size={14} />
              </div>
              <div className="space-y-4">
                  <div className="flex justify-between items-center group">
                      <span className="text-[10px] text-cyan-600 tracking-widest group-hover:text-cyan-400 transition-colors">TEMP</span>
                      <div className="flex items-center gap-2">
                          <span className="text-2xl text-cyan-300">{environment.temperature}°</span>
                          <Thermometer size={14} className="text-cyan-700" />
                      </div>
                  </div>
                  <div className="flex justify-between items-center group">
                      <span className="text-[10px] text-cyan-600 tracking-widest group-hover:text-cyan-400 transition-colors">LIGHTING</span>
                      <span className="text-md text-cyan-300 font-bold">{environment.lights}</span>
                  </div>
                  <div className="h-1 w-full bg-cyan-900/30 mt-2 overflow-hidden rounded-full">
                      <div className="h-full bg-cyan-500/50 w-2/3 animate-[pulse_3s_infinite]" />
                  </div>
              </div>
           </div>
           
           {/* Diagnostics Graph */}
           <div>
              <div className="text-[10px] text-cyan-600 tracking-[0.2em] mb-2 font-bold uppercase">System Integrity</div>
              <Diagnostics />
              <div className="mt-4 flex justify-end gap-2">
                <div className="px-2 py-1 bg-cyan-900/30 border border-cyan-700/30 rounded text-[9px] text-cyan-500">NET: 45ms</div>
                <div className="px-2 py-1 bg-cyan-900/30 border border-cyan-700/30 rounded text-[9px] text-cyan-500">MEM: 12TB</div>
              </div>
           </div>

        </div>

      </main>

      {/* Footer Controls */}
      <footer className="mt-auto flex justify-center items-center gap-8 relative py-8">
        {/* Decorative Lines */}
        <div className="absolute top-0 w-1/3 left-0 h-px bg-gradient-to-r from-transparent to-cyan-900/50"></div>
        <div className="absolute top-0 w-1/3 right-0 h-px bg-gradient-to-l from-transparent to-cyan-900/50"></div>
        
        <button 
          onClick={toggleConnection}
          className={`
            relative group flex items-center justify-center w-24 h-24 rounded-full border-2 transition-all duration-500
            ${connected 
              ? 'border-red-500/50 hover:border-red-400 hover:shadow-[0_0_50px_rgba(239,68,68,0.4)] bg-red-900/10' 
              : 'border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] bg-cyan-900/10'}
          `}
        >
          {/* Animated Ring */}
          <div className={`absolute inset-[-4px] rounded-full border border-dashed border-cyan-500/20 ${connected ? 'animate-spin' : ''} duration-[10s]`}></div>
          
          <div className={`absolute inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${connected ? 'bg-red-500/10' : 'bg-cyan-500/10'}`}></div>
          {connected ? <Power className="w-10 h-10 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]" /> : <Mic className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
        </button>
        
      </footer>
    </div>
  );
};

export default JarvisInterface;