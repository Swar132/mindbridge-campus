import React, { useState, useEffect, useRef } from 'react';
import { Wind, Compass, Play, Pause, RotateCcw, CheckCircle2, Circle, Sparkles, ExternalLink } from 'lucide-react';

const PHASES = [
  { name: 'Inhale through nose', duration: 4, instruction: 'Breathe in slowly and deeply', scale: 'scale-125 bg-teal-400/40 text-teal-800 dark:text-teal-200' },
  { name: 'Hold your breath', duration: 7, instruction: 'Gently suspend your breath', scale: 'scale-125 bg-sky-400/50 text-sky-800 dark:text-sky-200' },
  { name: 'Exhale through mouth', duration: 8, instruction: 'Whoosh the air out completely', scale: 'scale-90 bg-teal-300/30 text-teal-800 dark:text-teal-200' }
];

export default function BreathingGroundingTool({ onOpenBreathing, onOpenGrounding }) {
  const [activeTab, setActiveTab] = useState('breathing'); // 'breathing' | 'grounding'

  // Breathing state
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(PHASES[0].duration);
  const [cycleCount, setCycleCount] = useState(1);
  const maxCycles = 4;
  const breathTimerRef = useRef(null);

  useEffect(() => {
    if (isBreathingActive) {
      breathTimerRef.current = setInterval(() => {
        setPhaseSecondsLeft(prev => {
          if (prev <= 1) {
            // Next phase
            setPhaseIndex(currPhase => {
              const nextPhase = (currPhase + 1) % PHASES.length;
              if (nextPhase === 0) {
                setCycleCount(c => (c >= maxCycles ? 1 : c + 1));
              }
              return nextPhase;
            });
            return PHASES[(phaseIndex + 1) % PHASES.length].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    }
    return () => clearInterval(breathTimerRef.current);
  }, [isBreathingActive, phaseIndex]);

  const resetBreathing = () => {
    setIsBreathingActive(false);
    setPhaseIndex(0);
    setPhaseSecondsLeft(PHASES[0].duration);
    setCycleCount(1);
  };

  // Grounding state
  const [groundingChecks, setGroundingChecks] = useState({
    see: false,
    touch: false,
    hear: false,
    smell: false,
    taste: false
  });

  const toggleGrounding = (key) => {
    setGroundingChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groundingCompletedCount = Object.values(groundingChecks).filter(Boolean).length;

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Somatic Nervous System Regulators
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                2-Min Reset
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive 4-7-8 breathwork pacer and 5-4-3-2-1 sensory scan for acute exam anxiety and panic.
            </p>
          </div>
        </div>

        {/* Sub-Tool Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('breathing')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'breathing'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" /> 4-7-8 Pacer
          </button>
          <button
            onClick={() => setActiveTab('grounding')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'grounding'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> 5-4-3-2-1 Scan
          </button>
        </div>
      </div>

      {/* Tab 1: Interactive 4-7-8 Breathing Pacer */}
      {activeTab === 'breathing' && (
        <div className="flex flex-col items-center justify-center py-4 space-y-6 animate-fade-in">
          {/* Animated Visual Breathing Orb */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Outer expanding halo */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-1000 ease-in-out border-4 border-teal-500/20 ${
                isBreathingActive ? PHASES[phaseIndex].scale : 'scale-100 bg-teal-500/5'
              }`}
            />
            {/* Inner pulsing orb */}
            <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 text-white flex flex-col items-center justify-center shadow-lg text-center p-3">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono leading-none">
                {isBreathingActive ? phaseSecondsLeft : '4-7-8'}
              </span>
              <span className="text-[11px] font-bold mt-1 max-w-[120px] leading-tight">
                {isBreathingActive ? PHASES[phaseIndex].name : 'Ready to Start'}
              </span>
              {isBreathingActive && (
                <span className="text-[9px] opacity-80 mt-1 uppercase tracking-wider">
                  Cycle {cycleCount} of {maxCycles}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-center text-slate-600 dark:text-slate-300 max-w-sm">
            {isBreathingActive
              ? PHASES[phaseIndex].instruction
              : 'Press Start to begin a guided 4-7-8 parasympathetic relaxation sequence.'}
          </p>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBreathingActive(!isBreathingActive)}
              className={`px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer ${
                isBreathingActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {isBreathingActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isBreathingActive ? 'Pause Exercise' : 'Start 4-7-8 Pacer'}
            </button>

            <button
              onClick={resetBreathing}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {onOpenBreathing && (
              <button
                onClick={onOpenBreathing}
                className="px-3 py-2.5 rounded-2xl border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Fullscreen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: 5-4-3-2-1 Sensory Grounding Scan */}
      {activeTab === 'grounding' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Sensory Anchors Found ({groundingCompletedCount} of 5)</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">{groundingCompletedCount * 20}% Grounded</span>
          </div>

          <div className="space-y-2.5">
            {[
              { key: 'see', count: 5, label: '5 Things You Can SEE', hint: 'Notice tiny details: wood texture, light refraction, pen clip, clock hands.' },
              { key: 'touch', count: 4, label: '4 Things You Can TOUCH', hint: 'Feel fabric of your jeans, coolness of desk, your feet planted on the floor.' },
              { key: 'hear', count: 3, label: '3 Things You Can HEAR', hint: 'Distant campus chatter, fan hum, keyboard clicks outside the door.' },
              { key: 'smell', count: 2, label: '2 Things You Can SMELL', hint: 'Faint coffee aroma, fresh breeze, book paper.' },
              { key: 'taste', count: 1, label: '1 Thing You Can TASTE', hint: 'Sip of water, mint gum, or notice the neutral taste in your mouth.' },
            ].map(item => {
              const checked = groundingChecks[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleGrounding(item.key)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                    checked
                      ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-bold text-xs flex items-center justify-center">
                        {item.count}
                      </span>
                      <h4 className={`text-xs sm:text-sm font-bold ${checked ? 'text-slate-600 dark:text-slate-300 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {item.label}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-7">
                      {item.hint}
                    </p>
                  </div>

                  <div className="shrink-0 text-orange-500 pt-0.5">
                    {checked ? <CheckCircle2 className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {onOpenGrounding && (
              <button
                onClick={onOpenGrounding}
                className="px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Fullscreen Grounding Guide
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
