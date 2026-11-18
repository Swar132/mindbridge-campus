import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Wind, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BreathingExerciseModal({ isOpen, onClose }) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState('inhale'); // 'inhale' (4s), 'hold' (7s), 'exhale' (8s)
  const [countdown, setCountdown] = useState(4);
  const [cycle, setCycle] = useState(1);
  const maxCycles = 4;

  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      setPhase('inhale');
      setCountdown(4);
      setCycle(1);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    let timer = null;
    if (isRunning) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev > 1) return prev - 1;

          // Transition to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return 7;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return 8;
          } else if (phase === 'exhale') {
            if (cycle >= maxCycles) {
              setIsRunning(false);
              setPhase('completed');
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#A78BFA', '#34D399', '#38BDF8'],
              });
              return 0;
            }
            setCycle((c) => c + 1);
            setPhase('inhale');
            return 4;
          }
          return 4;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, phase, cycle]);

  if (!isOpen) return null;

  const phaseConfig = {
    inhale: {
      label: 'Inhale Deeply & Slowly',
      sub: 'Breathe in through nose, expanding your belly',
      scale: 'scale-115 sm:scale-125 duration-[4000ms]',
      bg: 'bg-gradient-to-tr from-lavender-200 via-purple-100 to-sky-200 border-purple-300 shadow-glow-lavender',
      text: 'text-purple-900',
    },
    hold: {
      label: 'Hold Breath Gently',
      sub: 'Rest comfortably in calm stillness',
      scale: 'scale-115 sm:scale-125 duration-[7000ms]',
      bg: 'bg-gradient-to-tr from-mint-200 via-teal-100 to-emerald-200 border-mint-300 shadow-glow-mint',
      text: 'text-mint-900',
    },
    exhale: {
      label: 'Exhale Completely',
      sub: 'Release all cognitive tension through your mouth',
      scale: 'scale-90 duration-[8000ms]',
      bg: 'bg-gradient-to-tr from-sky-200 via-blue-100 to-indigo-200 border-sky-300 shadow-glow-sky',
      text: 'text-sky-900',
    },
    completed: {
      label: 'Practice Complete 🌿',
      sub: 'Notice the quiet calm in your body and mind',
      scale: 'scale-100 duration-500',
      bg: 'bg-gradient-to-tr from-emerald-100 to-mint-100 border-emerald-300 shadow-glow-mint',
      text: 'text-emerald-900',
    },
  };

  const currentCfg = phaseConfig[phase] || phaseConfig.inhale;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFFDF9] rounded-4xl max-w-md w-full shadow-2xl border border-cream-200 overflow-hidden text-center p-6 sm:p-8 relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 text-purple-700 font-bold text-xs tracking-wider uppercase mb-1">
          <Wind className="w-4 h-4" /> 4-7-8 Somatic Breathing
        </div>
        <h2 className="text-2xl font-serif font-bold text-charcoal-900">
          Mindful Calming Guide
        </h2>
        <p className="text-xs text-charcoal-500 mt-1 max-w-xs mx-auto">
          Stimulate your vagus nerve to slow down rapid heart rate and settle study anxiety.
        </p>

        {/* Breathing Circle Visualizer */}
        <div className="my-8 flex items-center justify-center h-52 relative">
          <div
            className={`w-44 h-44 rounded-full transition-all ease-in-out border-4 flex items-center justify-center ${currentCfg.scale} ${currentCfg.bg}`}
          >
            <div className="flex flex-col items-center">
              <span className={`text-4xl font-serif font-black tabular-nums ${currentCfg.text}`}>
                {phase === 'completed' ? '✨' : countdown}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider mt-1 text-charcoal-600">
                {phase === 'completed' ? 'Done' : phase}
              </span>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-1 min-h-[48px]">
          <h3 className="text-base font-serif font-bold text-charcoal-900">{currentCfg.label}</h3>
          <p className="text-xs text-charcoal-500">{currentCfg.sub}</p>
        </div>

        {/* Cycle Counter */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: maxCycles }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === cycle && isRunning
                  ? 'w-8 bg-purple-600 shadow-glow-lavender'
                  : i + 1 < cycle || phase === 'completed'
                  ? 'w-4 bg-purple-400'
                  : 'w-4 bg-cream-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-charcoal-400 mt-1.5 font-bold">
          Cycle {Math.min(cycle, maxCycles)} of {maxCycles}
        </p>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-2.5">
          {!isRunning && phase !== 'completed' && (
            <button
              onClick={() => setIsRunning(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs transition shadow-glow-lavender flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" /> Begin 2-Min Practice
            </button>
          )}

          {isRunning && (
            <button
              onClick={() => setIsRunning(false)}
              className="px-6 py-3 rounded-2xl bg-cream-200 hover:bg-cream-300 text-charcoal-800 font-extrabold text-xs transition flex items-center gap-2"
            >
              <Pause className="w-4 h-4 fill-current" /> Pause
            </button>
          )}

          {(isRunning || phase === 'completed' || cycle > 1) && (
            <button
              onClick={() => {
                setIsRunning(false);
                setPhase('inhale');
                setCountdown(4);
                setCycle(1);
              }}
              className="p-3 rounded-2xl border border-cream-200 hover:bg-cream-100 text-charcoal-600 transition"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
