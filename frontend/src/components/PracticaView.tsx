import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useLetter } from '../context/LetterContext';
import { getRandomWords } from '../data/words';
import { ALPHABET } from '../data/alphabet';
import CameraFeed from './CameraFeed';
import { speak, phrases } from '../hooks/useVoice';

export default function PracticaView() {
  const { completedLetters, detection } = useLetter();

  const unlocked = completedLetters.length > 0
    ? completedLetters
    : ALPHABET.map(l => l.letter);

  const [words, setWords]             = useState<string[]>([]);
  const [wordIndex, setWordIndex]     = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const generateWords = () => {
    const w = getRandomWords(unlocked, 10);
    setWords(w.length > 0 ? w : ['SOL', 'MAR', 'LUZ']);
    setWordIndex(0);
    setLetterIndex(0);
  };

  useEffect(() => { generateWords(); }, [completedLetters.length]);

  const currentWord   = words[wordIndex] ?? '';
  const currentLetter = currentWord[letterIndex] ?? '';
  const letterData    = ALPHABET.find(l => l.letter === currentLetter);

  // Track the last confirmedId we already processed so we never handle the same event twice
  const lastConfirmedId = useRef(0);
  const processingRef   = useRef(false); // guard against re-entry during the 800ms timeout

  useEffect(() => {
    // Only react to a NEW confirmed detection (confirmedId changed and > 0)
    if (
      detection.confirmedId === 0 ||
      detection.confirmedId === lastConfirmedId.current ||
      processingRef.current ||
      !currentLetter
    ) return;

    // Wrong letter — ignore
    if (detection.letter !== currentLetter) return;

    // Mark this event as handled immediately
    lastConfirmedId.current = detection.confirmedId;
    processingRef.current   = true;

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      processingRef.current = false;
      if (letterIndex + 1 < currentWord.length) {
        setLetterIndex(i => i + 1);
      } else {
        speak(phrases.wordCompleted(currentWord));
        if (wordIndex + 1 < words.length) {
          setWordIndex(w => w + 1);
          setLetterIndex(0);
        } else {
          generateWords();
        }
      }
    }, 800);
  }, [detection.confirmedId]);

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

      {/* Camera + reference — stacked on mobile, side by side on desktop */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-6 min-h-0">
        {/* Camera */}
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

        {/* Reference panel — row on mobile, column on desktop */}
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
