import React, { useState } from 'react';
import { MessageSquare, Sparkles, Send, CheckCircle2, ArrowRight, Heart, X } from 'lucide-react';
import { api } from '../../api/client';

const PROMPTS = [
  {
    id: 'p1',
    category: 'Self-Compassion',
    title: 'De-escalating Academic Pressure',
    question: 'What is one unrealistic expectation you are placing on yourself right now that you would never demand from a close friend?',
    mood: 'Reflective',
    tags: ['Academic Life', 'Self-Compassion']
  },
  {
    id: 'p2',
    category: 'Imposter Syndrome',
    title: 'Quiet Progress & Resilience Check',
    question: 'List 3 technical or personal challenges you handled this semester that seemed intimidating when you first encountered them.',
    mood: 'Motivated',
    tags: ['Placement & Career', 'Imposter Syndrome']
  },
  {
    id: 'p3',
    category: 'Hostel & Life',
    title: 'Protecting Mental Bandwidth & Boundaries',
    question: 'Where is your mental energy leaking the most in your living space or schedule, and what is one small boundary you can establish this week?',
    mood: 'Calm',
    tags: ['Relationships & Social Life', 'Boundaries']
  },
  {
    id: 'p4',
    category: 'Placement Season',
    title: 'Reframing Rejection as Objective Data',
    question: 'If you treat a recent interview or shortlist outcome as pure feedback rather than a character judgment, what specific topic will you improve next?',
    mood: 'Determined',
    tags: ['Placement & Career', 'Rejection Recovery']
  },
  {
    id: 'p5',
    category: 'Gratitude',
    title: 'Micro-Wins in a Demanding Week',
    question: 'What are 3 tiny moments of comfort or accomplishment that brightened your day today (a warm beverage, a working code snippet, a laugh with peers)?',
    mood: 'Grateful',
    tags: ['Mental & Emotional Wellbeing', 'Gratitude']
  },
  {
    id: 'p6',
    category: 'Cognitive Reframing',
    title: 'Courtroom Trial of Catastrophic Thoughts',
    question: 'State your biggest current anxiety in one sentence. Now write three hard, objective facts that contradict this catastrophe.',
    mood: 'Relieved',
    tags: ['Mental & Emotional Wellbeing', 'Cognitive Reframing']
  }
];

export default function MoodJournalingTool({ onNavigate }) {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [journalText, setJournalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openJournalModal = (prompt) => {
    setSelectedPrompt(prompt);
    setJournalText('');
    setSaveSuccess(false);
    setErrorMsg('');
  };

  const handleSaveJournal = async (e) => {
    e.preventDefault();
    if (!journalText.trim() || !selectedPrompt) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await api.createJournal({
        title: selectedPrompt.title,
        content: `**Prompt:** ${selectedPrompt.question}\n\n**Reflection:**\n${journalText.trim()}`,
        mood_tag: selectedPrompt.mood,
        tags: selectedPrompt.tags
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSelectedPrompt(null);
        setSaveSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to save journal:', err);
      setErrorMsg('Failed to save to database. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Guided Mood & Reflection Prompts
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Journal Sync
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thoughtful reflection prompts that save directly to your encrypted MindBridge Journal.
            </p>
          </div>
        </div>
      </div>

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROMPTS.map(p => (
          <div
            key={p.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 inline-block">
                {p.category}
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                {p.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                "{p.question}"
              </p>
            </div>

            <button
              onClick={() => openJournalModal(p)}
              className="mt-2 w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Journal on This
            </button>
          </div>
        ))}
      </div>

      {/* Journal Entry Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-up space-y-4">
            <button
              onClick={() => setSelectedPrompt(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 inline-block mb-1.5">
                {selectedPrompt.category}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedPrompt.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                "{selectedPrompt.question}"
              </p>
            </div>

            {saveSuccess ? (
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 flex items-center gap-3 animate-fade-in">
                <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold">Entry Saved to Journal!</div>
                  <div className="opacity-90">Saved directly to your private MindBridge database.</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveJournal} className="space-y-3">
                <textarea
                  rows="5"
                  value={journalText}
                  onChange={e => setJournalText(e.target.value)}
                  placeholder="Type your authentic thoughts here... What does this bring up for you?"
                  className="w-full p-3.5 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                  autoFocus
                />

                {errorMsg && (
                  <div className="text-xs text-rose-500 font-semibold">{errorMsg}</div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {journalText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPrompt(null)}
                      className="px-3.5 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !journalText.trim()}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmitting ? 'Saving...' : 'Save to Journal'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
