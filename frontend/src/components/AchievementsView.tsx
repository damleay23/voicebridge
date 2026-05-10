import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { useLetter } from '../context/LetterContext';
import { ACHIEVEMENTS, RARITY_COLORS } from '../data/achievements';

export default function AchievementsView() {
  const { unlockedAchievements, xp, streak, examsCompleted, examsPerfect, completedLetters } = useLetter();

  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sorted = [...ACHIEVEMENTS].sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  return (
    <div className="flex-1 flex flex-col h-full px-8 pb-6 space-y-6 overflow-y-auto">
      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4 pt-2">
        {[
          { label: 'Letters',  value: `${completedLetters.length}/26` },
          { label: 'Total XP', value: xp.toLocaleString() },
          { label: 'Streak',   value: streak },
          { label: 'Exams',    value: examsCompleted },
        ].map(s => (
          <div key={s.label} className="bg-bg-card border border-white/10 rounded-2xl p-4 flex flex-col items-center space-y-1">
            <span className="text-2xl font-bold text-white">{s.value}</span>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{unlockedAchievements.length} / {ACHIEVEMENTS.length} achievements</span>
          <span>{Math.round(unlockedAchievements.length / ACHIEVEMENTS.length * 100)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-brand-blue to-brand-purple rounded-full"
          />
        </div>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 gap-4">
        {sorted.map((a, i) => {
          const unlocked = unlockedAchievements.includes(a.id);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`relative border rounded-2xl p-4 flex items-start space-x-3 transition-all ${
                unlocked
                  ? RARITY_COLORS[a.rarity]
                  : 'bg-bg-card/40 border-white/5 opacity-50'
              }`}
            >
              <span className={`text-3xl flex-shrink-0 ${!unlocked ? 'grayscale' : ''}`}>{a.icon}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">{a.title}</span>
                <span className="text-[11px] text-slate-400 leading-relaxed">{a.description}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                  a.rarity === 'legendary' ? 'text-yellow-400' :
                  a.rarity === 'epic'      ? 'text-purple-400' :
                  a.rarity === 'rare'      ? 'text-blue-400'   : 'text-slate-500'
                }`}>{a.rarity}</span>
              </div>
              {!unlocked && (
                <div className="absolute top-3 right-3">
                  <Lock size={12} className="text-slate-600" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
