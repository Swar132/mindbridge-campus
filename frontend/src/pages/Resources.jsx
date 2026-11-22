import React, { useState, useEffect, useMemo } from 'react';
import {
  Library,
  Search,
  Wind,
  Clock,
  ArrowRight,
  X,
  Play,
  Compass,
  BookOpen,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  ExternalLink,
  Calendar,
  Target,
  Award,
  Brain,
  Moon,
  Heart,
  Users,
  Zap,
  Check,
  Activity,
  MessageSquare,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

// Mini-Tool Components
import StudyPlannerTool from '../components/resources/StudyPlannerTool';
import PomodoroTimerTool from '../components/resources/PomodoroTimerTool';
import ExamCountdownTool from '../components/resources/ExamCountdownTool';
import PlacementTrackerTool from '../components/resources/PlacementTrackerTool';
import DailyHabitTrackerTool from '../components/resources/DailyHabitTrackerTool';
import MoodJournalingTool from '../components/resources/MoodJournalingTool';
import BreathingGroundingTool from '../components/resources/BreathingGroundingTool';
import GoalPlannerTool from '../components/resources/GoalPlannerTool';
import GuideReaderModal from '../components/resources/GuideReaderModal';

const CATEGORIES = [
  'All',
  'Academic Life',
  'Placement & Career',
  'Mental & Emotional Wellbeing',
  'Sleep & Physical Health',
  'Relationships & Social Life',
  'Productivity & Personal Growth',
];

const MINI_TOOLS_LIST = [
  { id: 'study-planner', title: 'Study Planner', category: 'Academic Life', desc: 'Timed syllabus sprints & active retrieval blocks', icon: BookOpen, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60' },
  { id: 'pomodoro', title: 'Pomodoro Focus Timer', category: 'Productivity & Personal Growth', desc: '25m/50m deep work cycles with acoustic chimes', icon: Clock, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' },
  { id: 'exam-countdown', title: 'Exam Countdown', category: 'Academic Life', desc: 'Live countdowns & unit revision checklists', icon: Calendar, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
  { id: 'placement-tracker', title: 'Placement Tracker', category: 'Placement & Career', desc: 'DSA counter, core CS subjects, & interview defense', icon: Target, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/60' },
  { id: 'habit-tracker', title: 'Daily Habit Tracker', category: 'Sleep & Physical Health', desc: 'Sleep, water, movement, study, & streak counters', icon: Activity, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
  { id: 'mood-journal', title: 'Mood Journaling Prompts', category: 'Mental & Emotional Wellbeing', desc: 'Guided reflections saving directly to your journal', icon: MessageSquare, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
  { id: 'breathing-grounding', title: 'Breathing & Grounding', category: 'Mental & Emotional Wellbeing', desc: '4-7-8 animated pacer & 5-4-3-2-1 sensory scan', icon: Wind, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/60' },
  { id: 'goal-planner', title: 'Goal Planner', category: 'Productivity & Personal Growth', desc: 'Decompose goals into micro-steps & sync with Mindy AI', icon: Brain, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60' },
];

const EXTERNAL_RESOURCES = [
  {
    name: 'Tele-MANAS',
    url: 'https://telemanas.mohfw.gov.in/',
    category: 'Mental & Emotional Wellbeing',
    purpose: 'Free 24/7 National Mental Health Helpline (Govt of India)',
    desc: 'Toll-free, confidential psychological counseling available in 20+ regional Indian languages (Call 14416 or 1800-891-4416).',
    status: '100% Free • Govt of India',
    isEmergency: true
  },
  {
    name: 'WHO Mental Health',
    url: 'https://www.who.int/health-topics/mental-health',
    category: 'Mental & Emotional Wellbeing',
    purpose: 'Evidence-based global mental health resources & self-care',
    desc: 'Authoritative research, clinical fact sheets, and stigma-reduction frameworks for youth and university students.',
    status: 'Free Access'
  },
  {
    name: 'Notion for Education',
    url: 'https://www.notion.com/product/notion-for-education',
    category: 'Productivity & Personal Growth',
    purpose: 'Semester notes, assignment trackers, and revision matrices',
    desc: 'Versatile workspace free for students using their university email (.edu / .ac.in). Ideal for course wikis.',
    status: 'Free for Students'
  },
  {
    name: 'Google Calendar',
    url: 'https://calendar.google.com/',
    category: 'Academic Life',
    purpose: 'Time-blocking lectures, lab submissions, & study sprints',
    desc: 'Master timetable scheduling with notification reminders to anchor wake times and eliminate missed assignment deadlines.',
    status: '100% Free'
  },
  {
    name: 'LeetCode',
    url: 'https://leetcode.com/',
    category: 'Placement & Career',
    purpose: 'Data Structures, Algorithms, & Technical Interview Drills',
    desc: 'Industry standard for technical placement assessments with curated interview company problem sets and weekly contests.',
    status: 'Free Core Practice'
  },
  {
    name: 'GeeksforGeeks',
    url: 'https://www.geeksforgeeks.org/',
    category: 'Placement & Career',
    purpose: 'Core CS Subject Revision & Interview Archives',
    desc: 'Comprehensive engineering study guides covering OS, DBMS, Computer Networks, System Design, and company archives.',
    status: 'Free Articles & Notes'
  },
  {
    name: 'NHS Sleep and Tiredness Guidance',
    url: 'https://www.nhs.uk/live-well/sleep-and-tiredness/',
    category: 'Sleep & Physical Health',
    purpose: 'Clinically verified sleep hygiene & fatigue management',
    desc: 'Evidence-based protocols from the UK National Health Service on repairing circadian rhythm, combating insomnia, and reducing chronic fatigue.',
    status: 'Public Health Guide'
  }
];

const DAILY_CHALLENGES = [
  { day: 0, text: 'Take a 15-minute phone-free walk around campus after dinner to clear mental clutter.', category: 'Sleep & Physical Health' },
  { day: 1, text: 'Single-task: Complete one 45-minute Pomodoro study block with your phone across the room.', category: 'Productivity & Personal Growth' },
  { day: 2, text: 'De-catastrophize: Write down one academic worry and list 3 concrete facts that refute it.', category: 'Mental & Emotional Wellbeing' },
  { day: 3, text: 'Hydration goal: Drink a full liter of water before noon to prevent afternoon brain fog.', category: 'Sleep & Physical Health' },
  { day: 4, text: 'Placement drill: Explain one project architecture diagram out loud in 2 minutes as if teaching a peer.', category: 'Placement & Career' },
  { day: 5, text: 'Academic triage: Identify the top 3 recurring questions from past 5-year exam papers for your hardest subject.', category: 'Academic Life' },
  { day: 6, text: 'Boundary check: Send a kind, clear message setting a boundary regarding late-night study or room noise.', category: 'Relationships & Social Life' }
];

export default function Resources({ onOpenBreathing, onOpenGrounding, onNavigate }) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'tools', 'guides', 'external', 'bookmarks'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedToolId, setSelectedToolId] = useState('study-planner');

  // Backend resources & Recommendations
  const [resources, setResources] = useState([]);
  const [personalized, setPersonalized] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reader Modal
  const [selectedResource, setSelectedResource] = useState(null);

  // LocalStorage keys for bookmarks & completed guides
  const bookmarksKey = `mindbridge_resource_bookmarks_${userId}`;
  const completedKey = `mindbridge_completed_guides_${userId}`;
  const challengeKey = `mindbridge_daily_challenge_${userId}_${new Date().toISOString().slice(0, 10)}`;

  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(bookmarksKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completedGuideIds, setCompletedGuideIds] = useState(() => {
    try {
      const saved = localStorage.getItem(completedKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [challengeCompleted, setChallengeCompleted] = useState(() => {
    try {
      return localStorage.getItem(challengeKey) === 'true';
    } catch {
      return false;
    }
  });

  // Current day challenge
  const todayChallenge = DAILY_CHALLENGES[new Date().getDay()] || DAILY_CHALLENGES[0];

  useEffect(() => {
    try {
      localStorage.setItem(bookmarksKey, JSON.stringify(bookmarkedIds));
    } catch (e) {}
  }, [bookmarkedIds, bookmarksKey]);

  useEffect(() => {
    try {
      localStorage.setItem(completedKey, JSON.stringify(completedGuideIds));
    } catch (e) {}
  }, [completedGuideIds, completedKey]);

  const toggleBookmark = (id, e) => {
    if (e) e.stopPropagation();
    setBookmarkedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCompletedGuide = (id, e) => {
    if (e) e.stopPropagation();
    setCompletedGuideIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleChallenge = () => {
    const next = !challengeCompleted;
    setChallengeCompleted(next);
    try {
      localStorage.setItem(challengeKey, String(next));
    } catch (e) {}
  };

  // Fetch resources and personalized recommendations
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, recData] = await Promise.allSettled([
        api.getResources(selectedCategory === 'All' ? '' : selectedCategory, search),
        api.getPersonalizedResources ? api.getPersonalizedResources() : Promise.resolve(null)
      ]);

      if (resData.status === 'fulfilled') {
        setResources(resData.value || []);
      }
      if (recData.status === 'fulfilled' && recData.value) {
        setPersonalized(recData.value);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, search]);

  // Filtered lists
  const filteredMiniTools = useMemo(() => {
    return MINI_TOOLS_LIST.filter(tool => {
      const matchCat = selectedCategory === 'All' || tool.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchSearch = !search || tool.title.toLowerCase().includes(search.toLowerCase()) || tool.desc.toLowerCase().includes(search.toLowerCase());
      const matchBookmark = activeTab !== 'bookmarks' || bookmarkedIds.includes(tool.id);
      return matchCat && matchSearch && matchBookmark;
    });
  }, [selectedCategory, search, activeTab, bookmarkedIds]);

  const filteredGuides = useMemo(() => {
    return resources.filter(r => {
      const matchCat = selectedCategory === 'All' || r.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.summary.toLowerCase().includes(search.toLowerCase());
      const matchBookmark = activeTab !== 'bookmarks' || bookmarkedIds.includes(r.id);
      return matchCat && matchSearch && matchBookmark;
    });
  }, [resources, selectedCategory, search, activeTab, bookmarkedIds]);

  const filteredExternal = useMemo(() => {
    return EXTERNAL_RESOURCES.filter(ext => {
      const matchCat = selectedCategory === 'All' || ext.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchSearch = !search || ext.name.toLowerCase().includes(search.toLowerCase()) || ext.purpose.toLowerCase().includes(search.toLowerCase()) || ext.desc.toLowerCase().includes(search.toLowerCase());
      const matchBookmark = activeTab !== 'bookmarks' || bookmarkedIds.includes(ext.name);
      return matchCat && matchSearch && matchBookmark;
    });
  }, [selectedCategory, search, activeTab, bookmarkedIds]);

  // Open related tool from guide
  const handleLaunchRelatedTool = (toolId) => {
    setSelectedResource(null);
    setSelectedToolId(toolId);
    setActiveTab('tools');
  };

  // Render selected tool
  const renderActiveMiniTool = () => {
    switch (selectedToolId) {
      case 'study-planner':
        return <StudyPlannerTool userId={userId} />;
      case 'pomodoro':
        return <PomodoroTimerTool userId={userId} />;
      case 'exam-countdown':
        return <ExamCountdownTool userId={userId} />;
      case 'placement-tracker':
        return <PlacementTrackerTool userId={userId} />;
      case 'habit-tracker':
        return <DailyHabitTrackerTool userId={userId} />;
      case 'mood-journal':
        return <MoodJournalingTool onNavigate={onNavigate} />;
      case 'breathing-grounding':
        return <BreathingGroundingTool onOpenBreathing={onOpenBreathing} onOpenGrounding={onOpenGrounding} />;
      case 'goal-planner':
        return <GoalPlannerTool userId={userId} onNavigate={onNavigate} />;
      default:
        return <StudyPlannerTool userId={userId} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 transition-colors duration-300">
      {/* Header Hub Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-sky-50 via-teal-50 to-indigo-50 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-teal-950/40 border border-sky-100/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
              Student Life & Wellbeing Hub
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Interactive Tools • Actionable Toolkits • Verified Resources
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Campus Wellbeing & Academic Hub
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Practical, evidence-based tools tailored for college realities: finals preparation, placement resilience, sleep architecture, hostel boundaries, and somatic stress recovery.
          </p>
        </div>
      </div>

      {/* Daily Practical Challenge Card */}
      <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">
                Today's Micro-Action
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {todayChallenge.category}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {todayChallenge.text}
            </p>
          </div>
        </div>

        <button
          onClick={toggleChallenge}
          className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs ${
            challengeCompleted
              ? 'bg-teal-600 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {challengeCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Challenge Done!
            </>
          ) : (
            <>
              <Check className="w-4 h-4" /> Mark as Completed
            </>
          )}
        </button>
      </div>

      {/* Personalized Recommendations Card (Based on Check-In Trends) */}
      {personalized && (
        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-indigo-50/70 via-sky-50/50 to-purple-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/30 border border-indigo-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Tailored to Your Check-In Patterns
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Focus Area: {personalized.focus_category}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {personalized.recommended_tools?.map((toolId) => {
                const toolMeta = MINI_TOOLS_LIST.find(t => t.id === toolId);
                if (!toolMeta) return null;
                return (
                  <button
                    key={toolId}
                    onClick={() => {
                      setSelectedToolId(toolId);
                      setActiveTab('tools');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" /> Open {toolMeta.title}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {personalized.reason}
          </p>

          {/* Quick Recommended Guides Row */}
          {personalized.recommended_resources?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {personalized.recommended_resources.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedResource(rec)}
                  className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 inline-block mb-1.5">
                      {rec.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {rec.title}
                    </h4>
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <span>Read Guide</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation View Tabs & Search Controls */}
      <div className="p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Hub View Switcher */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: 'All Hub Resources', icon: Library },
            { id: 'tools', label: 'Interactive Mini-Tools', icon: Play, count: 8 },
            { id: 'guides', label: 'Actionable Guides', icon: BookOpen, count: resources.length || 12 },
            { id: 'external', label: 'Verified External Tools', icon: ExternalLink, count: EXTERNAL_RESOURCES.length },
            { id: 'bookmarks', label: 'My Bookmarks', icon: Bookmark, count: bookmarkedIds.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across guides, interactive tools, exam prep, sleep hygiene, placement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-xl shrink-0 font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: Interactive Mini-Tools (If on 'all' or 'tools' view) */}
      {(activeTab === 'all' || activeTab === 'tools') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Interactive Student Tools
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              8 Live Tools • State Persisted
            </span>
          </div>

          {/* Quick Mini-Tool Launcher Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {MINI_TOOLS_LIST.map(tool => {
              const Icon = tool.icon;
              const isSelected = selectedToolId === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-sky-500'}`} />
                  <span className="text-[11px] font-bold leading-tight line-clamp-1">{tool.title}</span>
                </button>
              );
            })}
          </div>

          {/* Currently Selected Live Mini-Tool */}
          <div className="transition-all duration-300">
            {renderActiveMiniTool()}
          </div>
        </div>
      )}

      {/* SECTION 2: Actionable In-Depth Guides (If on 'all', 'guides', or 'bookmarks') */}
      {(activeTab === 'all' || activeTab === 'guides' || activeTab === 'bookmarks') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-500" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Actionable Campus Guides
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {filteredGuides.length} Guides Available • Structured Protocols
            </span>
          </div>

          {filteredGuides.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No guides match your filter or bookmarks. Try adjusting search or category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGuides.map((guide) => {
                const isBookmarked = bookmarkedIds.includes(guide.id);
                const isCompleted = completedGuideIds.includes(guide.id);

                // Extract relatable situation hook if available
                const situationHook = guide.content?.match(/###\s*(?:1\.\s*)?The Situation\n([^\n]+)/i)?.[1];

                // Check completed steps
                let stepsDone = 0;
                try {
                  const savedSteps = localStorage.getItem(`mindbridge_guide_steps_${userId}_${guide.id}`);
                  if (savedSteps) stepsDone = JSON.parse(savedSteps).length;
                } catch (e) {}

                return (
                  <div
                    key={guide.id}
                    onClick={() => setSelectedResource(guide)}
                    className="group rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 p-5 sm:p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between relative"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                          {guide.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleBookmark(guide.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition cursor-pointer"
                            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Guide'}
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="w-4 h-4 text-amber-500 fill-current" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>

                          <span className="text-[10px] text-slate-400 flex items-center gap-1 pl-1">
                            <Clock className="w-3 h-3" /> {guide.read_time_minutes}m
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition leading-snug">
                        {guide.title}
                      </h3>

                      {situationHook ? (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-sky-50/60 dark:bg-slate-800/60 border border-sky-100/60 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 italic line-clamp-2">
                          "{situationHook}"
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                          {guide.summary}
                        </p>
                      )}
                    </div>

                    {/* Bottom Status Row */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        {isCompleted ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-current" /> Completed
                          </span>
                        ) : stepsDone > 0 ? (
                          <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {stepsDone} steps done
                          </span>
                        ) : (
                          <span className="text-slate-400">Not started</span>
                        )}
                      </div>

                      <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                        <span>Read Protocol</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Verified External Resources (If on 'all' or 'external') */}
      {(activeTab === 'all' || activeTab === 'external') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Verified External Resources & Helplines
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Curated High-Value Campus References
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExternal.map((ext) => (
              <div
                key={ext.name}
                className={`p-5 rounded-3xl border transition flex flex-col justify-between shadow-xs ${
                  ext.isEmergency
                    ? 'bg-gradient-to-br from-rose-50/70 to-rose-100/30 dark:from-rose-950/40 dark:to-slate-900 border-rose-200 dark:border-rose-900'
                    : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      ext.isEmergency
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {ext.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {ext.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {ext.name}
                  </h3>

                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {ext.purpose}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {ext.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={ext.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      ext.isEmergency
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>Visit Official Resource</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reader Modal (Displays Engaging 6-Part Structured Guide with Interactive Checklist, Timer & Reflection) */}
      {selectedResource && (
        <GuideReaderModal
          guide={selectedResource}
          userId={userId}
          isBookmarked={bookmarkedIds.includes(selectedResource.id)}
          isCompleted={completedGuideIds.includes(selectedResource.id)}
          onToggleBookmark={(id, e) => toggleBookmark(id, e)}
          onToggleCompleted={(id, e) => toggleCompletedGuide(id, e)}
          onLaunchTool={handleLaunchRelatedTool}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}
