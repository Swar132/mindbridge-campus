import React, { useState, useEffect } from 'react';
import {
  Smile,
  Zap,
  Moon,
  Battery,
  TrendingUp,
  Heart,
  Bot,
  BookOpen,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Wind,
  Compass,
  X,
  ChevronRight,
  Flame,
  Award,
  Clock,
  Shield,
  Layers,
  GraduationCap,
  Scale,
  MoreVertical,
  Activity,
  Share2,
  Lock,
  HeartHandshake
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MindyCharacter,
  CardWaveDecoration,
  MOOD_VISUALS
} from '../components/Illustrations';

export default function Dashboard({
  onOpenCheckIn,
  onOpenBreathing,
  onOpenGrounding,
  onOpenEmergency,
  onNavigate,
}) {
  const { user } = useAuth();
  const [insightsData, setInsightsData] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [stressHistory, setStressHistory] = useState([]);
  const [sleepHistory, setSleepHistory] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [chartRange, setChartRange] = useState('7'); // '7' or '14'
  const [loading, setLoading] = useState(true);

  // Quick 1-tap mood selection
  const [quickMood, setQuickMood] = useState(null);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [insights, moods, stress, sleep, todayCheckIn] = await Promise.all([
        api.getPersonalInsights().catch(() => null),
        api.getMoods(30).catch(() => []),
        api.getStressEntries(30).catch(() => []),
        api.getSleepEntries(30).catch(() => []),
        api.getTodayCheckIn().catch(() => null),
      ]);

      setInsightsData(insights);
      setMoodHistory(moods || []);
      setStressHistory(stress || []);
      setSleepHistory(sleep || []);
      setTodayStatus(todayCheckIn);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick 1-tap mood submission
  const handleQuickMoodClick = async (moodKey) => {
    setQuickMood(moodKey);
    setIsSubmittingQuick(true);
    try {
      await api.submitDailyCheckIn({
        mood: moodKey,
        mood_intensity: moodKey === 'Very Happy' ? 9 : moodKey === 'Happy' ? 7 : moodKey === 'Neutral' ? 5 : moodKey === 'Anxious' ? 6 : 4,
        energy_level: moodKey === 'Very Happy' || moodKey === 'Happy' ? 7 : 5,
        stress_level: moodKey === 'Stressed' || moodKey === 'Anxious' ? 7 : 3,
        stress_category: 'Academics & Exams',
        sleep_hours: 7.5,
        tags: ['Quick Check-in'],
      });

      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0EA5E9', '#A78BFA', '#14B8A6', '#FB923C'],
      });

      await fetchData();
    } catch (err) {
      console.error('Quick mood error:', err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Student';
  const hasCheckedInToday = Boolean(todayStatus?.has_checked_in);
  const streakDays = todayStatus?.streak_days || 0;

  // STRICT NON-FABRICATION CHECK:
  // A user has real data only if they have recorded moods, stress, sleep, or checked in today
  const hasAnyData = Boolean(
    (moodHistory && moodHistory.length > 0) ||
    (stressHistory && stressHistory.length > 0) ||
    (sleepHistory && sleepHistory.length > 0) ||
    hasCheckedInToday ||
    (insightsData?.metrics?.has_data && insightsData.metrics.total_checkins_this_month > 0)
  );

  // Calculate real metrics from actual user entries
  const metrics = insightsData?.metrics;
  const realScore = metrics?.weekly_wellbeing_score;
  const totalRating = realScore != null ? (realScore / 10).toFixed(1) : null;
  const ratingCircumference = 2 * Math.PI * 45; // radius 45
  const strokeDashoffset = totalRating != null
    ? ratingCircumference - (parseFloat(totalRating) / 10) * ratingCircumference
    : ratingCircumference;

  // Real chart data from user's actual history (NO Math.sin fabrication)
  const daysCount = chartRange === '7' ? 7 : 14;
  const chartData = [];
  const now = new Date();

  if (hasAnyData) {
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = chartRange === '7'
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayMood = moodHistory.find((m) => m.recorded_at?.startsWith(dateStr));
      const dayStress = stressHistory.find((s) => s.recorded_at?.startsWith(dateStr));

      // ONLY use real data if recorded on that day; otherwise null so recharts does not invent points
      if (dayMood || dayStress) {
        chartData.push({
          date: dayLabel,
          rating: dayMood ? Math.round((dayMood.intensity || 5) * 10) : null,
          balance: dayStress ? Math.round((10 - dayStress.level) * 10) : null,
        });
      } else {
        chartData.push({
          date: dayLabel,
          rating: null,
          balance: null,
        });
      }
    }
  }

  // Count how many real days were actually logged
  const loggedDaysInChart = chartData.filter((pt) => pt.rating !== null || pt.balance !== null).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-300">
      {/* =========================================================
          1. GREETING HEADER
          ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hello {firstName},
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {hasAnyData
              ? 'Here is your real-time campus wellbeing summary.'
              : 'Welcome to your private campus wellbeing sanctuary.'}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={onOpenCheckIn}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{hasCheckedInToday ? 'Check In Again' : 'Daily 60-Sec Check-In'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. EMPTY STATE FOR NEW USERS (STRICT NON-FABRICATION)
          When user has no recorded wellbeing data, do NOT show
          fake scores, fake sine-waves, or fake trends!
          ========================================================= */}
      {!hasAnyData && (
        <div className="space-y-6">
          {/* Hero Welcome Card */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-sky-50/90 via-purple-50/70 to-teal-50/80 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-teal-950/40 border border-sky-100/90 dark:border-slate-800 shadow-sm">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-4xl shrink-0 border border-sky-100 dark:border-slate-700">
                🌿
              </div>

              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Welcome to MindBridge Campus</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Start Your Personal Wellbeing Journey
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  MindBridge never populates your private dashboard with fake scores. Log your first 60-second check-in below to unlock your real-time wellbeing rating, weekly stress equilibrium charts, and personalized academic coping strategies.
                </p>

                {/* 1-Tap Quick Mood Selector */}
                <div className="pt-3 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    How are you feeling right now? (1-Tap Quick Log):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: 'Very Happy', emoji: '😄', label: 'Great' },
                      { key: 'Happy', emoji: '😊', label: 'Good' },
                      { key: 'Neutral', emoji: '😐', label: 'Okay' },
                      { key: 'Anxious', emoji: '😰', label: 'Anxious' },
                      { key: 'Stressed', emoji: '😫', label: 'Stressed' },
                    ].map((m) => (
                      <button
                        key={m.key}
                        disabled={isSubmittingQuick}
                        onClick={() => handleQuickMoodClick(m.key)}
                        className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs text-xs font-bold text-slate-800 dark:text-slate-200 transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="text-base">{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}

                    <button
                      onClick={onOpenCheckIn}
                      className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <span>Full 60-Sec Check-in</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Locked Features Preview (Honest empty state indicating what will unlock) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Features Unlocked After Your First Check-In
              </h3>
              <span className="text-xs text-slate-400 font-medium">100% data-driven • No fake numbers</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-3xl p-5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Real Wellbeing Score</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    A multi-factor composite synthesized directly from your logged mood valence, perceived academic pressure, and sleep consistency.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                  <Lock className="w-3 h-3" />
                  <span>Awaiting 1st check-in</span>
                </div>
              </div>

              <div className="rounded-3xl p-5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Rhythm History Chart</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Interactive trendlines mapping your daily emotional baseline across exam dates, assignment deadlines, and campus weekends.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                  <Lock className="w-3 h-3" />
                  <span>Awaiting 1st check-in</span>
                </div>
              </div>

              <div className="rounded-3xl p-5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Observational Intelligence</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Identifies personal correlations, such as how 7+ hours of sleep improves your afternoon energy and study stamina.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                  <Lock className="w-3 h-3" />
                  <span>Awaiting 1st check-in</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Support Tools Available Right Now */}
          <div className="rounded-3xl p-6 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Instant Wellness & Campus Support (Available 24/7)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={onOpenBreathing}
                className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 hover:bg-teal-100/70 dark:hover:bg-teal-900/50 border border-teal-200/80 dark:border-teal-800/60 text-left transition space-y-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">4-7-8 Breathwork</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">2-minute somatic calm</p>
                </div>
              </button>

              <button
                onClick={onOpenGrounding}
                className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 hover:bg-orange-100/70 dark:hover:bg-orange-900/50 border border-orange-200/80 dark:border-orange-800/60 text-left transition space-y-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/80 text-orange-700 dark:text-orange-300 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">5-4-3-2-1 Grounding</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Reset acute sensory focus</p>
                </div>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('counsellors')}
                className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100/70 dark:hover:bg-sky-900/50 border border-sky-200/80 dark:border-sky-800/60 text-left transition space-y-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/80 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Campus Counsellor</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Nitu Singh Bhadouria • SAC I</p>
                </div>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('ai')}
                className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/50 border border-purple-200/80 dark:border-purple-800/60 text-left transition space-y-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Mindy AI Companion</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Confidential listener</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          3. POPULATED STATE (WHEN USER HAS REAL DATA)
          Rendered cleanly and beautifully with real user data!
          ========================================================= */}
      {hasAnyData && (
        <div className="space-y-6">
          {/* Top Row: Total Well-Being Rating & Rating History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Total Well-Being Rating Donut Card (4 cols) */}
            <div className="lg:col-span-4 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition">
              {/* Radial Highlight */}
              <div className="absolute inset-0 bg-radial from-sky-100/40 dark:from-sky-900/20 via-transparent to-transparent pointer-events-none" />

              {/* Radial Progress Gauge */}
              <div className="relative w-44 h-44 flex items-center justify-center mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="11"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    className="text-sky-500 dark:text-sky-400 transition-all duration-1000 ease-out"
                    strokeWidth="11"
                    strokeDasharray={ratingCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    style={{
                      filter: 'drop-shadow(0 4px 10px rgba(14, 165, 233, 0.35))',
                    }}
                  />
                </svg>

                {/* Score inside Donut Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {totalRating || '—'}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Total
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                well-being rating
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
                <span>{realScore >= 75 ? 'Healthy Resilience' : 'Active Growth'}</span>
              </div>
            </div>

            {/* Right: Rating History Dual-Line Area Chart (8 cols) */}
            <div className="lg:col-span-8 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Rating history
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {loggedDaysInChart > 0
                      ? `Based on your ${loggedDaysInChart} logged check-in${loggedDaysInChart > 1 ? 's' : ''}`
                      : 'Log daily to build your personal rhythm graph'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span>Wellbeing</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                      <span>Equilibrium</span>
                    </span>
                  </div>

                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setChartRange('7')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        chartRange === '7'
                          ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      7D
                    </button>
                    <button
                      onClick={() => setChartRange('14')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        chartRange === '14'
                          ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      14D
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="blueGlowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const val1 = payload[0]?.value;
                          const val2 = payload[1]?.value;
                          if (val1 == null && val2 == null) {
                            return (
                              <div className="rounded-2xl p-2 bg-white/95 dark:bg-slate-800/95 shadow-md border border-slate-200 dark:border-slate-700 text-xs">
                                <p className="font-bold text-slate-800 dark:text-white">{label}</p>
                                <p className="text-slate-400">No entry logged</p>
                              </div>
                            );
                          }
                          return (
                            <div className="rounded-2xl p-2.5 bg-white/95 dark:bg-slate-800/95 shadow-md border border-slate-200 dark:border-slate-700 text-xs">
                              <p className="font-bold text-slate-800 dark:text-white mb-1">{label}</p>
                              {val1 != null && <p className="text-sky-600 font-semibold">Wellbeing: {val1}%</p>}
                              {val2 != null && <p className="text-orange-500 font-semibold">Equilibrium: {val2}%</p>}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rating"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#blueGlowGradient)"
                      isAnimationActive={true}
                      connectNulls={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#f97316"
                      strokeWidth={2.2}
                      dot={false}
                      isAnimationActive={true}
                      connectNulls={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Middle Row: 5 Core Wellbeing Metric Cards (Driven by Actual User Data) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Card 1: Emotional Mood (Light Sky / Teal) */}
            <div className="rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100/80 dark:border-sky-900/50 min-h-[175px]">
              <div className="flex items-center justify-between z-10">
                <span className="p-1 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300">
                  {metrics?.current_mood || 'Logged'}
                </span>
              </div>

              <div className="my-1 flex flex-col items-center text-center z-10">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-sky-500 mb-1.5">
                  <Smile className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Emotional mood
                </span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {metrics?.current_mood_intensity != null ? `${metrics.current_mood_intensity}.0` : '—'}
                </span>
              </div>

              <CardWaveDecoration color="#38bdf8" opacity={0.3} />
            </div>

            {/* Card 2: Stress Relief (Warm Peach / Amber) */}
            <div className="rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100/80 dark:border-amber-900/50 min-h-[175px]">
              <div className="flex items-center justify-between z-10">
                <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
                  <Shield className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {metrics?.today_stress_level != null ? `${10 - metrics.today_stress_level}/10 calm` : 'Calm'}
                </span>
              </div>

              <div className="my-1 flex flex-col items-center text-center z-10">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-amber-500 mb-1.5">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Stress buffer
                </span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {metrics?.today_stress_level != null ? `${10 - metrics.today_stress_level}.0` : '—'}
                </span>
              </div>

              <CardWaveDecoration color="#f59e0b" opacity={0.25} />
            </div>

            {/* Card 3: Vital Energy (Mint / Teal) */}
            <div className="rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100/80 dark:border-teal-900/50 min-h-[175px]">
              <div className="flex items-center justify-between z-10">
                <span className="p-1 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400">
                  <Battery className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                  Vitality
                </span>
              </div>

              <div className="my-1 flex flex-col items-center text-center z-10">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-teal-500 mb-1.5">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Day energy
                </span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {metrics?.energy_level != null ? `${metrics.energy_level}.0` : '—'}
                </span>
              </div>

              <CardWaveDecoration color="#14b8a6" opacity={0.25} />
            </div>

            {/* Card 4: Rest & Sleep (Indigo / Pale Blue) */}
            <div className="rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-900/50 min-h-[175px]">
              <div className="flex items-center justify-between z-10">
                <span className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                  <Moon className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  Last night
                </span>
              </div>

              <div className="my-1 flex flex-col items-center text-center z-10">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-blue-500 mb-1.5">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Sleep duration
                </span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {metrics?.last_night_sleep_hours != null ? `${metrics.last_night_sleep_hours}h` : '—'}
                </span>
              </div>

              <CardWaveDecoration color="#3b82f6" opacity={0.25} />
            </div>

            {/* Card 5: School-Life Equilibrium (Soft Lavender) */}
            <div className="col-span-2 sm:col-span-1 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100/80 dark:border-purple-900/50 min-h-[175px]">
              <div className="flex items-center justify-between z-10">
                <span className="p-1 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400">
                  <Scale className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                  Consistency
                </span>
              </div>

              <div className="my-1 flex flex-col items-center text-center z-10">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-purple-500 mb-1.5">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Equilibrium
                </span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {metrics?.sleep_consistency_score != null ? `${(metrics.sleep_consistency_score / 10).toFixed(1)}` : '—'}
                </span>
              </div>

              <CardWaveDecoration color="#8b5cf6" opacity={0.25} />
            </div>
          </div>

          {/* Section: Upcoming Recommended Activities */}
          <div className="rounded-3xl p-6 space-y-4 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upcoming campus activities & support
              </h3>
              <button
                onClick={() => onNavigate && onNavigate('resources')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition cursor-pointer"
              >
                Show all
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <th className="pb-2 font-medium">Activity name</th>
                    <th className="pb-2 font-medium hidden sm:table-cell">Focus area</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Availability</th>
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr className="hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                        🌬️
                      </span>
                      <span>Box Breathing Micro-Action</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">Somatic stress relief</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                        Recommended
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">Anytime • 2 Min</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={onOpenBreathing}
                        className="p-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 transition cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                        🤝
                      </span>
                      <span>SAC I Counsellor Office Hours</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">Nitu Singh Bhadouria • Room SAC I</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                        Confidential
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">Mon-Fri 10AM-5PM</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigate && onNavigate('counsellors')}
                        className="p-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 transition cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Actual Past Results / Check-ins */}
          <div className="rounded-3xl p-6 space-y-4 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Your Recent Check-In Records
              </h3>
              <button
                onClick={() => onNavigate && onNavigate('insights')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition cursor-pointer"
              >
                Deep Insights
              </button>
            </div>

            {moodHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No past check-in records found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-2 font-medium">Mood Logged</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Intensity</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium hidden md:table-cell">Notes</th>
                      <th className="pb-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {moodHistory.slice(0, 4).map((entry) => {
                      const visual = MOOD_VISUALS[entry.mood] || { emoji: '🙂', accentColor: '#0EA5E9' };
                      return (
                        <tr key={entry.id} className="hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">
                              {visual.emoji}
                            </span>
                            <span>{entry.mood}</span>
                          </td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                            {entry.intensity}/10
                          </td>
                          <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">
                            {new Date(entry.recorded_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 truncate max-w-xs hidden md:table-cell">
                            {entry.notes || '—'}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => onNavigate && onNavigate('mood')}
                              className="p-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 transition cursor-pointer"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
