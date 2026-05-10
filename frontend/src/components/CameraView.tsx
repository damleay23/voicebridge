import { VideoOff, Video, Wifi, WifiOff } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { useLetter } from '../context/LetterContext';
import HandOverlay from './HandOverlay';

export default function CameraView() {
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
    <div className="relative flex-1 bg-black rounded-2xl md:rounded-[40px] overflow-hidden group min-h-0">

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Camera off */}
      {!cameraActive && (
        <div className="absolute inset-0 z-10">
          <img src="/camera-bg.png" alt="Camera off" className="w-full h-full object-contain" style={{ background: '#020617' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-black/30">
            <VideoOff size={32} className="text-white/60" />
            <span className="text-white/60 text-sm font-medium">Camera is off</span>
          </div>
        </div>
      )}

      <HandOverlay />

      {/* No hand */}
      {cameraActive && !handDetected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-slate-700 text-xs md:text-sm text-center px-4">
            {wsConnected ? 'Show your hand to the camera' : 'Loading AI model...'}
          </span>
        </div>
      )}

      {/* HUD Corners — responsive, percentage-based */}
      <div className="absolute top-[20%] left-[20%] right-[20%] bottom-[20%] pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
      </div>

      {/* Connection badge */}
      <div className="absolute top-3 right-3 md:top-6 md:right-6 z-20">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-2 py-1.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl flex items-center space-x-2">
          {wsConnected ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} className="text-red-400" />}
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-wider">
              {detection.letter ? `${detection.letter} — ${Math.round(detection.confidence * 100)}%` : wsConnected ? 'Detecting...' : 'Disconnected'}
            </span>
            <span className="hidden md:block text-[11px] text-slate-400">
              {wsConnected ? 'AI model ready' : 'Loading model...'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-3 left-3 md:bottom-3 md:left-6 flex items-center space-x-2 z-30">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${handDetected ? 'bg-green-500' : 'bg-slate-600'}`} />
          <span className="text-[10px] md:text-xs font-semibold text-white tracking-wide">
            {handDetected ? 'Tracking' : 'No hand'}
          </span>
        </div>

        <button
          onClick={toggleCamera}
          className={`p-2 md:p-3 backdrop-blur-md border rounded-xl md:rounded-2xl transition-colors ${
            cameraActive
              ? 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/30'
              : 'bg-brand-blue/20 border-brand-blue/40 text-brand-blue hover:bg-brand-blue/30'
          }`}
        >
          {cameraActive ? <Video size={16} /> : <VideoOff size={16} />}
        </button>
      </div>
    </div>
  );
}
