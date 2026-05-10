import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { useLetter } from '../context/LetterContext';
import { ALPHABET } from '../data/alphabet';
import CameraFeed from './CameraFeed';

interface HistoryEntry {
  letter: string;
  confidence: number;
  timestamp: Date;
}

export default function LibreView() {
  const { detection, onDetectionResult } = useLetter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastDetected, setLastDetected] = useState<string>('');

  // Todas las letras disponibles en modo libre
  const letterData = ALPHABET.find(l => l.letter === detection.letter);

  // Registrar en historial cuando se detecta una letra
  useEffect(() => {
    if (detection.detected && detection.letter && detection.letter !== lastDetected) {
      setLastDetected(detection.letter);
      setHistory(prev => [
        { letter: detection.letter, confidence: detection.confidence, timestamp: new Date() },
        ...prev.slice(0, 49), // máximo 50 entradas
      ]);
    }
  }, [detection]);

  const clearHistory = () => {
    setHistory([]);
    setLastDetected('');
  };

  return (
    <div className="flex-1 flex h-full px-8 pb-4 space-x-6 overflow-hidden">

      {/* Cámara + detección */}
      <div className="flex-1 flex flex-col space-y-4 min-h-0">
        {/* Cámara real */}
        <div className="flex-1 min-h-0">
          <CameraFeed>
            {/* Letra detectada grande */}
            <AnimatePresence mode="wait">
              {detection.detected && detection.letter && (
                <motion.div
                  key={detection.letter}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-8 left-8 bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl flex flex-col items-center z-20"
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Detected</span>
                  <span className="text-6xl font-display font-bold text-brand-blue">{detection.letter}</span>
                  <span className="text-xs text-slate-400 mt-1">{Math.round(detection.confidence * 100)}% confidence</span>
                </motion.div>
              )}
            </AnimatePresence>
          </CameraFeed>
        </div>

        {/* Referencia de la letra detectada */}
        {detection.letter && letterData && (
          <motion.div
            key={detection.letter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-32 bg-bg-card border border-white/10 rounded-[24px] flex items-center space-x-6 px-6"
          >
            <img src={letterData.imageUrl} alt={detection.letter} className="h-24 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-4xl font-display font-bold text-brand-blue">{detection.letter}</span>
              <span className="text-sm text-slate-400">{letterData.pronunciation}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Historial */}
      <div className="w-72 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-brand-purple uppercase tracking-[0.2em]">History</h4>
          {history.length > 0 && (
            <button onClick={clearHistory} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="flex-1 bg-bg-card border border-white/10 rounded-[24px] overflow-y-auto no-scrollbar p-3 space-y-2">
          {history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-sm text-center px-4">
              Make gestures in front of the camera to see the history
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {history.map((entry, i) => (
                <motion.div
                  key={`${entry.letter}-${entry.timestamp.getTime()}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-3 py-2"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl font-display font-bold text-brand-blue w-6 text-center">{entry.letter}</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-white font-medium">
                        {Math.round(entry.confidence * 100)}% confidence
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${entry.confidence > 0.8 ? 'bg-green-500' : entry.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
