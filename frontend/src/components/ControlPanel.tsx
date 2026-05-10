import { Check, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useLetter } from '../context/LetterContext';

export default function ControlPanel() {
  const { goToNext, detection, correctAttempts, requiredCorrect } = useLetter();

  const steps = Array.from({ length: requiredCorrect }, (_, i) => i < correctAttempts);
  const isDetecting = detection.detected;
  const confidence  = detection.confidence;

  return (
    /* Desktop: h-44 horizontal  |  Mobile: compact horizontal strip */
    <div className="flex items-center justify-between px-3 md:px-8 py-3 md:h-44 gap-3 md:gap-6">

      {/* Detection status */}
      <div className="flex-1 bg-bg-card border border-white/10 rounded-2xl md:rounded-[32px] p-3 md:p-6 flex flex-col justify-center space-y-1 md:space-y-2 md:h-32">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full flex-shrink-0 ${isDetecting ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]' : 'bg-slate-600'}`} />
          <span className="text-xs md:text-sm font-bold text-white uppercase tracking-wider truncate">
            {isDetecting ? 'Detecting...' : 'Waiting...'}
          </span>
        </div>
        <span className="text-xs text-slate-400 pl-4 md:pl-[22px]">
          Confidence: <span className={`font-bold ${confidence > 0.8 ? 'text-green-400' : confidence > 0.5 ? 'text-yellow-400' : 'text-white'}`}>
            {confidence > 0 ? `${Math.round(confidence * 100)}%` : '--'}
          </span>
        </span>
      </div>

      {/* Correct attempts */}
      <div className="flex-1 bg-bg-card border border-white/10 rounded-2xl md:rounded-[32px] p-3 md:p-6 flex flex-col justify-between md:h-32 gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attempts</h4>
          <span className="text-xs font-bold text-white">{correctAttempts}/{requiredCorrect}</span>
        </div>

        <div className="flex items-center space-x-1.5 md:space-x-3">
          {steps.map((filled, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={filled ? { scale: [1.2, 1] } : {}}
              transition={{ duration: 0.2 }}
              className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-colors ${
                filled
                  ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {filled && <Check size={12} strokeWidth={3} />}
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ x: 4 }}
          onClick={goToNext}
          className="w-full h-8 md:h-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center space-x-2 transition-colors border-dashed"
        >
          <span className="text-[10px] md:text-xs font-bold text-slate-300">Next letter</span>
          <ArrowRight size={12} className="text-slate-500" />
        </motion.button>
      </div>
    </div>
  );
}
