import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle2, Circle, Sparkles, Moon, Droplet, Activity, BookOpen, Heart } from 'lucide-react';

const HABITS = [
  { id: 'sleep', title: '7+ Hours Restful Sleep', desc: 'Protected circadian rhythm & sleep onset', icon: Moon, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' },
  { id: 'water', title: '2.5L+ Clean Hydration', desc: 'Prevented hostel headaches & afternoon fatigue', icon: Droplet, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60' },
  { id: 'movement', title: '20+ Min Physical Movement', desc: 'Brisk campus walk, gym, or sports', icon: Activity, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
  { id: 'study', title: '90+ Min Deep Focus Study', desc: 'Distraction-free single-tasking session', icon: BookOpen, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
  { id: 'checkin', title: 'Daily MindBridge Check-In', desc: 'Reflective awareness of mood and stress', icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60' },
];

export default function DailyHabitTrackerTool({ userId }) {
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const habitsKey = `mindbridge_habits_${userId || 'guest'}_${todayDateStr}`;
  const streakKey = `mindbridge_streak_${userId || 'guest'}`;

  const [completedHabits, setCompletedHabits] = useState(() => {
    try {
      const saved = localStorage.getItem(habitsKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return ['sleep', 'water'];
  });

  const [streak, setStreak] = useState(() => {
    try {
      const saved = localStorage.getItem(streakKey);
      if (saved) return Number(saved) || 5;
    } catch (e) {
      console.error(e);
    }
    return 5;
  });

  useEffect(() => {
    try {
      localStorage.setItem(habitsKey, JSON.stringify(completedHabits));
    } catch (e) {
      console.error(e);
    }
  }, [completedHabits, habitsKey]);

  const toggleHabit = (id) => {
    setCompletedHabits(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(h => h !== id) : [...prev, id];
      // If at least 3 completed, keep streak active
      if (next.length >= 3 && !exists && prev.length === 2) {
        setStreak(s => {
          const newS = s + 1;
          try { localStorage.setItem(streakKey, String(newS)); } catch (e) {}
          return newS;
        });
      }
      return next;
    });
  };

  const completedCount = completedHabits.length;
  const totalCount = HABITS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Daily Student Habit Tracker
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Consistency
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track sleep, hydration, movement, study, and daily awareness.
            </p>
          </div>
        </div>

        {/* Streak Flame Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-extrabold text-xs">
          <Flame className="w-4 h-4 text-amber-500 fill-current animate-pulse" />
          <span>{streak}-Day Streak</span>
        </div>
      </div>

      {/* Progress Metric Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Today's Habits Completed ({completedCount}/{totalCount})</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{progressPercent}% Achieved</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Habit Checkboxes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HABITS.map(habit => {
          const Icon = habit.icon;
          const isDone = completedHabits.includes(habit.id);
          return (
            <div
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                isDone
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/60'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${habit.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDone ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {habit.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {habit.desc}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-emerald-500">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 fill-current" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
