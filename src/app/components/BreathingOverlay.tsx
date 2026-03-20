import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface BreathingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathPhase = 'In' | 'Hold (Full)' | 'Out' | 'Hold (Empty)';

export function BreathingOverlay({ isOpen, onClose }: BreathingOverlayProps) {
  const [phase, setPhase] = useState<BreathPhase>('In');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setPhase('In');
      setProgress(0);
      return;
    }

    const phaseDuration = 4000; // 4 seconds per phase
    const intervalTime = 50;    // 50ms for smooth progress bar
    let currentPhase = 0;
    const phases: BreathPhase[] = ['In', 'Hold (Full)', 'Out', 'Hold (Empty)'];

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          currentPhase = (currentPhase + 1) % 4;
          setPhase(phases[currentPhase]);
          return 0;
        }
        return prev + (intervalTime / phaseDuration) * 100;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Animation values based on phase
  const getScale = () => {
    switch (phase) {
      case 'In': return progress / 100 * 0.5 + 1; // 1 to 1.5
      case 'Hold (Full)': return 1.5;
      case 'Out': return 1.5 - (progress / 100 * 0.5); // 1.5 to 1
      case 'Hold (Empty)': return 1;
    }
  };

  const getOpacity = () => {
    if (phase === 'Hold (Full)' || phase === 'Hold (Empty)') return 0.6;
    return 1;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md"
          style={{ backgroundColor: 'rgba(237, 232, 223, 0.92)' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-3 rounded-full bg-stone-200/50 hover:bg-stone-300/50 transition-colors text-stone-600"
            aria-label="Close breathing tool"
          >
            <X className="size-6" />
          </button>

          {/* Philosophy reminder */}
          <div className="absolute top-24 text-center px-6">
            <p className="text-stone-400 text-xs tracking-widest uppercase font-medium mb-2">Presence</p>
            <p className="text-stone-500 text-sm italic" style={{ fontFamily: 'var(--font-display)' }}>
              "Returning is the practice."
            </p>
          </div>

          {/* Animated Circle */}
          <div className="relative flex items-center justify-center w-80 h-80">
            {/* Outer ring (static) */}
            <div className="absolute inset-0 rounded-full border border-stone-300/30 shrink-0" />
            
            {/* Pulse ring (animated) */}
            <motion.div
              animate={{ 
                scale: getScale(),
                opacity: getOpacity(),
              }}
              transition={{ ease: "linear", duration: 0.05 }}
              className="w-40 h-40 rounded-full bg-amber-200/40 border border-amber-300/50"
            />

            {/* Phase Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                key={phase}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl font-light text-stone-700 tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {phase.includes('Hold') ? 'Hold' : `Breathe ${phase.toLowerCase()}`}
              </motion.span>
            </div>
          </div>

          {/* Progress dots */}
          <div className="mt-16 flex items-center gap-4">
            {['In', 'Hold (Full)', 'Out', 'Hold (Empty)'].map((p, idx) => (
              <div 
                key={p} 
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  phase === p ? 'bg-amber-400 scale-125' : 'bg-stone-300'
                }`}
              />
            ))}
          </div>

          <div className="mt-24 text-stone-400 text-[10px] uppercase tracking-widest">
            Box Breathing · 4-4-4-4
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
