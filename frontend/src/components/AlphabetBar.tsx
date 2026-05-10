import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef } from 'react';
import { useLetter } from '../context/LetterContext';
import { ALPHABET } from '../data/alphabet';

export default function AlphabetBar() {
  const { activeLetter, setActiveLetter, completedLetters } = useLetter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDragging  = useRef(false);
  const startX      = useRef(0);
  const scrollStart = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current  = true;
    startX.current      = e.pageX;
    scrollStart.current = scrollRef.current?.scrollLeft ?? 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft = scrollStart.current - (e.pageX - startX.current);
  };
  const onMouseUp = () => { isDragging.current = false; };

  const scrollBy = (amount: number) => scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });

  return (
    <div className="flex-shrink-0 px-2 md:px-4 py-2 md:py-0 md:h-28 flex flex-col justify-center space-y-2 border-t border-white/5 bg-black/40">
      <h4 className="text-[9px] md:text-[10px] font-bold text-brand-purple uppercase tracking-[0.3em] px-2 md:px-4">Alphabet</h4>

      <div className="flex items-center space-x-1 md:space-x-2">
        <button
          onClick={() => scrollBy(-200)}
          className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="flex-1 flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 select-none cursor-grab active:cursor-grabbing"
        >
          {ALPHABET.map((item) => {
            const isActive    = item.letter === activeLetter.letter;
            const isCompleted = completedLetters.includes(item.letter);

            return (
              <motion.div
                key={item.letter}
                whileHover={{ y: -3 }}
                onClick={() => { if (!isDragging.current) setActiveLetter(item); }}
                className={`flex-shrink-0 w-10 h-12 md:w-12 md:h-14 rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative cursor-pointer ${
                  isActive
                    ? 'bg-brand-blue border-b-4 border-brand-blue/50 shadow-[0_4px_20px_-5px_rgba(59,130,246,0.6)]'
                    : isCompleted
                    ? 'bg-bg-card border border-white/10 hover:border-white/30'
                    : 'bg-bg-card/40 border border-white/5 hover:border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <span className={`text-base md:text-xl font-display font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {item.letter}
                </span>

                {isActive && (
                  <div className="absolute -inset-0.5 bg-brand-blue/20 blur-lg rounded-2xl -z-10" />
                )}

                {isCompleted && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3.5 h-3.5 md:w-4 md:h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-bg-dark shadow-sm"
                    >
                      <Check size={7} className="text-white" strokeWidth={4} />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={() => scrollBy(200)}
          className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
