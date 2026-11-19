import React, { useState, useEffect } from 'react';
import { Target, Sparkles, CheckCircle2, Circle, Send, Brain, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client';

const INITIAL_GOAL = {
  title: 'Secure Strong Day-1 Campus Placement',
  deadline: '2026-12-15',
  motivation: 'Become financially independent and build high-impact distributed systems.',
  microSteps: [
    { id: 'g1', text: 'Solve 1 medium Tree or Graph DSA problem every morning', done: true },
    { id: 'g2', text: 'Revise 1 Core CS subject topic (e.g. OS Paging or DBMS Normalization)', done: false },
    { id: 'g3', text: 'Practice 1 behavioral question out loud using STAR method', done: false },
  ]
};

export default function GoalPlannerTool({ userId, onNavigate }) {
  const storageKey = `mindbridge_goal_planner_${userId || 'guest'}`;

  const [goal, setGoal] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GOAL;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editMotivation, setEditMotivation] = useState(goal.motivation);
  const [editDeadline, setEditDeadline] = useState(goal.deadline);
  const [newStepText, setNewStepText] = useState('');

  const [syncingWithAI, setSyncingWithAI] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(goal));
    } catch (e) {
      console.error(e);
    }
  }, [goal, storageKey]);

  const toggleStep = (stepId) => {
    setGoal(prev => ({
      ...prev,
      microSteps: prev.microSteps.map(s => s.id === stepId ? { ...s, done: !s.done } : s)
    }));
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setGoal(prev => ({
      ...prev,
      title: editTitle.trim() || prev.title,
      motivation: editMotivation.trim() || prev.motivation,
      deadline: editDeadline || prev.deadline,
    }));
    setIsEditing(false);
  };

  const addMicroStep = (e) => {
    e.preventDefault();
    if (!newStepText.trim()) return;
    const newStep = {
      id: Date.now().toString(),
      text: newStepText.trim(),
      done: false
    };
    setGoal(prev => ({
      ...prev,
      microSteps: [...prev.microSteps, newStep]
    }));
    setNewStepText('');
  };

  const deleteStep = (stepId) => {
    setGoal(prev => ({
      ...prev,
      microSteps: prev.microSteps.filter(s => s.id !== stepId)
    }));
  };

  const syncGoalWithMindy = async () => {
    try {
      setSyncingWithAI(true);
      setSyncSuccess(false);
      await api.createMemory({
        category: 'goal',
        topic: goal.title,
        key_point: goal.motivation,
        details: `Target Deadline: ${goal.deadline}. Daily Micro-Steps: ${goal.microSteps.map(s => s.text).join('; ')}`
      });
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to sync goal with Mindy memory:', err);
    } finally {
      setSyncingWithAI(false);
    }
  };

  const completedSteps = goal.microSteps.filter(s => s.done).length;
  const totalSteps = goal.microSteps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Goal Chunking & Daily Micro-Steps
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Mindy AI Linked
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Decompose semester ambitions into 3 daily micro-steps and sync them with Mindy AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditTitle(goal.title);
              setEditMotivation(goal.motivation);
              setEditDeadline(goal.deadline);
              setIsEditing(!isEditing);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Goal Details'}
          </button>
        </div>
      </div>

      {/* Goal Summary Card */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Primary Semester Goal</label>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Core Why / Motivation</label>
              <input
                type="text"
                value={editMotivation}
                onChange={e => setEditMotivation(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Target Date</label>
              <input
                type="date"
                value={editDeadline}
                onChange={e => setEditDeadline(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
            >
              Save Details
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50/60 via-purple-50/40 to-sky-50/60 dark:from-slate-800/80 dark:to-slate-800/40 border border-rose-100 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Target Deadline: {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {progressPercent}% Complete
            </span>
          </div>
          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
            {goal.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 italic">
            "{goal.motivation}"
          </p>

          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Daily Micro-Steps */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Daily Actionable Micro-Steps:
        </span>
        {goal.microSteps.map(step => (
          <div
            key={step.id}
            onClick={() => toggleStep(step.id)}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
              step.done
                ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40 text-slate-400 line-through'
                : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-semibold">{step.text}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteStep(step.id);
              }}
              className="p-1 rounded-lg text-slate-300 hover:text-rose-500 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Micro-step Form */}
      <form onSubmit={addMicroStep} className="flex gap-2">
        <input
          type="text"
          placeholder="Add another daily micro-step (e.g. 15 mins of OS revision)..."
          value={newStepText}
          onChange={e => setNewStepText(e.target.value)}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {/* Sync with Mindy AI Button */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Brain className="w-4 h-4 text-purple-500 shrink-0" />
          <span>Syncing informs Mindy AI's long-term memory to check in on this goal during chats.</span>
        </div>

        <button
          onClick={syncGoalWithMindy}
          disabled={syncingWithAI}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {syncingWithAI ? 'Syncing with Mindy...' : syncSuccess ? 'Synced Successfully!' : 'Sync with Mindy AI'}
        </button>
      </div>
    </div>
  );
}
