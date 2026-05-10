import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Trophy, RefreshCw } from 'lucide-react';
import { useLetter } from '../context/LetterContext';
import { getRandomWords } from '../data/words';
import { ALPHABET } from '../data/alphabet';
import CameraFeed from './CameraFeed';
import { speak, phrases } from '../hooks/useVoice';

const MAX_ATTEMPTS   = 3;
const WORDS_PER_EXAM = 5;
const EXAM_STREAK     = 5;
const EXAM_CONFIDENCE = 0.75;

type LetterState = 'pending' | 'correct' | 'failed';

interface WordProgress {
  word: string;
  letters: LetterState[];
}

export default function ExamenView() {
  const { completedLetters, rawPrediction, onExamCompleted } = useLetter();

  const unlocked = completedLetters.length > 0
    ? completedLetters
    : ALPHABET.map(l => l.letter);

  const [exam, setExam]               = useState<WordProgress[]>([]);
  const [wordIndex, setWordIndex]     = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [attempts, setAttempts]       = useState(0);
  const [finished, setFinished]       = useState(false);
  const [feedback, setFeedback]       = useState<'correct' | 'wrong' | null>(null);
  const lastConfirmedId               = useRef(0);
  // Local streak for exam — independent of global context
  const examStreakRef  = useRef<string[]>([]);
  const examCooldownRef = useRef<number>(0);

  const startExam = () => {
    const words    = getRandomWords(unlocked, WORDS_PER_EXAM);
    const fallback = ['SOL', 'MAR', 'LUZ', 'PAZ', 'FIN'];
    const chosen   = words.length >= WORDS_PER_EXAM ? words : fallback;
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

  const totalLetters = exam.reduce((s, w) => s + w.word.length, 0);
  const correctCount = exam.reduce((s, w) => s + w.letters.filter(l => l === 'correct').length, 0);
  const score        = totalLetters > 0 ? Math.round((correctCount / totalLetters) * 100) : 0;

  const advance = (state: LetterState) => {
    setExam(prev => prev.map((wp, wi) => wi !== wordIndex ? wp : {
      ...wp,
      letters: wp.letters.map((ls, li) => li === letterIndex ? state : ls),
    }));

    setTimeout(() => {
      setFeedback(null);
      const word = exam[wordIndex].word;
      if (letterIndex + 1 < word.length) {
        setLetterIndex(i => i + 1);
        setAttempts(0);
      } else if (wordIndex + 1 < exam.length) {
        speak(phrases.wordCompleted(word));
        setWordIndex(w => w + 1);
        setLetterIndex(0);
        setAttempts(0);
      } else {
        speak(phrases.examFinished(score));
        setFinished(true);
        onExamCompleted(score);
      }
    }, 900);
  };

  // Reset streak when target letter changes
  const prevExamLetterRef = useRef('');
  useEffect(() => {
    if (currentLetter !== prevExamLetterRef.current) {
      prevExamLetterRef.current = currentLetter;
      examStreakRef.current     = [];
      examCooldownRef.current   = 0;
    }
  }, [currentLetter]);

  // Independent streak-based detection for Exam mode
  useEffect(() => {
    if (!rawPrediction || !currentLetter || finished || feedback) return;
    if (Date.now() - examCooldownRef.current < 1500) return;

    const { letter, confidence } = rawPrediction;

    if (confidence >= EXAM_CONFIDENCE) {
      const buf = examStreakRef.current;
      buf.push(letter);
      if (buf.length > EXAM_STREAK) buf.shift();

      if (buf.length === EXAM_STREAK && new Set(buf).size === 1) {
        examStreakRef.current   = [];
        examCooldownRef.current = Date.now();

        if (buf[0] === currentLetter) {
          speak(phrases.examLetterCorrect(currentLetter));
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
      }
    } else {
      examStreakRef.current = [];
    }
  }, [rawPrediction]);

  if (finished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 overflow-y-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3">
          <Trophy size={56} className="text-yellow-400" />
          <h2 className="text-2xl md:text-3xl font-bold text-white">Exam completed</h2>
          <p className="text-slate-400">Score: <span className="text-white font-bold text-xl md:text-2xl">{score}%</span></p>
        </motion.div>
        <div className="flex flex-col gap-3 w-full max-w-md">
          {exam.map((wp, wi) => (
            <div key={wi} className="bg-bg-card border border-white/10 rounded-2xl p-3 md:p-4 flex items-center justify-between">
              <span className="text-base md:text-lg font-bold text-white">{wp.word}</span>
              <div className="flex space-x-1.5 md:space-x-2">
                {wp.letters.map((ls, li) => (
                  <div key={li} className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${ls === 'correct' ? 'bg-green-500/20 text-green-400' : ls === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-500'}`}>
                    {wp.word[li]}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={startExam} className="flex items-center space-x-2 px-6 py-3 bg-brand-blue rounded-2xl text-white font-bold hover:bg-brand-blue/80 transition-colors">
          <RefreshCw size={16} />
          <span>New exam</span>
        </button>
      </div>
    );
  }

  if (exam.length === 0) return null;

  return (
    <div className="flex-1 flex flex-col h-full px-3 md:px-8 pb-3 md:pb-4 gap-3 md:gap-4 overflow-hidden">

      {/* Top row: words + current letter */}
      <div className="flex items-center gap-3 pt-1 flex-shrink-0 flex-wrap md:flex-nowrap">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
          {exam.map((wp, wi) => (
            <div key={wi} className={`flex-shrink-0 flex items-center space-x-1 px-2 py-1.5 md:px-3 md:py-2 rounded-xl border transition-all ${wi === wordIndex ? 'border-brand-blue/50 bg-brand-blue/10' : 'border-white/5 bg-bg-card/40'}`}>
              {wp.word.split('').map((l, li) => (
                <span key={li} className={`text-base md:text-lg font-bold ${
                  wp.letters[li] === 'correct' ? 'text-green-400' :
                  wp.letters[li] === 'failed'  ? 'text-red-400' :
                  wi === wordIndex && li === letterIndex ? 'text-brand-blue' : 'text-slate-500'
                }`}>{l}</span>
              ))}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentLetter}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0 bg-bg-card border border-brand-blue/30 rounded-2xl px-4 py-2 md:px-6 md:py-3 flex items-center space-x-3"
          >
            <span className="text-[9px] md:text-[10px] font-bold text-brand-purple uppercase tracking-widest">Sign</span>
            <span className="text-3xl md:text-4xl font-display font-bold text-brand-blue">{currentLetter}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Attempts */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Attempts:</span>
        {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < MAX_ATTEMPTS - attempts ? 'bg-brand-blue' : 'bg-red-500/40'}`} />
        ))}
      </div>

      {/* Camera */}
      <div className="flex-1 min-h-0" style={{ minHeight: '200px' }}>
        <CameraFeed>
          <AnimatePresence>
            {feedback === 'correct' && (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-30">
                <CheckCircle2 size={64} className="text-green-400" />
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-red-500/20 z-30">
                <XCircle size={64} className="text-red-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </CameraFeed>
      </div>
    </div>
  );
}
