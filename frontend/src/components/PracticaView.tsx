import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useLetter } from '../context/LetterContext';
import { getRandomWords } from '../data/words';
import { ALPHABET } from '../data/alphabet';
import CameraFeed from './CameraFeed';
import { speak, phrases } from '../hooks/useVoice';

export default function PracticaView() {
  const { completedLetters, detection } = useLetter();

  // Letras desbloqueadas = completadas en Aprender
  const unlocked = completedLetters.length > 0
    ? completedLetters
    : ALPHABET.map(l => l.letter); // si no hay ninguna, usar todas para demo

  const [words, setWords]           = useState<string[]>([]);
  const [wordIndex, setWordIndex]   = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const generateWords = () => {
    const w = getRandomWords(unlocked, 10);
    setWords(w.length > 0 ? w : ['SOL', 'MAR', 'LUZ']); // fallback
    setWordIndex(0);
    setLetterIndex(0);
  };

  useEffect(() => { generateWords(); }, [completedLetters.length]);

  const currentWord   = words[wordIndex] ?? '';
  const currentLetter = currentWord[letterIndex] ?? '';
  const letterData    = ALPHABET.find(l => l.letter === currentLetter);

  // Cuando el back detecte la letra correcta, avanzar
  useEffect(() => {
    if (!detection.detected || !currentLetter) return;
    if (detection.letter === currentLetter) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (letterIndex + 1 < currentWord.length) {
          setLetterIndex(i => i + 1);
        } else {
          // Palabra completada
          speak(phrases.wordCompleted(currentWord)); // 🔊 Rachel speaks
          if (wordIndex + 1 < words.length) {
            setWordIndex(w => w + 1);
            setLetterIndex(0);
          } else {
            generateWords();
          }
        }
      }, 800);
    }
  }, [detection]);

  if (words.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-slate-400 text-center">Complete letters in <span className="text-brand-blue font-bold">Learn</span> to unlock Practice mode.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full px-8 pb-4 space-y-6 overflow-hidden">
      {/* Palabra actual */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          {currentWord.split('').map((l, i) => (
            <motion.div
              key={i}
              animate={i === letterIndex ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.4, repeat: Infinity }}
              className={`w-12 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold border transition-all ${
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
        <button onClick={generateWords} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Progreso de palabras */}
      <div className="flex items-center space-x-2">
        {words.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < wordIndex ? 'bg-green-500' : i === wordIndex ? 'bg-brand-blue' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex space-x-6 min-h-0">
        {/* Cámara real */}
        <div className="flex-1 min-h-0">
          <CameraFeed>
            {/* Feedback de éxito */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-30"
                >
                  <CheckCircle2 size={80} className="text-green-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </CameraFeed>
        </div>

        {/* Panel derecho — referencia de la letra actual */}
        <div className="w-72 flex flex-col space-y-4">
          <div className="bg-bg-card border border-white/10 rounded-[24px] p-4 flex flex-col items-center space-y-2">
            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest">Make this sign</span>
            <span className="text-5xl font-display font-bold text-brand-blue">{currentLetter}</span>
          </div>
          <div className="flex-1 bg-bg-card border border-white/10 rounded-[24px] overflow-hidden">
            {letterData?.imageUrl ? (
              <img src={letterData.imageUrl} alt={currentLetter} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
