import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Trophy, RefreshCw } from 'lucide-react';
import { useLetter } from '../context/LetterContext';
import { getRandomWords } from '../data/words';
import { ALPHABET } from '../data/alphabet';
import CameraFeed from './CameraFeed';
import { speak, phrases } from '../hooks/useVoice';

const MAX_ATTEMPTS = 3; // intentos por letra
const WORDS_PER_EXAM = 5;

type LetterState = 'pending' | 'correct' | 'failed';

interface WordProgress {
  word: string;
  letters: LetterState[];
}

export default function ExamenView() {
  const { completedLetters, detection, onExamCompleted } = useLetter();

  const unlocked = completedLetters.length > 0
    ? completedLetters
    : ALPHABET.map(l => l.letter);

  const [exam, setExam]             = useState<WordProgress[]>([]);
  const [wordIndex, setWordIndex]   = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [attempts, setAttempts]     = useState(0);
  const [finished, setFinished]     = useState(false);
  const [feedback, setFeedback]     = useState<'correct' | 'wrong' | null>(null);

  const startExam = () => {
    const words = getRandomWords(unlocked, WORDS_PER_EXAM);
    const fallback = ['SOL', 'MAR', 'LUZ', 'PAZ', 'FIN'];
    const chosen = words.length >= WORDS_PER_EXAM ? words : fallback;
    setExam(chosen.map(w => ({ word: w, letters: w.split('').map(() => 'pending' as LetterState) })));
    setWordIndex(0);
    setLetterIndex(0);
    setAttempts(0);
    setFinished(false);
    setFeedback(null);
  };

  useEffect(() => { startExam(); }, []);

  const currentWord   = exam[wordIndex];
  const currentLetter = currentWord?.word[letterIndex] ?? '';
  const letterData    = ALPHABET.find(l => l.letter === currentLetter);

  const advance = (state: LetterState) => {
    setExam(prev => {
      const next = prev.map((wp, wi) => wi !== wordIndex ? wp : {
        ...wp,
        letters: wp.letters.map((ls, li) => li === letterIndex ? state : ls),
      });
      return next;
    });

    setTimeout(() => {
      setFeedback(null);
      const word = exam[wordIndex].word;
      if (letterIndex + 1 < word.length) {
        setLetterIndex(i => i + 1);
        setAttempts(0);
      } else if (wordIndex + 1 < exam.length) {
        speak(phrases.wordCompleted(word)); // 🔊 word done
        setWordIndex(w => w + 1);
        setLetterIndex(0);
        setAttempts(0);
      } else {
        speak(phrases.examFinished(score)); // 🔊 exam done
        setFinished(true);
        onExamCompleted(score);
      }
    }, 900);
  };

  useEffect(() => {
    if (!detection.detected || !currentLetter || finished || feedback) return;
    if (detection.letter === currentLetter) {
      speak(phrases.examLetterCorrect(currentLetter)); // 🔊 letter correct
      setFeedback('correct');
      advance('correct');
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setFeedback('wrong');
        advance('failed');
      }
    }
  }, [detection]);

  // Resultados finales
  const totalLetters  = exam.reduce((s, w) => s + w.word.length, 0);
  const correctCount  = exam.reduce((s, w) => s + w.letters.filter(l => l === 'correct').length, 0);
  const score         = totalLetters > 0 ? Math.round((correctCount / totalLetters) * 100) : 0;

  if (finished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center space-y-4">
          <Trophy size={64} className="text-yellow-400" />
          <h2 className="text-3xl font-bold text-white">Exam completed</h2>
          <p className="text-slate-400">Score: <span className="text-white font-bold text-2xl">{score}%</span></p>
        </motion.div>
        <div className="flex flex-col space-y-3 w-full max-w-md">
          {exam.map((wp, wi) => (
            <div key={wi} className="bg-bg-card border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-lg font-bold text-white">{wp.word}</span>
              <div className="flex space-x-2">
                {wp.letters.map((ls, li) => (
                  <div key={li} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${ls === 'correct' ? 'bg-green-500/20 text-green-400' : ls === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-500'}`}>
                    {wp.word[li]}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={startExam} className="flex items-center space-x-2 px-6 py-3 bg-brand-blue rounded-2xl text-white font-bold hover:bg-brand-blue/80 transition-colors">
          <RefreshCw size={18} />
          <span>New exam</span>
        </button>
      </div>
    );
  }

  if (exam.length === 0) return null;

  return (
    <div className="flex-1 flex flex-col h-full px-8 pb-4 space-y-4 overflow-hidden">

      {/* Top row: palabras + card de letra al mismo nivel */}
      <div className="flex items-center space-x-4 pt-2">
        {/* Palabras del examen */}
        <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar flex-1">
          {exam.map((wp, wi) => (
            <div key={wi} className={`flex-shrink-0 flex items-center space-x-1 px-3 py-2 rounded-xl border transition-all ${wi === wordIndex ? 'border-brand-blue/50 bg-brand-blue/10' : 'border-white/5 bg-bg-card/40'}`}>
              {wp.word.split('').map((l, li) => (
                <span key={li} className={`text-lg font-bold ${
                  wp.letters[li] === 'correct' ? 'text-green-400' :
                  wp.letters[li] === 'failed'  ? 'text-red-400' :
                  wi === wordIndex && li === letterIndex ? 'text-brand-blue' : 'text-slate-500'
                }`}>{l}</span>
              ))}
            </div>
          ))}
        </div>

        {/* Card "Make this sign" al mismo nivel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLetter}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0 bg-bg-card border border-brand-blue/30 rounded-2xl px-6 py-3 flex items-center space-x-4"
          >
            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest">Make this sign</span>
            <span className="text-4xl font-display font-bold text-brand-blue">{currentLetter}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Intentos restantes */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Attempts:</span>
        {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${i < MAX_ATTEMPTS - attempts ? 'bg-brand-blue' : 'bg-red-500/40'}`} />
        ))}
      </div>

      {/* Cámara real */}
      <div className="flex-1 min-h-0">
        <CameraFeed>
          <AnimatePresence>
            {feedback === 'correct' && (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-30">
                <CheckCircle2 size={80} className="text-green-400" />
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-red-500/20 z-30">
                <XCircle size={80} className="text-red-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </CameraFeed>
      </div>
    </div>
  );
}
