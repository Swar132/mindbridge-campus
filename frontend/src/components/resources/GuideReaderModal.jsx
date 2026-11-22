import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Clock,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Target,
  Brain,
  Flame,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Calendar,
  Activity,
  MessageSquare,
  Wind,
  ShieldCheck,
  Check,
  HeartHandshake,
  PhoneCall,
  Save
} from 'lucide-react';

// Tool launcher mapping
const TOOL_MAP = [
  { id: 'study-planner', title: 'Study Planner', icon: BookOpen, match: ['study planner'] },
  { id: 'pomodoro', title: 'Pomodoro Focus Timer', icon: Clock, match: ['pomodoro'] },
  { id: 'exam-countdown', title: 'Exam Countdown', icon: Calendar, match: ['exam countdown'] },
  { id: 'placement-tracker', title: 'Placement Tracker', icon: Target, match: ['placement tracker', 'placement preparation tracker'] },
  { id: 'habit-tracker', title: 'Daily Habit Tracker', icon: Activity, match: ['habit tracker', 'daily habit tracker'] },
  { id: 'mood-journal', title: 'Mood Journaling', icon: MessageSquare, match: ['mood journal', 'mood journaling'] },
  { id: 'breathing-grounding', title: 'Breathing & Grounding', icon: Wind, match: ['breathing', 'grounding'] },
  { id: 'goal-planner', title: 'Goal Planner', icon: Brain, match: ['goal planner'] },
];

// Helper to play a gentle audio chime when countdown completes
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // AudioContext may be blocked before gesture
  }
}

// Robust parser for the 6-part framework
function parseGuideContent(content, summary) {
  if (!content) {
    return {
      situation: summary || '',
      whatYouShouldKnow: [],
      tryThisNow: [],
      quickChallenge: null,
      rememberThis: '',
      learnMore: null,
      rawContent: ''
    };
  }

  const sections = {};
  const regex = /###\s+(?:[1-6]\.\s*)?([^\n]+)\n([\s\S]*?)(?=(?:###\s+(?:[1-6]\.\s*)?[^\n]+|$))/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const heading = match[1].trim().toLowerCase();
    const body = match[2].trim();
    if (heading.includes('situation')) {
      sections.situation = body;
    } else if (heading.includes('what you should know') || heading.includes('know')) {
      sections.whatYouShouldKnow = body;
    } else if (heading.includes('try this now') || heading.includes('action')) {
      sections.tryThisNow = body;
    } else if (heading.includes('quick challenge') || heading.includes('challenge')) {
      sections.quickChallenge = body;
    } else if (heading.includes('remember this') || heading.includes('remember')) {
      sections.rememberThis = body;
    } else if (heading.includes('learn more') || heading.includes('references')) {
      sections.learnMore = body;
    }
  }

  // Parse What You Should Know bullet items
  const whatYouShouldKnowItems = [];
  if (sections.whatYouShouldKnow) {
    const lines = sections.whatYouShouldKnow.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        const boldMatch = itemText.match(/^\*\*([^*]+)\*\*[:\s]*(.*)$/);
        if (boldMatch) {
          whatYouShouldKnowItems.push({
            keyword: boldMatch[1].trim(),
            description: boldMatch[2].trim()
          });
        } else {
          whatYouShouldKnowItems.push({
            keyword: '',
            description: itemText
          });
        }
      }
    }
  }

  // Parse Try This Now numbered steps
  const tryThisNowItems = [];
  if (sections.tryThisNow) {
    const lines = sections.tryThisNow.split('\n');
    let currentStep = null;
    for (const line of lines) {
      const trimmed = line.trim();
      const stepMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (stepMatch) {
        if (currentStep) tryThisNowItems.push(currentStep);
        const fullStepText = stepMatch[2].trim();
        const boldStepMatch = fullStepText.match(/^\*\*([^*]+)\*\*[:\s]*(.*)$/);
        if (boldStepMatch) {
          currentStep = {
            num: parseInt(stepMatch[1], 10),
            title: boldStepMatch[1].trim(),
            instruction: boldStepMatch[2].trim()
          };
        } else {
          currentStep = {
            num: parseInt(stepMatch[1], 10),
            title: `Step ${stepMatch[1]}`,
            instruction: fullStepText
          };
        }
      } else if (currentStep && trimmed) {
        currentStep.instruction += ' ' + trimmed;
      }
    }
    if (currentStep) tryThisNowItems.push(currentStep);
  }

  // Parse Quick Challenge
  let challengeObj = null;
  if (sections.quickChallenge) {
    const challengeText = sections.quickChallenge;
    const titleMatch = challengeText.match(/^\*\*([^*]+)\*\*[:\s]*([\s\S]*)$/);
    let title = 'Quick Action Sprint';
    let instructions = challengeText;
    let durationMins = 3;

    if (titleMatch) {
      title = titleMatch[1].trim();
      instructions = titleMatch[2].trim();
    }
    const durMatch = (title + ' ' + instructions).match(/(\d+)\s*(?:mins?|minutes?)/i);
    if (durMatch) {
      durationMins = parseInt(durMatch[1], 10);
    }
    challengeObj = {
      title,
      instructions,
      durationMins
    };
  }

  return {
    situation: sections.situation || summary,
    whatYouShouldKnow: whatYouShouldKnowItems,
    tryThisNow: tryThisNowItems,
    quickChallenge: challengeObj,
    rememberThis: sections.rememberThis || '',
    learnMore: sections.learnMore || '',
    rawContent: content
  };
}

export default function GuideReaderModal({
  guide,
  userId,
  isBookmarked,
  isCompleted,
  onToggleBookmark,
  onToggleCompleted,
  onLaunchTool,
  onClose
}) {
  if (!guide) return null;

  const parsed = useMemo(() => {
    return parseGuideContent(guide.content, guide.summary);
  }, [guide.content, guide.summary]);

  // Step checklist state per guide
  const stepsStorageKey = `mindbridge_guide_steps_${userId}_${guide.id}`;
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem(stepsStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleStep = (stepNum) => {
    setCompletedSteps(prev => {
      const next = prev.includes(stepNum) ? prev.filter(x => x !== stepNum) : [...prev, stepNum];
      try {
        localStorage.setItem(stepsStorageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const totalSteps = parsed.tryThisNow.length;
  const completedStepsCount = completedSteps.filter(s => s <= totalSteps).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

  // Quick challenge interactive timer
  const initialSeconds = (parsed.quickChallenge?.durationMins || 3) * 60;
  const [timerSeconds, setTimerSeconds] = useState(initialSeconds);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    setTimerSeconds((parsed.quickChallenge?.durationMins || 3) * 60);
    setTimerRunning(false);
    setTimerDone(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [guide.id, parsed.quickChallenge?.durationMins]);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            setTimerDone(true);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const toggleTimer = () => {
    if (timerDone) {
      setTimerSeconds(initialSeconds);
      setTimerDone(false);
      setTimerRunning(true);
    } else {
      setTimerRunning(!timerRunning);
    }
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerDone(false);
    setTimerSeconds(initialSeconds);
  };

  const formatTimerDisplay = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Quick challenge note state
  const noteStorageKey = `mindbridge_challenge_note_${userId}_${guide.id}`;
  const [challengeNote, setChallengeNote] = useState(() => {
    try {
      return localStorage.getItem(noteStorageKey) || '';
    } catch {
      return '';
    }
  });
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  const saveChallengeNote = (val) => {
    setChallengeNote(val);
    try {
      localStorage.setItem(noteStorageKey, val);
      setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 2000);
    } catch (e) {}
  };

  // Collapsible accordion for "Learn More"
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);

  // Detect related mini-tools mentioned in guide or category
  const detectedTools = useMemo(() => {
    const textToScan = (guide.content + ' ' + guide.category + ' ' + (guide.tags || '')).toLowerCase();
    return TOOL_MAP.filter(tool => {
      return tool.match.some(m => textToScan.includes(m));
    });
  }, [guide]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden relative animate-scale-up">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {guide.category}
                </span>

                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {guide.read_time_minutes || 4} min read
                </span>

                {totalSteps > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                    completedStepsCount === totalSteps
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                  }`}>
                    {completedStepsCount} of {totalSteps} steps completed
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                {guide.title}
              </h2>
            </div>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={(e) => onToggleBookmark(guide.id, e)}
                className={`p-2 rounded-xl transition cursor-pointer border ${
                  isBookmarked
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700'
                }`}
                title={isBookmarked ? 'Bookmarked' : 'Bookmark Guide'}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                title="Close Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Step Progress Bar */}
          {totalSteps > 0 && (
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Scrollable Structured Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
          
          {/* SECTION 1: The Situation */}
          <div className="rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-sky-50/80 via-teal-50/50 to-indigo-50/40 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-teal-950/30 border border-sky-100/90 dark:border-slate-700/80 relative">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-800 dark:text-sky-300 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>1. The Situation</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed italic">
              "{parsed.situation}"
            </p>
          </div>

          {/* SECTION 2: What You Should Know (Takeaway Cards) */}
          {parsed.whatYouShouldKnow.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  <span>2. What You Should Know</span>
                </div>
                <span className="text-[10px] text-slate-400">Core Takeaways</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {parsed.whatYouShouldKnow.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      {item.keyword && (
                        <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">
                          {item.keyword}:
                        </span>
                      )}
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: Try This Now (Interactive Action Checklist) */}
          {parsed.tryThisNow.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>3. Try This Now</span>
                </div>
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  Interactive Checklist ({completedStepsCount}/{totalSteps})
                </span>
              </div>

              <div className="space-y-2">
                {parsed.tryThisNow.map((step) => {
                  const isChecked = completedSteps.includes(step.num);
                  return (
                    <div
                      key={step.num}
                      onClick={() => toggleStep(step.num)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <button
                        type="button"
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isChecked
                            ? 'bg-teal-600 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-600 text-transparent hover:border-teal-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            isChecked
                              ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            Step {step.num}
                          </span>
                          <span className={`text-xs font-extrabold ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {step.title}
                          </span>
                        </div>
                        <p className={`text-xs ${isChecked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                          {step.instruction}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: Quick Challenge (Interactive Micro-Activity) */}
          {parsed.quickChallenge && (
            <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-transparent dark:from-amber-950/30 dark:via-slate-800/50 dark:to-slate-900 border border-amber-200/90 dark:border-amber-900/60 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-current" />
                  <span>4. Quick Challenge</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  ~{parsed.quickChallenge.durationMins} Mins Activity
                </span>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {parsed.quickChallenge.title}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                  {parsed.quickChallenge.instructions}
                </p>
              </div>

              {/* Integrated Focus Sprint Timer */}
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-extrabold font-mono text-amber-700 dark:text-amber-300 tracking-tight">
                    {formatTimerDisplay(timerSeconds)}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {timerDone ? '🎉 Done!' : timerRunning ? 'Focusing...' : 'Sprint Timer'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTimer}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                      timerDone
                        ? 'bg-teal-600 text-white'
                        : timerRunning
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {timerDone ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" /> Repeat Sprint
                      </>
                    ) : timerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Start Sprint
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetTimer}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Micro Reflection Scratchpad */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Save className="w-3 h-3 text-slate-400" /> Quick Reflection Note:
                  </span>
                  {noteSavedFeedback && (
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved to your device
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Type your immediate answer or priority notes here..."
                  value={challengeNote}
                  onChange={(e) => saveChallengeNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* SECTION 5: Remember This (Memorable Mental Anchor) */}
          {parsed.rememberThis && (
            <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-teal-950 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-300 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>5. Remember This</span>
              </div>
              <p className="text-xs sm:text-sm font-bold leading-relaxed text-slate-100">
                "{parsed.rememberThis}"
              </p>
            </div>
          )}

          {/* SECTION 6: Learn More & Campus Resources (Accordion) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/40 transition">
            <button
              onClick={() => setLearnMoreOpen(!learnMoreOpen)}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  6. Learn More & Campus Support
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-400">
                <span>{learnMoreOpen ? 'Hide' : 'Expand'}</span>
                {learnMoreOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {learnMoreOpen && (
              <div className="p-4 border-t border-slate-200/70 dark:border-slate-800 space-y-4 text-xs">
                {/* Related interactive tools shortcut pills */}
                {detectedTools.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Direct Mini-Tool Shortcuts
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {detectedTools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              onClose();
                              onLaunchTool(tool.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-400 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                          >
                            <Icon className="w-3.5 h-3.5 text-sky-500" /> Launch {tool.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Academic references & external links */}
                {parsed.learnMore && (
                  <div className="space-y-1 text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Verified Academic Sources & Citations
                    </span>
                    {parsed.learnMore}
                  </div>
                )}

                {/* Campus Support & Tele-MANAS Hotline Card */}
                <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2">
                  <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-xs">
                    <HeartHandshake className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Campus Counsellor & Crisis Helplines</span>
                  </div>
                  <p className="text-[11px] text-teal-950 dark:text-teal-300 leading-relaxed">
                    • <strong>Campus Counsellor:</strong> Dr. Nitu Singh Bhadouria • Counselling Room, SAC I, First Floor (Email: <em>nitusingh_b@dau.ac.in</em>)
                    <br />
                    • <strong>National Mental Health Helpline:</strong> Call Tele-MANAS toll-free at <strong>14416</strong> (24/7, Govt of India)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={(e) => onToggleCompleted(guide.id, e)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shadow-xs ${
              isCompleted
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 fill-current" /> Marked Completed
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-slate-400" /> Mark as Completed
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer shadow-xs"
            >
              Done Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
