import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle2, Circle, Trash2, Sparkles, Clock, AlertCircle } from 'lucide-react';

const PRESETS = [
  {
    name: 'Finals Triage Sprint',
    tasks: [
      { id: 'p1', subject: 'Core Engineering', topic: 'Past 5-Year Questions (High-Yield Units)', minutes: 60, priority: 'High', completed: false },
      { id: 'p2', subject: 'Mathematics / Logic', topic: 'Formula Sheet Active Recall & Derivations', minutes: 45, priority: 'High', completed: false },
      { id: 'p3', subject: 'Lab / Viva', topic: 'Diagrams & Key Architecture Definitions', minutes: 30, priority: 'Medium', completed: false }
    ]
  },
  {
    name: 'Placement Prep Sprint',
    tasks: [
      { id: 'p4', subject: 'DSA & Coding', topic: '2 LeetCode Medium (Array / Two Pointers)', minutes: 50, priority: 'High', completed: false },
      { id: 'p5', subject: 'Core CS Theory', topic: 'Operating Systems & DBMS Key Concepts', minutes: 40, priority: 'Medium', completed: false },
      { id: 'p6', subject: 'HR & Behavior', topic: 'STAR Method: Rehearse 2 Project Scenarios', minutes: 30, priority: 'Low', completed: false }
    ]
  },
  {
    name: 'Daily Balance Rhythm',
    tasks: [
      { id: 'p7', subject: 'Coursework', topic: 'Finish Weekly Assignment / Tutorial Sheet', minutes: 45, priority: 'High', completed: false },
      { id: 'p8', subject: 'Revision', topic: 'Review Today\'s Lecture Slides (30 min)', minutes: 30, priority: 'Medium', completed: false },
      { id: 'p9', subject: 'Tomorrow Prep', topic: '15-min Glance at Upcoming Syllabus Topics', minutes: 15, priority: 'Low', completed: false }
    ]
  }
];

export default function StudyPlannerTool({ userId }) {
  const storageKey = `mindbridge_study_plan_${userId || 'guest'}`;

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: '1', subject: 'Operating Systems', topic: 'Process Synchronization & Semaphore Semantics', minutes: 45, priority: 'High', completed: false },
      { id: '2', subject: 'Algorithms', topic: 'Dynamic Programming (Knapsack & Subsequence)', minutes: 60, priority: 'High', completed: true },
      { id: '3', subject: 'Database Systems', topic: 'B-Tree Indexing & Transaction ACID Properties', minutes: 35, priority: 'Medium', completed: false },
    ];
  });

  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newMinutes, setNewMinutes] = useState(45);
  const [newPriority, setNewPriority] = useState('Medium');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks, storageKey]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      subject: newSubject.trim() || 'General Study',
      topic: newTopic.trim(),
      minutes: Number(newMinutes) || 30,
      priority: newPriority,
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setNewTopic('');
    setNewSubject('');
    setShowAddForm(false);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const loadPreset = (presetTasks) => {
    const timestamped = presetTasks.map(t => ({ ...t, id: Date.now() + Math.random().toString() }));
    setTasks([...tasks, ...timestamped]);
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(t => !t.completed));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.minutes || 0), 0);
  const remainingMinutes = tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.minutes || 0), 0);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Daily Study Sprint Planner
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Action Tool
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Break syllabus blocks into manageable, timed retrieval sprints.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Session
          </button>
        </div>
      </div>

      {/* Progress Metric Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Sprint Completion ({completedCount}/{totalCount} tasks)</span>
          <span className="font-bold text-sky-600 dark:text-sky-400">{progressPercent}% Done • {remainingMinutes}m left</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Campus Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => loadPreset(p.tasks)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 font-medium transition cursor-pointer"
            >
              + {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Form Modal / Expansion */}
      {showAddForm && (
        <form onSubmit={addTask} className="p-4 rounded-2xl bg-sky-50/60 dark:bg-slate-800/80 border border-sky-200/80 dark:border-slate-700 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Subject / Course</label>
              <input
                type="text"
                placeholder="e.g. Operating Systems or DSA"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Duration & Priority</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={newMinutes}
                  onChange={e => setNewMinutes(e.target.value)}
                  className="w-24 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Topic / Concrete Target</label>
            <input
              type="text"
              placeholder="e.g. Solve 3 Binary Tree recursion problems"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs"
            >
              Save Session
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No study sessions planned yet. Click "Add Session" or load a campus preset above!
          </div>
        ) : (
          tasks.map(t => (
            <div
              key={t.id}
              className={`group flex items-center justify-between p-3.5 rounded-2xl border transition ${
                t.completed
                  ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-400 line-through opacity-75'
                  : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => toggleTask(t.id)}
                  className="text-sky-500 hover:text-sky-600 transition shrink-0 cursor-pointer"
                >
                  {t.completed ? <CheckCircle2 className="w-5 h-5 fill-current text-teal-500" /> : <Circle className="w-5 h-5 text-slate-400" />}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      {t.subject}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${
                      t.priority === 'High'
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        : t.priority === 'Medium'
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold truncate mt-0.5">
                    {t.topic}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" /> {t.minutes}m
                </span>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="p-1 rounded-lg text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Delete session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Controls */}
      {completedCount > 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={clearCompleted}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition cursor-pointer"
          >
            Clear Completed Sessions ({completedCount})
          </button>
        </div>
      )}
    </div>
  );
}
