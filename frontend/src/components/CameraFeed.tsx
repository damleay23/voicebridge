import { ReactNode, useRef, useEffect } from 'react';
import { Wifi, WifiOff, Video, VideoOff } from 'lucide-react';
import { useLetter } from '../context/LetterContext';
import HandOverlay from './HandOverlay';

interface CameraFeedProps {
  children?: ReactNode;
}

export default function CameraFeed({ children }: CameraFeedProps) {
  const { stream, cameraActive, wsConnected, handDetected, detection, toggleCamera } = useLetter();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream, cameraActive]);

  return (
    <div className="relative w-full h-full bg-black rounded-[32px] overflow-hidden flex items-center justify-center">

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Camera off — show background image */}
      {!cameraActive && (
        <div className="absolute inset-0 z-10">
          <img
            src="/camera-bg.png"
            alt="Camera off"
            className="w-full h-full object-contain"
            style={{ background: '#020617' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-black/30">
            <VideoOff size={36} className="text-white/60" />
            <span className="text-white/60 text-sm font-medium">Camera is off</span>
          </div>
        </div>
      )}

      {/* No hand */}
      {cameraActive && !handDetected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-slate-700 text-sm">
            {wsConnected ? 'Show your hand to the camera' : 'Connecting to backend...'}
          </span>
        </div>
      )}

      {/* HUD Corners */}
      <div className="absolute top-1/4 left-1/4 w-40 h-40 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
      </div>

      {/* Connection badge — top right */}
      <div className="absolute top-5 right-5 z-20">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl flex items-center space-x-3">
          {wsConnected ? <Wifi size={14} className="text-green-400" /> : <WifiOff size={14} className="text-red-400" />}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              {detection.letter
                ? `${detection.letter} — ${Math.round(detection.confidence * 100)}%`
                : wsConnected ? 'Detecting...' : 'Disconnected'}
            </span>
            <span className="text-[11px] text-slate-400">
              {wsConnected ? 'Backend connected' : 'Run server.py first'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom: tracking status + camera toggle — alineados a la izquierda */}
      <div className="absolute bottom-6 left-6 z-30 flex items-center space-x-3">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full flex items-center space-x-3">
          <div className={`w-1.5 h-1.5 rounded-full ${handDetected ? 'bg-green-500' : 'bg-slate-600'}`} />
          <span className="text-xs font-semibold text-white tracking-wide">
            {handDetected ? 'Tracking active' : 'No hand detected'}
          </span>
        </div>

        <button
          onClick={toggleCamera}
          className={`p-3 backdrop-blur-md border rounded-2xl transition-colors ${
            cameraActive
              ? 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/30'
              : 'bg-brand-blue/20 border-brand-blue/40 text-brand-blue hover:bg-brand-blue/30'
          }`}
          title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
        >
          {cameraActive ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
      </div>

      {/* Hand landmarks overlay */}
      <HandOverlay />

      {/* Custom overlays from parent */}
      {children}
    </div>
  );
}
