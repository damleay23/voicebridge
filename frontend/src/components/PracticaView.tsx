import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useLetter } from '../context/LetterContext';
import { getRandomWords } from '../data/words';
import { ALPHABET } from '../data/alphabet';
import CameraFeed from './CameraFeed';
import { speak, phrases } from '../hooks/useVoice';

// Independent confirmation settings for Practice mode
const PRACTICE_STREAK     = 5;    // consecutive same predictions needed
const PRACTICE_CONFIDENCE = 0.75; // minimum confidence per frame
const PRACTICE_COOLDOWN   = 2000; // ms to wait after a correct letter before accepting next

export default function PracticaView() {
  const { completedLetters, rawPrediction } = useLetter();

  const unlocked = completedLetters.length > 0
    ? completedLetters
    : ALPHABET.map(l => l.letter);

  const [words, setWords]             = useState<string[]>([]);
  const [wordIndex, setWordIndex]     = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Local streak buffer — completely independent of Learn mode
  const streakRef      = useRef<string[]>([]);
  const cooldownRef    = useRef<number>(0);   // timestamp of last accepted letter
  const processingRef  = useRef(false);       // true while the 800ms success animation plays

  const generateWords = () => {
    const w = getRandomWords(unlocked, 10);
    setWords(w.length > 0 ? w : ['SOL', 'MAR', 'LUZ']);
    setWordIndex(0);
    setLetterIndex(0);
    streakRef.current   = [];
    cooldownRef.current = 0;
    processingRef.current = false;
  };

  useEffect(() => { generateWords(); }, [completedLetters.length]);

  // Reset streak whenever the target letter changes
  const currentWord   = words[wordIndex] ?? '';
  const currentLetter = currentWord[letterIndex] ?? '';
  const letterData    = ALPHABET.find(l => l.letter === currentLetter);

  const prevLetterRef = useRef('');
  useEffect(() => {
    if (currentLetter !== prevLetterRef.current) {
      prevLetterRef.current = currentLetter;
      streakRef.current     = [];
    }
  }, [currentLetter]);

  // Process every raw frame prediction independently
  useEffect(() => {
    if (!rawPrediction || !currentLetter || processingRef.current) return;

    // Cooldown between accepted letters
    if (Date.now() - cooldownRef.current < PRACTICE_COOLDOWN) return;

    const { letter, confidence } = rawPrediction;

    if (confidence >= PRACTICE_CONFIDENCE) {
      const buf = streakRef.current;
      buf.push(letter);
      if (buf.length > PRACTICE_STREAK) buf.shift();

      // Only confirm if the streak is full AND all predictions match the target
      if (
        buf.length === PRACTICE_STREAK &&
        new Set(buf).size === 1 &&
        buf[0] === currentLetter
      ) {
        // Confirmed — reset streak and start cooldown immediately
        streakRef.current   = [];
        cooldownRef.current = Date.now();
        processingRef.current = true;

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          processingRef.current = false;
          setLetterIndex(prev => {
            const nextIdx = prev + 1;
            if (nextIdx < currentWord.length) {
              return nextIdx;
            } else {
              // Word completed
              speak(phrases.wordCompleted(currentWord));
              setWordIndex(wi => {
                const nextWord = wi + 1;
                if (nextWord < words.length) {
                  return nextWord;
                } else {
                  generateWords();
                  return wi;
                }
              });
              return 0;
            }
          });
        }, 800);
      }
    } else {
      // Low confidence — reset streak
      streakRef.current = [];
    }
  }, [rawPrediction]);

  if (words.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-slate-400 text-center">Complete letters in <span className="text-brand-blue font-bold">Learn</span> to unlock Practice mode.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full px-3 md:px-8 pb-3 md:pb-4 gap-3 md:gap-6 overflow-hidden">

      {/* Word display */}
      <div className="flex items-center justify-between pt-1 md:pt-2 flex-shrink-0">
        <div className="flex items-center space-x-1.5 md:space-x-3 overflow-x-auto no-scrollbar">
          {currentWord.split('').map((l, i) => (
            <motion.div
              key={i}
              animate={i === letterIndex ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.4, repeat: Infinity }}
              className={`flex-shrink-0 w-9 h-11 md:w-12 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl font-bold border transition-all ${
                i < letterIndex
                  ? 'bg-green-500/20 border-green-500/40 text-green-400'
                  : i === letterIndex
                  ? 'bg-brand-blue border-brand-blue text-white shadow-[0_0_20px_-5px_rgba(59,130,246,0.6)]'
                  : 'bg-bg-card border-white/10 text-slate-500'
              }`}
            >
              {l}
            </motion.div>
          ))}
        </div>
        <button onClick={generateWords} className="flex-shrink-0 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-2">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Word progress bar */}
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        {words.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < wordIndex ? 'bg-green-500' : i === wordIndex ? 'bg-brand-blue' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Camera + reference */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-6 min-h-0">
        <div className="flex-1 min-h-0" style={{ minHeight: '200px' }}>
          <CameraFeed>
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-30"
                >
                  <CheckCircle2 size={64} className="text-green-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </CameraFeed>
        </div>

        <div className="flex flex-row md:flex-col md:w-64 lg:w-72 gap-3 flex-shrink-0">
          <div className="bg-bg-card border border-white/10 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center space-y-1 flex-shrink-0">
            <span className="text-[9px] md:text-[10px] font-bold text-brand-purple uppercase tracking-widest">Make this sign</span>
            <span className="text-3xl md:text-5xl font-display font-bold text-brand-blue">{currentLetter}</span>
          </div>
          <div className="flex-1 md:flex-1 bg-bg-card border border-white/10 rounded-2xl overflow-hidden" style={{ minHeight: '80px' }}>
            {letterData?.imageUrl ? (
              <img src={letterData.imageUrl} alt={currentLetter} className="w-full h-full object-contain p-2 md:p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
