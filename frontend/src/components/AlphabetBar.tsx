import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useLetter } from '../context/LetterContext';
import { ALPHABET } from '../data/alphabet';

export default function AlphabetBar() {
  const { activeLetter, setActiveLetter, completedLetters } = useLetter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Arrastre con mouse
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX;
    scrollStart.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const delta = e.pageX - startX.current;
    scrollRef.current.scrollLeft = scrollStart.current - delta;
  };

  const onMouseUp = () => { isDragging.current = false; };

  // Botones de flecha
  const scrollBy = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="h-28 px-4 flex flex-col justify-center space-y-3 border-t border-white/5 bg-black/40">
      <h4 className="text-[10px] font-bold text-brand-purple uppercase tracking-[0.3em] px-4">Alphabet</h4>

      <div className="flex items-center space-x-2">
        {/* Botón izquierda */}
        <button
          onClick={() => scrollBy(-200)}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Lista de letras */}
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="flex-1 flex items-center space-x-3 overflow-x-auto no-scrollbar pb-1 select-none cursor-grab active:cursor-grabbing"
        >
          {ALPHABET.map((item) => {
            const isActive = item.letter === activeLetter.letter;
            const isCompleted = completedLetters.includes(item.letter);

            return (
              <motion.div
                key={item.letter}
                whileHover={{ y: -4 }}
                onClick={() => {
                  if (!isDragging.current) setActiveLetter(item);
                }}
                className={`flex-shrink-0 w-12 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative cursor-pointer ${
                  isActive
                    ? 'bg-brand-blue border-b-4 border-brand-blue/50 shadow-[0_4px_20px_-5px_rgba(59,130,246,0.6)]'
                    : isCompleted
                    ? 'bg-bg-card border border-white/10 hover:border-white/30'
                    : 'bg-bg-card/40 border border-white/5 hover:border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <span className={`text-xl font-display font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
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
                      className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-bg-dark shadow-sm"
                    >
                      <Check size={8} className="text-white" strokeWidth={4} />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Botón derecha */}
        <button
          onClick={() => scrollBy(200)}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
