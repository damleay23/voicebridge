import { Star, Flame, Trophy, Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLetter } from '../context/LetterContext';

export default function RightPanel() {
  const { activeLetter, xp, streak, level, progressPercent } = useLetter();

  const circumference = 163.36; // 2π × 26
  const strokeOffset  = circumference - (circumference * progressPercent / 100);

  return (
    <div className="w-80 flex flex-col p-4 space-y-4 bg-black/20 border-l border-white/5 min-h-0 overflow-hidden">

      {/* Reference Card */}
      <div className="flex-1 flex flex-col space-y-2 min-h-0">
        <h4 className="text-xs font-bold text-brand-purple uppercase tracking-[0.2em] px-1 flex-shrink-0">Reference</h4>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLetter.letter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 relative bg-bg-card border border-white/10 rounded-[24px] overflow-hidden flex items-center justify-center min-h-0"
          >
            {activeLetter.imageUrl ? (
              <img
                src={activeLetter.imageUrl}
                alt={`Seña letra ${activeLetter.letter}`}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="flex flex-col items-center space-y-2 text-slate-600">
                <Hand size={40} />
                <span className="text-xs font-medium">Imagen letra {activeLetter.letter}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Card — valores dinámicos */}
      <div className="flex-shrink-0 bg-bg-card/80 border border-white/5 rounded-2xl p-4">
        <div className="flex items-center space-x-4">
          {/* Círculo de progreso */}
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-800" />
              <motion.circle
                cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="text-brand-blue"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={progressPercent}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-sm font-bold text-white leading-none"
              >
                {progressPercent}%
              </motion.span>
            </div>
          </div>

          {/* Stats dinámicos */}
          <div className="flex flex-col space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <div className="p-1 bg-orange-500/10 rounded text-orange-500">
                  <Star size={10} className="fill-current" />
                </div>
                <span className="text-[11px] text-slate-400">Total XP</span>
              </div>
              <motion.span
                key={xp}
                initial={{ scale: 1.3, color: '#22c55e' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.4 }}
                className="text-[11px] font-bold text-white"
              >
                {xp.toLocaleString()} XP
              </motion.span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <div className="p-1 bg-red-500/10 rounded text-red-500">
                  <Flame size={10} className="fill-current" />
                </div>
                <span className="text-[11px] text-slate-400">Streak</span>
              </div>
              <motion.span
                key={streak}
                initial={{ scale: 1.3, color: '#f97316' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.4 }}
                className="text-[11px] font-bold text-white"
              >
                {streak} letras
              </motion.span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <div className="p-1 bg-purple-500/10 rounded text-purple-500">
                  <Trophy size={10} className="fill-current" />
                </div>
                <span className="text-[11px] text-slate-400">Level</span>
              </div>
              <motion.span
                key={level}
                initial={{ scale: 1.2, color: '#a855f7' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.4 }}
                className="text-[11px] font-bold text-white"
              >
                {level}
              </motion.span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
