
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Power, RefreshCw, Wifi, Activity, Terminal, ExternalLink, Zap, Shield, Thermometer, UserCheck, Camera, CameraOff, Scan, Eye } from 'lucide-react';
import { LiveClient } from '../services/liveClient';
import Reactor from './Reactor';
import { StatusPanel, Diagnostics } from './StatusPanel';
import CameraFeed from './CameraFeed';
import { LogEntry } from '../types';

const JarvisInterface: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
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
        if (appName.includes('google')) url = 'https://www.google.com';
        else if (appName.includes('youtube')) url = 'https://www.youtube.com';
        else if (appName.includes('spotify')) url = 'https://open.spotify.com';
        else if (appName.includes('github')) url = 'https://github.com';
        
        if (url) {
            window.open(url, '_blank');
            addLog(`LAUNCHING: ${appName.toUpperCase()}`, 'success');
            return "Application launched.";
        }
        return "Target not found in memory banks.";
    }

    if (toolName === 'run_diagnostics') {
        addLog(`SCANNING ${args.system.toUpperCase()}...`, 'info');
        return `Diagnostic complete for ${args.system}. All systems nominal.`;
    }

    if (toolName === 'set_environment') {
        setEnvironment(prev => ({ ...prev, [args.parameter]: args.value }));
        addLog(`ENV ADJUSTED: ${args.parameter.toUpperCase()}`, 'success');
        return "Adjustment successful.";
    }

    return "Protocol executed.";
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
        addLog("ESTABLISHING SECURE LINK...", 'info');
      } catch (e) {
        setStatus("CONNECTION FAILURE");
        setConnected(false);
        addLog("ERROR: CHECK NETWORK PROTOCOLS", 'warning');
      }
    }
  };

  const toggleCamera = () => {
    const newState = !cameraActive;
    setCameraActive(newState);
    addLog(newState ? "OPTICAL SENSORS ACTIVE" : "SENSORS STANDBY", newState ? 'success' : 'warning');
  };

  const handleFrameCapture = (base64: string) => {
    if (connected && clientRef.current) {
      clientRef.current.sendVideoFrame(base64);
    }
  };

  const reactorLevel = Math.max(volume.input, volume.output);

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto h-screen p-4 md:p-6 flex flex-col font-tech">
      {/* Header */}
      <header className="flex justify-between items-start mb-6 border-b border-cyan-900/30 pb-4">
        <div className="flex flex-wrap gap-4 md:gap-8">
           <StatusPanel label="Protocol" value="EYE_LINK" active={cameraActive} />
           <StatusPanel label="User" value="ASAD ARISAR" active={true} />
           <StatusPanel label="Optics" value={cameraActive ? "STREAMING" : "OFFLINE"} active={cameraActive} />
        </div>
        <div className="text-right">
           <h2 className="text-4xl font-bold text-cyan-500 hologram-glow tracking-tighter">J.A.R.V.I.S.</h2>
           <div className="text-[8px] text-cyan-700 tracking-[0.5em] mt-1 uppercase">Tactical Intelligence Interface</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row items-center justify-center relative gap-8 w-full">
        
        {/* Left: Tactical Section */}
        <div className="hidden md:flex flex-col w-80 h-full justify-center gap-6">
           <div className="space-y-4">
              <div className="flex items-center justify-between px-2 border-b border-cyan-900/30 pb-2">
                <div className="flex items-center gap-2">
                  <Eye size={14} className={cameraActive ? "text-cyan-400" : "text-cyan-900"} />
                  <span className="text-[10px] tracking-widest text-cyan-600 font-bold uppercase">Optical Interface</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={toggleCamera}
                    className={`px-3 py-1 text-[10px] border transition-all rounded-sm font-bold ${cameraActive ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-black border-cyan-900 text-cyan-900'}`}
                  >
                    {cameraActive ? 'DEACTIVATE' : 'ENGAGE'}
                  </button>
                </div>
              </div>
              <CameraFeed isActive={cameraActive} onFrameCapture={handleFrameCapture} />
              
              <div className="flex flex-wrap gap-2">
                <div className={`flex-1 p-2 border border-cyan-800/30 bg-black/40 rounded text-center transition-opacity ${cameraActive ? 'opacity-100' : 'opacity-20'}`}>
                   <div className="text-[8px] text-cyan-600 mb-1">FPS</div>
                   <div className="text-xs text-cyan-300">60.0</div>
                </div>
                <div className={`flex-1 p-2 border border-cyan-800/30 bg-black/40 rounded text-center transition-opacity ${cameraActive ? 'opacity-100' : 'opacity-20'}`}>
                   <div className="text-[8px] text-cyan-600 mb-1">RESOL</div>
                   <div className="text-xs text-cyan-300">HD</div>
                </div>
                <div className={`flex-1 p-2 border border-cyan-800/30 bg-black/40 rounded text-center transition-opacity ${cameraActive ? 'opacity-100' : 'opacity-20'}`}>
                   <div className="text-[8px] text-cyan-600 mb-1">LATENCY</div>
                   <div className="text-xs text-cyan-300">12MS</div>
                </div>
              </div>
           </div>

           {/* Logs */}
           <div className="border border-cyan-800/30 bg-black/60 p-4 rounded-lg h-48 flex flex-col box-glow">
              <div className="flex items-center gap-2 text-cyan-500 mb-2 border-b border-cyan-800/50 pb-2">
                 <Terminal size={14} />
                 <span className="text-[10px] tracking-[0.2em] font-bold">EVENT_STREAM</span>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-1 scrollbar-hide">
                 {logs.map((log, i) => (
                    <div key={i} className={`opacity-80 ${log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-orange-400' : 'text-cyan-300'}`}>
                       <span className="opacity-30 mr-2">>></span> {log.message}
                    </div>
                 ))}
                 <div ref={logsEndRef} />
              </div>
           </div>
        </div>

        {/* Center: Core Reactor */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-[400px]">
          <div className="relative transform transition-transform duration-100" style={{ transform: `scale(${1 + reactorLevel * 0.15})` }}>
            <Reactor isActive={connected} outputLevel={volume.output} inputLevel={volume.input} />
          </div>

          <div className="absolute bottom-4 w-full text-center">
            <div className="inline-block bg-black/80 backdrop-blur-md border border-cyan-800/50 px-12 py-3 rounded-full box-glow shadow-[0_0_50px_rgba(0,240,255,0.05)]">
               <span className="font-mono text-cyan-300 tracking-[0.4em] text-xs animate-pulse uppercase flex items-center gap-4">
                 <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-cyan-400' : 'bg-red-500'} animate-ping`} />
                 {status}
               </span>
            </div>
          </div>
        </div>

        {/* Right: Environment & Monitoring */}
        <div className="hidden md:flex flex-col w-80 h-full justify-center gap-6 text-right">
           <div className="border border-cyan-800/30 bg-black/60 p-4 rounded-lg box-glow">
              <div className="flex items-center justify-end gap-2 text-cyan-500 mb-4 border-b border-cyan-800/50 pb-2">
                 <span className="text-[10px] tracking-[0.2em] font-bold">SUBSYSTEM_MONITOR</span>
                 <Zap size={14} />
              </div>
              <div className="space-y-4">
                  <div className="flex justify-between items-center group">
                      <span className="text-[10px] text-cyan-600 tracking-widest uppercase">Reactor Temp</span>
                      <span className="text-xl text-cyan-300">{environment.temperature}°C</span>
                  </div>
                  <div className="flex justify-between items-center group">
                      <span className="text-[10px] text-cyan-600 tracking-widest uppercase">Grid Load</span>
                      <span className="text-xl text-cyan-300">42%</span>
                  </div>
                  <div className="flex justify-between items-center group">
                      <span className="text-[10px] text-cyan-600 tracking-widest uppercase">Optical Sync</span>
                      <span className={`text-sm font-bold ${cameraActive ? 'text-green-400' : 'text-cyan-800'}`}>
                        {cameraActive ? 'SYNCHRONIZED' : 'DORMANT'}
                      </span>
                  </div>
              </div>
           </div>
           
           <div>
              <div className="text-[10px] text-cyan-600 tracking-[0.2em] mb-2 font-bold uppercase">Neuro-Link Waveform</div>
              <Diagnostics />
           </div>
        </div>

      </main>

      {/* Controls */}
      <footer className="mt-auto flex justify-center items-center gap-10 relative py-10">
        <div className="absolute top-0 w-1/4 left-0 h-px bg-gradient-to-r from-transparent to-cyan-900/50"></div>
        <div className="absolute top-0 w-1/4 right-0 h-px bg-gradient-to-l from-transparent to-cyan-900/50"></div>
        
        <button 
          onClick={toggleConnection}
          className={`
            relative group flex items-center justify-center w-28 h-28 rounded-full border-2 transition-all duration-700
            ${connected 
              ? 'border-red-500/50 hover:border-red-400 hover:shadow-[0_0_60px_rgba(239,68,68,0.3)] bg-red-950/20' 
              : 'border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_60px_rgba(6,182,212,0.3)] bg-cyan-950/20'}
          `}
        >
          <div className={`absolute inset-[-6px] rounded-full border border-dashed border-cyan-500/20 ${connected ? 'animate-spin' : ''} duration-[15s]`}></div>
          <div className="absolute inset-2 rounded-full border border-white/5"></div>
          {connected ? <Power className="w-10 h-10 text-red-400" /> : <Mic className="w-10 h-10 text-cyan-400" />}
        </button>
      </footer>
    </div>
  );
};

export default JarvisInterface;
