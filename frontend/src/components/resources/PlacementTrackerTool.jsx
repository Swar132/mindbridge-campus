import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Plus, Minus, Sparkles, Award, ShieldCheck, ChevronRight } from 'lucide-react';

const INITIAL_PILLARS = {
  dsaSolved: 48,
  dsaTarget: 100,
  coreSubjects: [
    { id: 'c1', label: 'Operating Systems (Processes, Paging, Deadlocks)', done: true },
    { id: 'c2', label: 'DBMS (SQL Joins, Normalization, ACID Transactions)', done: true },
    { id: 'c3', label: 'Computer Networks (TCP 3-Way Handshake, DNS, OSI)', done: false },
    { id: 'c4', label: 'OOP & Clean Architecture (SOLID Principles)', done: true },
    { id: 'c5', label: 'Aptitude Tests (Quantitative, Logical, Verbal)', done: false }
  ],
  resumeMilestones: [
    { id: 'r1', label: '1-Page ATS-Optimized Format (80+ ATS score)', done: true },
    { id: 'r2', label: 'Quantifiable Action Points (XYZ: Accomplished X by doing Y measured by Z)', done: true },
    { id: 'r3', label: 'Clean GitHub Repositories with Visual README & Live Links', done: true },
    { id: 'r4', label: 'LinkedIn Profile Aligned with Resume Projects', done: false }
  ],
  projectDefense: [
    { id: 'p1', label: 'System Architecture Diagram Prepared & Understandable', done: true },
    { id: 'p2', label: 'Technical Trade-offs Justified (Why this DB / Framework over others)', done: true },
    { id: 'p3', label: 'Live Deployment Link Working & Resilient to Edge Cases', done: true },
    { id: 'p4', label: '2-Minute Elevator Pitch Rehearsed Smoothly', done: false }
  ],
  interviewSkills: [
    { id: 'i1', label: 'Verbalizing Code Strategy Out Loud Before Typing', done: true },
    { id: 'i2', label: 'STAR Method Behavioral Answers Prepared for 4 Scenarios', done: false },
    { id: 'i3', label: '2 Mock Peer Coding Rounds Completed', done: false },
    { id: 'i4', label: 'Handling Unseen Problems Without Silent Panic', done: true }
  ]
};

export default function PlacementTrackerTool({ userId }) {
  const storageKey = `mindbridge_placement_tracker_${userId || 'guest'}`;

  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PILLARS;
  });

  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.error(e);
    }
  }, [state, storageKey]);

  // Adjust DSA
  const adjustDsa = (delta) => {
    setState(prev => ({
      ...prev,
      dsaSolved: Math.max(0, Math.min(prev.dsaTarget * 2, prev.dsaSolved + delta))
    }));
  };

  const toggleChecklist = (pillarKey, id) => {
    setState(prev => ({
      ...prev,
      [pillarKey]: prev[pillarKey].map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    }));
  };

  // Readiness Calculation
  const dsaWeight = Math.min(1, state.dsaSolved / (state.dsaTarget || 100)) * 30; // 30%
  const calcPillar = (items, maxPts) => {
    const done = items.filter(i => i.done).length;
    return (done / (items.length || 1)) * maxPts;
  };

  const coreScore = calcPillar(state.coreSubjects, 20); // 20%
  const resumeScore = calcPillar(state.resumeMilestones, 20); // 20%
  const projectScore = calcPillar(state.projectDefense, 15); // 15%
  const interviewScore = calcPillar(state.interviewSkills, 15); // 15%
  const overallReadiness = Math.round(dsaWeight + coreScore + resumeScore + projectScore + interviewScore);

  let readinessBadge = { text: 'Foundation Building', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200' };
  if (overallReadiness >= 75) {
    readinessBadge = { text: 'Day-1 Placement Ready', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200' };
  } else if (overallReadiness >= 50) {
    readinessBadge = { text: 'Placement Competitive', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 border-sky-200' };
  }

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Placement Preparation Tracker
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${readinessBadge.color}`}>
                {readinessBadge.text}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track the 5 pillars: DSA targets, CS fundamentals, resume checks, and interview confidence.
            </p>
          </div>
        </div>

        {/* Big Readiness Score */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
          <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <div>
            <div className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-300">Readiness Score</div>
            <div className="text-lg font-extrabold text-teal-800 dark:text-teal-200 leading-none">{overallReadiness}%</div>
          </div>
        </div>
      </div>

      {/* Pillar 1: DSA Counter Block */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Pillar 1: Algorithmic Problem Solving</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">DSA LeetCode & Assessment Target</h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustDsa(-1)}
              className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="-1 solved"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white font-mono">
              {state.dsaSolved} / {state.dsaTarget} Solved
            </div>
            <button
              onClick={() => adjustDsa(1)}
              className="px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              title="+1 solved"
            >
              <Plus className="w-3.5 h-3.5" /> +1
            </button>
            <button
              onClick={() => adjustDsa(5)}
              className="px-2.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              title="+5 solved"
            >
              +5
            </button>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.round((state.dsaSolved / state.dsaTarget) * 100))}%` }}
          />
        </div>
      </div>

      {/* Pillars 2, 3, 4, 5 Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 2: Core CS Subjects */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-500" /> Core CS & Aptitude
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              {state.coreSubjects.filter(i => i.done).length}/{state.coreSubjects.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {state.coreSubjects.map(item => (
              <div
                key={item.id}
                onClick={() => toggleChecklist('coreSubjects', item.id)}
                className={`flex items-start gap-2 p-2 rounded-xl text-xs transition cursor-pointer ${
                  item.done ? 'bg-sky-50/50 dark:bg-sky-950/20 text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {item.done ? <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                <span className="leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 3: Resume & Portfolio */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Resume & Portfolio
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              {state.resumeMilestones.filter(i => i.done).length}/{state.resumeMilestones.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {state.resumeMilestones.map(item => (
              <div
                key={item.id}
                onClick={() => toggleChecklist('resumeMilestones', item.id)}
                className={`flex items-start gap-2 p-2 rounded-xl text-xs transition cursor-pointer ${
                  item.done ? 'bg-amber-50/50 dark:bg-amber-950/20 text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {item.done ? <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                <span className="leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 4: Projects Defense */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-500" /> Projects & Architecture Defense
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              {state.projectDefense.filter(i => i.done).length}/{state.projectDefense.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {state.projectDefense.map(item => (
              <div
                key={item.id}
                onClick={() => toggleChecklist('projectDefense', item.id)}
                className={`flex items-start gap-2 p-2 rounded-xl text-xs transition cursor-pointer ${
                  item.done ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {item.done ? <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                <span className="leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 5: Mock Interviews & Behavioral */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-500" /> Mock Interviews & STAR Stories
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              {state.interviewSkills.filter(i => i.done).length}/{state.interviewSkills.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {state.interviewSkills.map(item => (
              <div
                key={item.id}
                onClick={() => toggleChecklist('interviewSkills', item.id)}
                className={`flex items-start gap-2 p-2 rounded-xl text-xs transition cursor-pointer ${
                  item.done ? 'bg-teal-50/50 dark:bg-teal-950/20 text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {item.done ? <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                <span className="leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
