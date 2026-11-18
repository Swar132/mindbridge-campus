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
  SlidersHorizontal,
  LayoutGrid,
  Minimize2,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  NightSkyIllustration,
  ZenStonesIllustration,
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
  const [dashboardMode, setDashboardMode] = useState('curated'); // 'curated', 'essential', 'detailed'
  const [chartRange, setChartRange] = useState('7'); // '7' or '14'
  const [loading, setLoading] = useState(true);

  // Quick 1-tap mood selection on dashboard
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
      setMoodHistory(moods);
      setStressHistory(stress);
      setSleepHistory(sleep);
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
        mood_intensity: 7,
        energy_level: 6,
        stress_level: 3,
        stress_category: 'Academics & Exams',
        sleep_hours: 7.5,
        tags: ['Quick Check-in'],
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0D9488', '#FB923C', '#38BDF8'],
      });

      await fetchData();
    } catch (err) {
      console.error('Quick mood error:', err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // Format 7-day / 14-day timeline data for chart
  const daysCount = chartRange === '7' ? 7 : 14;
  const chartData = [];
  const now = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

    // Find entries for this date
    const dayMood = moodHistory.find((m) => m.recorded_at?.startsWith(dateStr));
    const dayStress = stressHistory.find((s) => s.recorded_at?.startsWith(dateStr));
    const daySleep = sleepHistory.find((sl) => sl.sleep_date === dateStr || sl.recorded_at?.startsWith(dateStr));

    const moodVal = dayMood ? (dayMood.intensity || 7) : 6.5;
    const stressVal = dayStress ? dayStress.level : 3.5;
    const energyVal = dayMood ? (dayMood.energy_level || 6) : 6;
    const sleepVal = daySleep ? daySleep.duration_hours : 7.2;

    chartData.push({
      date: dayLabel,
      mood: moodVal,
      stress: stressVal,
      energy: energyVal,
      sleep: sleepVal,
    });
  }

  // Greeting helper
  const hour = now.getHours();
  const greetingTime = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Student';
  const streakDays = todayStatus?.streak_days || 7;
  const hasCheckedInToday = todayStatus?.has_checked_in;
  const todayData = todayStatus?.today_data;

  const metrics = insightsData?.metrics || {
    current_mood: 'Happy',
    current_mood_intensity: 7,
    today_stress_level: 3,
    last_night_sleep_hours: 7.5,
    energy_level: 6,
    weekly_wellbeing_score: 78,
  };

  const primaryInsight = insightsData?.insights?.[0] || {
    title: 'Balanced Wellbeing Baseline',
    description: 'Your emotional state and rest schedules are in healthy alignment this week. Maintain your steady study pacing.',
    category: 'mood',
    observed_metric: 'Stable equilibrium'
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Banner & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              🌿 MindBridge Campus Sanctuary
            </span>
            <span className="text-[11px] font-bold text-peach-700 bg-peach-50 px-2.5 py-0.5 rounded-full border border-peach-200 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-peach-500 fill-peach-400" />
              <span>{streakDays} Day Streak</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            {greetingTime}, {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
            Take a moment for yourself. Here is your student wellbeing pulse today.
          </p>
        </div>

        {/* Dashboard View Mode Switcher (Directly addressing 38.7% student preference) */}
        <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 shadow-wellness-sm self-start md:self-auto">
          <button
            onClick={() => setDashboardMode('curated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              dashboardMode === 'curated'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Curated</span>
          </button>

          <button
            onClick={() => setDashboardMode('essential')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              dashboardMode === 'essential'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Essential</span>
          </button>

          <button
            onClick={() => setDashboardMode('detailed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              dashboardMode === 'detailed'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>In-Depth</span>
          </button>
        </div>
      </div>

      {/* 2. Today's Check-in Status Card (Phase 5 & 6) */}
      <div className="liquid-glass rounded-3xl p-5 border border-teal-200/90 shadow-wellness relative overflow-hidden">
        {/* Soft decorative accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-200/30 to-peach-200/20 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5">
              <MindyCharacter variant={hasCheckedInToday ? 'happy' : 'waving'} className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    hasCheckedInToday
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : 'bg-peach-50 text-peach-800 border-peach-200 animate-pulse'
                  }`}
                >
                  {hasCheckedInToday ? '✓ Check-in Complete Today' : '⚡ 60-Second Check-in Pending'}
                </span>
                <span className="text-xs text-charcoal-400">•</span>
                <span className="text-xs text-charcoal-500 font-medium">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 leading-tight">
                {hasCheckedInToday
                  ? `You're all checked in today, ${firstName}! Well done.`
                  : `How is your emotional battery and workload today?`}
              </h2>

              <p className="text-xs text-charcoal-600 max-w-xl leading-relaxed">
                {hasCheckedInToday
                  ? `Recorded: ${todayData?.mood || metrics.current_mood} • Energy ${todayData?.energy_level || metrics.energy_level}/10 • Stress ${todayData?.stress_level || metrics.today_stress_level}/10 • Sleep ${todayData?.sleep_hours || metrics.last_night_sleep_hours}h.`
                  : `Quick self-awareness check takes under 1 minute. It updates your weekly analytics and powers personalized coping advice.`}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenCheckIn}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs sm:text-sm font-bold shadow-glow-teal transition duration-200 flex items-center gap-2 hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{hasCheckedInToday ? 'Edit Today’s Check-in' : 'Start 1-Min Check-in'}</span>
            </button>
          </div>
        </div>

        {/* Quick Mood Selection Strip (If not yet checked in) */}
        {!hasCheckedInToday && (
          <div className="mt-4 pt-4 border-t border-cream-200/80">
            <span className="text-[11px] font-bold text-charcoal-600 uppercase tracking-wider block mb-2">
              Or tap your primary feeling right now:
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {Object.entries(MOOD_VISUALS).map(([moodKey, data]) => (
                <button
                  key={moodKey}
                  disabled={isSubmittingQuick}
                  onClick={() => handleQuickMoodClick(moodKey)}
                  className={`p-2 rounded-2xl border transition-all text-center flex flex-col items-center justify-center ${
                    quickMood === moodKey
                      ? 'bg-teal-100 border-teal-300 ring-2 ring-teal-500 scale-105'
                      : 'bg-white/80 border-cream-200 hover:bg-white hover:scale-102 shadow-wellness-sm text-charcoal-700'
                  }`}
                >
                  <span className="text-xl">{data.emoji}</span>
                  <span className="text-[10px] font-bold mt-1 truncate max-w-full">{moodKey}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Core 4 Wellbeing Metric Dials (Liquid Glass Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mood Dial */}
        <div
          onClick={() => onNavigate('mood')}
          className="liquid-glass-interactive rounded-3xl p-4 sm:p-5 border border-white/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-charcoal-600 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-teal-600" />
              <span>Mood Status</span>
            </span>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">
              {MOOD_VISUALS[metrics.current_mood]?.emoji || '😊'}
            </span>
            <div>
              <div className="text-base sm:text-lg font-bold text-charcoal-900 group-hover:text-teal-700 transition">
                {metrics.current_mood || 'Happy'}
              </div>
              <p className="text-[11px] text-charcoal-500 font-medium">
                Intensity: {metrics.current_mood_intensity || 7}/10
              </p>
            </div>
          </div>
        </div>

        {/* Energy Level Dial (Addressing Survey Finding: 65.3% tired often/daily) */}
        <div
          onClick={() => onNavigate('insights')}
          className="liquid-glass-interactive rounded-3xl p-4 sm:p-5 border border-white/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-charcoal-600 flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-teal-600" />
              <span>Energy Level</span>
            </span>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Survey #1
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-bold text-charcoal-900 group-hover:text-teal-700 transition flex items-baseline gap-1">
              <span>{metrics.energy_level || 6}</span>
              <span className="text-xs font-normal text-charcoal-400">/ 10</span>
            </div>
            <div className="w-full bg-cream-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(metrics.energy_level || 6) * 10}%` }}
              />
            </div>
            <p className="text-[11px] text-charcoal-500 mt-1.5 truncate">
              {(metrics.energy_level || 6) >= 7 ? 'High vitality' : (metrics.energy_level || 6) >= 5 ? 'Steady stamina' : 'Needs rest'}
            </p>
          </div>
        </div>

        {/* Stress Radar Dial (Addressing Career 76% & Exam 63.7% Stressors) */}
        <div
          onClick={() => onNavigate('stress')}
          className="liquid-glass-interactive rounded-3xl p-4 sm:p-5 border border-white/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-charcoal-600 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-peach-600" />
              <span>Stress Radar</span>
            </span>
            <span className="text-[10px] text-peach-700 font-bold bg-peach-50 px-2 py-0.5 rounded-full border border-peach-200">
              Manageable
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-bold text-charcoal-900 group-hover:text-peach-700 transition flex items-baseline gap-1">
              <span>{metrics.today_stress_level || 3}</span>
              <span className="text-xs font-normal text-charcoal-400">/ 10</span>
            </div>
            <div className="w-full bg-cream-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-peach-400 to-coral-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(metrics.today_stress_level || 3) * 10}%` }}
              />
            </div>
            <p className="text-[11px] text-charcoal-500 mt-1.5 truncate">
              Domain: {todayData?.stress_category || 'Career & Placements'}
            </p>
          </div>
        </div>

        {/* Sleep Sanctuary Dial */}
        <div
          onClick={() => onNavigate('sleep')}
          className="liquid-glass-interactive rounded-3xl p-4 sm:p-5 border border-white/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-charcoal-600 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-sky-600" />
              <span>Sleep Sanctuary</span>
            </span>
            <span className="text-[10px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              Restful
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-bold text-charcoal-900 group-hover:text-sky-700 transition flex items-baseline gap-1">
              <span>{metrics.last_night_sleep_hours || 7.5}</span>
              <span className="text-xs font-normal text-charcoal-400">hours</span>
            </div>
            <div className="w-full bg-cream-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((metrics.last_night_sleep_hours || 7.5) / 8) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-charcoal-500 mt-1.5 truncate">
              Target: 7.5h ({(metrics.last_night_sleep_hours || 7.5) >= 7 ? 'Optimal' : 'Short'})
            </p>
          </div>
        </div>
      </div>

      {/* 4. Weekly Trend Chart & Mindy Insight Bento (Shown in Curated & Detailed Modes) */}
      {dashboardMode !== 'essential' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Chart Container (2 cols) */}
          <div className="lg:col-span-2 liquid-glass rounded-3xl p-5 border border-white/90 shadow-wellness space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span>Wellbeing Trajectory & Energy Patterns</span>
                </h3>
                <p className="text-xs text-charcoal-500">
                  Tracking Mood (Teal) vs. Perceived Stress (Peach) over time
                </p>
              </div>

              <div className="flex items-center gap-1 bg-white/70 p-0.5 rounded-xl border border-cream-200 text-xs font-semibold">
                <button
                  onClick={() => setChartRange('7')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    chartRange === '7' ? 'bg-teal-600 text-white font-bold' : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setChartRange('14')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    chartRange === '14' ? 'bg-teal-600 text-white font-bold' : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  14 Days
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="peachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB923C" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#FB923C" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis domain={[1, 10]} stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '1rem',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    name="Mood Valence"
                    stroke="#0D9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#tealGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="stress"
                    name="Stress Level"
                    stroke="#FB923C"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#peachGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-cream-200/80 text-charcoal-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Mood Valence (1-10)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-peach-500"></span> Perceived Stress (1-10)
              </span>
              <button
                onClick={() => onNavigate('insights')}
                className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 transition"
              >
                <span>Full Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mindy AI Pattern Insight Card (1 col) */}
          <div className="liquid-glass rounded-3xl p-5 border border-white/90 shadow-wellness flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                    Mindy AI Insight
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Consented Log
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-1.5">
                <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>{primaryInsight.title}</span>
                </h4>
                <p className="text-xs text-teal-900/80 leading-relaxed">
                  {primaryInsight.description}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-charcoal-600">
                <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">
                  Campus Evidence Note:
                </p>
                <p className="text-xs text-charcoal-700 leading-tight">
                  Over 76% of campus respondents experience placement and career anxiety. You are not running behind.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('ai')}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-bold shadow-wellness-sm transition flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Talk to Mindy (Text or Voice)</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Evidence-Driven Coping Recommendations (Survey Phase 11 & 12) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-peach-500 fill-peach-400" />
            <span>Recommended Campus Support & Coping Tools</span>
          </h3>
          <button
            onClick={() => onNavigate('resources')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 transition flex items-center gap-1"
          >
            <span>Browse Library</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 4-7-8 Somatic Breathing */}
          <div
            onClick={onOpenBreathing}
            className="liquid-glass-interactive rounded-2xl p-4 border border-white/90 cursor-pointer space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 group-hover:scale-110 transition">
              <Wind className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-charcoal-900 leading-tight">4-7-8 Somatic Breathing</h4>
            <p className="text-[11px] text-charcoal-500 leading-tight">
              3-minute vagus nerve pacer to settle exam tension.
            </p>
          </div>

          {/* 5-4-3-2-1 Sensory Grounding */}
          <div
            onClick={onOpenGrounding}
            className="liquid-glass-interactive rounded-2xl p-4 border border-white/90 cursor-pointer space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-peach-50 text-peach-700 flex items-center justify-center border border-peach-200 group-hover:scale-110 transition">
              <Compass className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-charcoal-900 leading-tight">5-4-3-2-1 Grounding</h4>
            <p className="text-[11px] text-charcoal-500 leading-tight">
              Rapid sensory anchor when thoughts spiral out of control.
            </p>
          </div>

          {/* Career & Placement Decompression */}
          <div
            onClick={() => onNavigate('resources')}
            className="liquid-glass-interactive rounded-2xl p-4 border border-white/90 cursor-pointer space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200 group-hover:scale-110 transition">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-charcoal-900 leading-tight">Placement Anxiety Kit</h4>
            <p className="text-[11px] text-charcoal-500 leading-tight">
              Manage interview imposter syndrome and peer comparison.
            </p>
          </div>

          {/* Private Voice / Text Journal */}
          <div
            onClick={() => onNavigate('journal')}
            className="liquid-glass-interactive rounded-2xl p-4 border border-white/90 cursor-pointer space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200 group-hover:scale-110 transition">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-charcoal-900 leading-tight">Private Reflection Journal</h4>
            <p className="text-[11px] text-charcoal-500 leading-tight">
              Write or speak your reflections in your encrypted sanctuary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
