import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, CheckCircle2, Circle, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

function formatCountdown(targetDateStr) {
  const target = new Date(targetDateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { text: 'Exam Today / Past', isUrgent: false, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days === 0 && hours < 24) {
    return { text: `${hours}h ${minutes}m remaining`, isUrgent: true, isPast: false };
  }
  if (days === 1) {
    return { text: `Tomorrow (${hours}h left)`, isUrgent: true, isPast: false };
  }
  return { text: `In ${days} days, ${hours} hours`, isUrgent: days <= 3, isPast: false };
}

export default function ExamCountdownTool({ userId }) {
  const storageKey = `mindbridge_exam_countdown_${userId || 'guest'}`;

  // Default target date 3 days from now
  const defaultDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultDate2 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [exams, setExams] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: '1',
        title: 'Operating Systems Endterm Examination',
        datetime: defaultDate,
        priority: 'Urgent',
        topics: [
          { name: 'Process Synchronization & Semaphores', done: true },
          { name: 'Virtual Memory & Paging Algorithms', done: true },
          { name: 'Deadlock Detection & Banker’s Algorithm', done: false },
          { name: 'File System & Disk Scheduling (SCAN/C-SCAN)', done: false },
        ]
      },
      {
        id: '2',
        title: 'Computer Networks Theory & Viva',
        datetime: defaultDate2,
        priority: 'High',
        topics: [
          { name: 'TCP 3-Way Handshake & Flow Control', done: true },
          { name: 'Routing Protocols (OSPF, BGP, RIP)', done: false },
          { name: 'DNS, HTTP/2, and TLS Handshake', done: false },
        ]
      }
    ];
  });

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(defaultDate);
  const [newPriority, setNewPriority] = useState('High');
  const [newTopicsText, setNewTopicsText] = useState('');
  const [expandedExamId, setExpandedExamId] = useState('1');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(exams));
    } catch (e) {
      console.error(e);
    }
  }, [exams, storageKey]);

  const addExam = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const topicsArray = newTopicsText
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(name => ({ name, done: false }));

    const newExam = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      datetime: newDate,
      priority: newPriority,
      topics: topicsArray.length > 0 ? topicsArray : [{ name: 'Full Syllabus Revision', done: false }],
    };

    setExams([...exams, newExam]);
    setNewTitle('');
    setNewTopicsText('');
    setShowForm(false);
  };

  const deleteExam = (id) => {
    setExams(exams.filter(e => e.id !== id));
  };

  const toggleTopic = (examId, topicIndex) => {
    setExams(exams.map(exam => {
      if (exam.id !== examId) return exam;
      const updatedTopics = exam.topics.map((top, idx) =>
        idx === topicIndex ? { ...top, done: !top.done } : top
      );
      return { ...exam, topics: updatedTopics };
    }));
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Exam & Viva Countdown Planner
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Timeline
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live countdown timers and syllabus revision checklists for upcoming tests.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Exam / Viva
        </button>
      </div>

      {/* Add Exam Form */}
      {showForm && (
        <form onSubmit={addExam} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Exam / Subject Title</label>
              <input
                type="text"
                placeholder="e.g. Database Systems Midterm"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Exam Date & Time</label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Key Units / Topics (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. Unit 1 Relational Algebra, Unit 2 Normalization, Unit 3 Transactions"
              value={newTopicsText}
              onChange={e => setNewTopicsText(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
            >
              Save Exam Countdown
            </button>
          </div>
        </form>
      )}

      {/* Exam Cards */}
      <div className="space-y-4">
        {exams.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No exams added. Click "Add Exam / Viva" to set up your revision countdown.
          </div>
        ) : (
          exams.map(exam => {
            const countdown = formatCountdown(exam.datetime);
            const doneTopics = exam.topics.filter(t => t.done).length;
            const totalTopics = exam.topics.length;
            const progress = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;
            const isExpanded = expandedExamId === exam.id;

            return (
              <div
                key={exam.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        countdown.isUrgent
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        {countdown.text}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(exam.datetime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
                      {exam.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                      className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      {doneTopics}/{totalTopics} Revised ({progress}%)
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-500 transition cursor-pointer"
                      title="Remove exam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Expandable Topic Checklist */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 animate-fade-in">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Target Syllabus Revision Topics:
                    </span>
                    {exam.topics.map((topic, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleTopic(exam.id, idx)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition cursor-pointer ${
                          topic.done
                            ? 'bg-teal-50/60 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 line-through'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {topic.done ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span>{topic.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
