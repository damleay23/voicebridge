import { motion } from 'motion/react';
import { CheckCircle2, XCircle, BookOpen, Target, Hand } from 'lucide-react';
import { useLetter } from '../context/LetterContext';
import { ALPHABET } from '../data/alphabet';

export default function HistoryView() {
  const { completedLetters, examsCompleted, examsPerfect, xp, streak } = useLetter();

  const completedData = ALPHABET.filter(l => completedLetters.includes(l.letter));
  const pendingData   = ALPHABET.filter(l => !completedLetters.includes(l.letter));

  return (
    <div className="flex-1 flex flex-col h-full px-8 pb-6 space-y-6 overflow-y-auto">

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="bg-bg-card border border-white/10 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-green-500/10 rounded-xl text-green-400"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-lg font-bold text-white">{completedLetters.length}</p>
            <p className="text-[11px] text-slate-500">Letters learned</p>
          </div>
        </div>
        <div className="bg-bg-card border border-white/10 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-brand-blue/10 rounded-xl text-brand-blue"><BookOpen size={20} /></div>
          <div>
            <p className="text-lg font-bold text-white">{examsCompleted}</p>
            <p className="text-[11px] text-slate-500">Exams taken</p>
          </div>
        </div>
        <div className="bg-bg-card border border-white/10 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400"><Target size={20} /></div>
          <div>
            <p className="text-lg font-bold text-white">{examsPerfect}</p>
            <p className="text-[11px] text-slate-500">Perfect exams</p>
          </div>
        </div>
      </div>

      {/* Completed letters */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-brand-purple uppercase tracking-widest">Completed letters ({completedLetters.length})</h3>
        {completedData.length === 0 ? (
          <p className="text-slate-600 text-sm">No letters completed yet. Start learning!</p>
        ) : (
          <div className="grid grid-cols-6 gap-3">
            {completedData.map((l, i) => (
              <motion.div
                key={l.letter}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3 flex flex-col items-center space-y-2"
              >
                <span className="text-xl font-bold text-green-400">{l.letter}</span>
                {l.imageUrl && (
                  <img src={l.imageUrl} alt={l.letter} className="w-10 h-10 object-contain" />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pending letters */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending ({pendingData.length})</h3>
        <div className="grid grid-cols-6 gap-3">
          {pendingData.map(l => (
            <div key={l.letter} className="bg-bg-card/40 border border-white/5 rounded-2xl p-3 flex items-center justify-center opacity-40">
              <span className="text-xl font-bold text-slate-500">{l.letter}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
