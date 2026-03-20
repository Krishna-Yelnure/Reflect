import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ShieldAlert, Timer, Play, ChevronRight, Activity, Scale, Minimize2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { calculateScore, getLevel, generateFirstStep, getBlockerMessages } from '@/app/utils/activationEnergy';
import { Input } from '@/app/components/ui/input';

export interface AEEMetrics {
  clarity?: number;
  resistance?: number;
  delay?: number;
  activationScore?: number;
  activationLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  firstStep?: string;
  startedAt?: string;
}

interface StartAssistProps {
  taskText: string;
  onChange?: (metrics: AEEMetrics) => void;
  onFocusComplete?: () => void;
  onCancel?: () => void;
}

export function StartAssist({ taskText, onChange, onFocusComplete, onCancel }: StartAssistProps) {
  const [clarity, setClarity] = useState<number>(5);
  const [resistance, setResistance] = useState<number>(1);
  const [delay, setDelay] = useState<number>(0);
  
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [focusSecondsRemaining, setFocusSecondsRemaining] = useState<number>(300); // 5 minutes
  const [focusActive, setFocusActive] = useState<boolean>(false);

  // Derived metrics
  const score = useMemo(() => calculateScore(clarity, resistance, delay), [clarity, resistance, delay]);
  const level = useMemo(() => getLevel(score), [score]);
  const blockers = useMemo(() => getBlockerMessages(clarity, resistance, delay), [clarity, resistance, delay]);
  const generatedStep = useMemo(() => generateFirstStep(taskText), [taskText]);

  const [currentStep, setCurrentStep] = useState(generatedStep);

  useEffect(() => {
    setCurrentStep(generatedStep);
  }, [generatedStep]);

  useEffect(() => {
    if (onChange) {
      onChange({
        clarity,
        resistance,
        delay,
        activationScore: score,
        activationLevel: level,
        firstStep: currentStep,
      });
    }
  }, [clarity, resistance, delay, score, level, currentStep]);

  const handleMakeSmaller = () => {
    // If it's already an 'open' action, we simplify to just 'breathe for 10 seconds'
    if (currentStep.toLowerCase().includes('open') || currentStep.length < 15) {
      setCurrentStep('Take 3 deep breaths before starting');
    } else {
      setCurrentStep('Open materials related to this task');
    }
  };

  const startFocus = () => {
    setFocusMode(true);
    setFocusActive(true);
    if (onChange) {
      onChange({
        clarity,
        resistance,
        delay,
        activationScore: score,
        activationLevel: level,
        firstStep: currentStep,
        startedAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    let interval: number;
    if (focusActive && focusSecondsRemaining > 0) {
      interval = window.setInterval(() => {
        setFocusSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (focusSecondsRemaining === 0 && focusActive) {
      setFocusActive(false);
    }
    return () => window.clearInterval(interval);
  }, [focusActive, focusSecondsRemaining]);

  const handleFocusFinish = () => {
    setFocusMode(false);
    if (onFocusComplete) {
      onFocusComplete();
    }
  };

  const badgeColors: Record<string, string> = {
    LOW: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
    HIGH: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  if (focusMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C18]/95 backdrop-blur-md"
      >
        <div className="bg-[#EDE8DF] p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl space-y-6">
          <h2 className="text-xl font-medium text-stone-800 font-serif">Focus Mode</h2>
          <p className="text-stone-600">Your first step:</p>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
            <p className="text-stone-800 font-medium">{currentStep}</p>
          </div>

          <div className="text-5xl font-light text-stone-800 tabular-nums py-4" style={{ fontFamily: 'var(--font-display)' }}>
            {Math.floor(focusSecondsRemaining / 60)}:{(focusSecondsRemaining % 60).toString().padStart(2, '0')}
          </div>

          {!focusActive && focusSecondsRemaining === 0 ? (
            <div className="space-y-4">
              <p className="text-stone-700 font-medium">5 minutes complete. Continue or stop?</p>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => { setFocusSecondsRemaining(300); setFocusActive(true); }} variant="outline">More Time</Button>
                <Button onClick={handleFocusFinish} className="bg-stone-800 text-white hover:bg-stone-700">I'm Done</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {focusActive ? (
                <Button onClick={() => setFocusActive(false)} variant="outline" className="w-full">
                  Pause
                </Button>
              ) : (
                <Button onClick={() => setFocusActive(true)} className="w-full bg-stone-800 text-white hover:bg-stone-700">
                  Resume
                </Button>
              )}
              <button 
                onClick={() => setFocusMode(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-medium w-full text-center py-2 transition-colors"
              >
                Cancel Focus
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-[#fcfbf9] border border-stone-200/60 rounded-xl p-5 space-y-5 shadow-sm my-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="font-medium text-stone-800 flex items-center gap-2">
          <Zap className="size-4 text-amber-500" />
          Start Assist
        </h3>
        {onCancel && (
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 text-sm">
            Close
          </button>
        )}
      </div>

      {/* 1. Activation Energy Scan */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <Label className="text-xs text-stone-500 uppercase tracking-widest">Clarity of first step</Label>
            <span className="text-xs font-medium text-stone-700">{clarity}/5</span>
          </div>
          <input 
            type="range" min="1" max="5" 
            value={clarity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClarity(Number(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer" 
          />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1">
            <span>Very Unclear</span>
            <span>Crystal Clear</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <Label className="text-xs text-stone-500 uppercase tracking-widest">Emotional Resistance</Label>
            <span className="text-xs font-medium text-stone-700">{resistance}/5</span>
          </div>
          <input 
            type="range" min="1" max="5" 
            value={resistance} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResistance(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer" 
          />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1">
            <span>None</span>
            <span>Overwhelming</span>
          </div>
        </div>

        <div>
          <Label className="text-xs text-stone-500 uppercase tracking-widest mb-1 block">Expected Delay To Start (minutes)</Label>
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-stone-400" />
            <Input 
              type="number" min="0" 
              value={delay} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDelay(Number(e.target.value))}
              className="w-24 text-center h-8 bg-white" 
            />
          </div>
        </div>
      </div>

      {/* 2. Smart Insight Panel */}
      <div className="bg-[#f4f2ec] rounded-lg p-4 pb-5 border border-stone-200/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-stone-600 uppercase tracking-widest">Energy Profile</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColors[level]}`}>
            {level} FRICTION
          </span>
        </div>

        {blockers.length > 0 && (
          <div className="space-y-2 mb-4">
            {blockers.map((b: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded px-2 py-1">
                <ShieldAlert className="size-3" />
                {b}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-stone-200/60">
          <div className="flex justify-between items-end mb-2">
            <Label className="text-xs text-stone-500 uppercase tracking-widest">Suggested Micro-Step</Label>
            <button onClick={handleMakeSmaller} className="text-[10px] flex items-center gap-1 text-stone-500 hover:text-stone-800 transition-colors">
              <Minimize2 className="size-3" /> Make it smaller
            </button>
          </div>
          <div className="bg-white px-3 py-2 rounded shadow-sm border border-stone-200 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <p className="text-sm font-medium text-stone-800 w-full">{currentStep}</p>
          </div>
        </div>
      </div>

      {/* 3. Action Controls */}
      <div className="pt-2">
        <Button onClick={startFocus} className="w-full gap-2 bg-stone-800 text-white hover:bg-stone-700 h-10">
          <Play className="size-4" />
          Start 5-Minute Focus
        </Button>
      </div>

    </div>
  );
}
