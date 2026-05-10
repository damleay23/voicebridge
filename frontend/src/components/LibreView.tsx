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
  const { detection } = useLetter();
  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [lastDetected, setLastDetected] = useState<string>('');

  const letterData = ALPHABET.find(l => l.letter === detection.letter);

  useEffect(() => {
    if (detection.detected && detection.letter && detection.letter !== lastDetected) {
      setLastDetected(detection.letter);
      setHistory(prev => [
        { letter: detection.letter, confidence: detection.confidence, timestamp: new Date() },
        ...prev.slice(0, 49),
      ]);
    }
  }, [detection]);

  const clearHistory = () => { setHistory([]); setLastDetected(''); };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full px-3 md:px-8 pb-3 md:pb-4 gap-3 md:gap-6 overflow-hidden">

      {/* Camera + detected letter reference */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Camera */}
        <div className="flex-1 min-h-0" style={{ minHeight: '200px' }}>
          <CameraFeed>
            <AnimatePresence mode="wait">
              {detection.detected && detection.letter && (
                <motion.div
                  key={detection.letter}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-4 left-4 md:top-8 md:left-8 bg-black/60 backdrop-blur-xl border border-white/10 p-3 md:p-5 rounded-2xl md:rounded-3xl flex flex-col items-center z-20"
                >
                  <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Detected</span>
                  <span className="text-4xl md:text-6xl font-display font-bold text-brand-blue">{detection.letter}</span>
                  <span className="text-xs text-slate-400 mt-1">{Math.round(detection.confidence * 100)}%</span>
                </motion.div>
              )}
            </AnimatePresence>
          </CameraFeed>
        </div>

        {/* Detected letter reference bar */}
        {detection.letter && letterData && (
          <motion.div
            key={detection.letter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 h-20 md:h-32 bg-bg-card border border-white/10 rounded-2xl flex items-center space-x-4 px-4 md:px-6"
          >
            <img src={letterData.imageUrl} alt={detection.letter} className="h-14 md:h-24 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-3xl md:text-4xl font-display font-bold text-brand-blue">{detection.letter}</span>
              <span className="text-xs text-slate-400">{letterData.pronunciation}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* History panel — horizontal scroll on mobile, vertical on desktop */}
      <div className="flex flex-col gap-2 md:w-64 lg:w-72 flex-shrink-0 md:flex-shrink-0" style={{ maxHeight: '100%' }}>
        <div className="flex items-center justify-between flex-shrink-0">
          <h4 className="text-xs font-bold text-brand-purple uppercase tracking-[0.2em]">History</h4>
          {history.length > 0 && (
            <button onClick={clearHistory} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* On mobile: horizontal scroll row. On desktop: vertical list */}
        <div className="flex md:flex-col flex-row overflow-x-auto md:overflow-x-hidden overflow-y-hidden md:overflow-y-auto no-scrollbar gap-2 md:gap-2 flex-1 md:bg-bg-card md:border md:border-white/10 md:rounded-[24px] md:p-3">
          {history.length === 0 ? (
            <div className="hidden md:flex flex-1 items-center justify-center text-slate-600 text-sm text-center px-4">
              Make gestures to see history
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {history.map((entry) => (
                <motion.div
                  key={`${entry.letter}-${entry.timestamp.getTime()}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-3 py-2 min-w-[100px] md:min-w-0"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-display font-bold text-brand-blue w-5 text-center">{entry.letter}</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white font-medium">{Math.round(entry.confidence * 100)}%</span>
                      <span className="text-[9px] text-slate-500 hidden md:block">{entry.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ml-2 ${entry.confidence > 0.8 ? 'bg-green-500' : entry.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
