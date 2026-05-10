import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useLetter } from '../context/LetterContext';

export default function NotificationToast() {
  const { notifications, dismissNotification } = useLetter();

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{  opacity: 0, x: 80,  scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto w-80 bg-bg-card border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start space-x-3"
          >
            <span className="text-2xl flex-shrink-0">{n.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{n.title}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.subtitle}</p>
            </div>
            <button
              onClick={() => dismissNotification(n.id)}
              className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
