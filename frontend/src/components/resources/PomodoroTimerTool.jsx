import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Volume2, VolumeX, Sparkles, CheckCircle2 } from 'lucide-react';

const MODES = {
  focus: { name: 'Deep Focus', minutes: 25, color: 'from-sky-500 to-indigo-500', border: 'border-sky-500' },
  deepFocus: { name: 'Extended 50m', minutes: 50, color: 'from-indigo-500 to-purple-500', border: 'border-indigo-500' },
  shortBreak: { name: 'Short Break', minutes: 5, color: 'from-teal-500 to-emerald-500', border: 'border-teal-500' },
  longBreak: { name: 'Long Break', minutes: 15, color: 'from-amber-500 to-orange-500', border: 'border-amber-500' },
};

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch (e) {
    console.error('Web Audio error:', e);
  }
}

export default function PomodoroTimerTool({ userId }) {
  const [modeKey, setModeKey] = useState('focus');
  const currentMode = MODES[modeKey];
  const [timeLeft, setTimeLeft] = useState(currentMode.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const storageKey = `mindbridge_pomo_count_${userId || 'guest'}_${new Date().toISOString().slice(0, 10)}`;
  const [completedSessions, setCompletedSessions] = useState(() => {
    try {
      return Number(localStorage.getItem(storageKey)) || 0;
    } catch {
      return 0;
    }
  });

  const timerRef = useRef(null);

  useEffect(() => {
    setTimeLeft(currentMode.minutes * 60);
    setIsRunning(false);
  }, [modeKey]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            if (soundEnabled) playChime();
            if (modeKey.includes('focus') || modeKey.includes('Focus')) {
              setCompletedSessions(c => {
                const next = c + 1;
                try {
                  localStorage.setItem(storageKey, String(next));
                } catch (e) {}
                return next;
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, soundEnabled, modeKey, storageKey]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(currentMode.minutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = currentMode.minutes * 60;
  const progressPercent = Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Pomodoro Focus Timer
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Deep Work
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured single-task intervals with acoustic cues and session counting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition cursor-pointer"
            title={soundEnabled ? 'Sound alerts enabled' : 'Sound alerts muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(MODES).map(([key, mode]) => (
          <button
            key={key}
            onClick={() => setModeKey(key)}
            className={`py-2 px-3 rounded-2xl text-xs font-bold transition cursor-pointer flex flex-col items-center gap-0.5 border ${
              modeKey === key
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm border-transparent'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <span>{mode.name}</span>
            <span className="text-[10px] font-normal opacity-80">{mode.minutes} min</span>
          </button>
        ))}
      </div>

      {/* Visual Clock Display */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative w-52 h-52 flex items-center justify-center">
          {/* Circular SVG Ring */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-sky-500 transition-all duration-1000 ease-linear"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Time & State in Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {formattedTime}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
              {isRunning ? 'Session Active' : timeLeft === 0 ? 'Cycle Completed' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={toggleTimer}
            className={`px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-sky-500 hover:bg-sky-600 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pause Session
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Start Focus Sprint
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Reset to start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Completed Session Counter */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Today's Completed Focus Sprints:
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-xs text-sky-600 dark:text-sky-400">
          <CheckCircle2 className="w-4 h-4 text-teal-500" />
          <span>{completedSessions} Pomodoros ({completedSessions * 25} mins deep work)</span>
        </div>
      </div>
    </div>
  );
}
