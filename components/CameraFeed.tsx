
import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Focus, Maximize2, Minimize2 } from 'lucide-react';

interface CameraFeedProps {
  isActive: boolean;
  onFrameCapture?: (base64: string) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ isActive, onFrameCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive]);

  useEffect(() => {
    let interval: number | null = null;
    if (isActive && onFrameCapture && stream) {
      interval = window.setInterval(() => {
        captureFrame();
      }, 1000); // Send frame every second to Gemini
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, stream, onFrameCapture]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("CAMERA_LINK_FAILURE");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current && onFrameCapture) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        const base64 = dataUrl.split(',')[1];
        onFrameCapture(base64);
      }
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-lg transition-all duration-500 border border-cyan-800/30 box-glow ${isZoomed ? 'fixed inset-4 z-50 bg-black' : 'aspect-video bg-black/80'}`}>
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Tactical Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(0,240,255,0.02),transparent,rgba(0,240,255,0.02))] bg-[size:100%_2px,3px_100%]"></div>
        
        <div className="absolute top-4 left-4 flex items-center gap-2 text-[8px] text-cyan-400 font-mono tracking-widest bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-cyan-900'}`}></div>
          OPTICAL_SENSOR_ARRAY
        </div>
      </div>

      {isActive ? (
        error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 gap-2">
            <CameraOff size={32} className="animate-pulse" />
            <span className="text-[10px] tracking-widest font-tech uppercase">{error}</span>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover filter brightness-110 contrast-125 saturate-[0.8] hue-rotate-[190deg]"
            />
            <div className="absolute top-4 right-4 z-20 flex gap-2">
               <button 
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-1.5 bg-black/40 hover:bg-cyan-500/20 rounded backdrop-blur-md text-cyan-400 transition-colors pointer-events-auto"
               >
                 {isZoomed ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
               </button>
            </div>
          </>
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-cyan-900 gap-2">
          <Focus size={32} className="opacity-20" />
          <span className="text-[10px] tracking-widest font-tech opacity-40 uppercase">Optical Link Severed</span>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;
