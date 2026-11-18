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
  Layers,
  GraduationCap,
  Scale,
  MoreVertical,
  Activity,
  Share2
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
        colors: ['#0284C7', '#38BDF8', '#F97316'],
      });

      await fetchData();
    } catch (err) {
      console.error('Quick mood error:', err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // Generate chart data points matching the dual-line curve in the reference image
  const daysCount = chartRange === '7' ? 7 : 14;
  const chartData = [];
  const now = new Date();

  const months = ['Jan', 'Febr', 'March', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = chartRange === '7'
      ? d.toLocaleDateString('en-US', { weekday: 'short' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const dayMood = moodHistory.find((m) => m.recorded_at?.startsWith(dateStr));
    const dayStress = stressHistory.find((s) => s.recorded_at?.startsWith(dateStr));

    const moodVal = dayMood ? (dayMood.intensity || 7) * 10 : 75 + Math.sin(i) * 10;
    const stressVal = dayStress ? (10 - dayStress.level) * 10 : 65 + Math.cos(i) * 12;

    chartData.push({
      date: dayLabel,
      rating: Math.round(moodVal),
      balance: Math.round(stressVal),
    });
  }

  // User names & status
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Emily';
  const streakDays = todayStatus?.streak_days || 7;
  const hasCheckedInToday = todayStatus?.has_checked_in;
  const todayData = todayStatus?.today_data;

  const metrics = insightsData?.metrics || {
    current_mood: 'Happy',
    current_mood_intensity: 7,
    today_stress_level: 3,
    last_night_sleep_hours: 7.5,
    energy_level: 6,
    weekly_wellbeing_score: 91,
  };

  // Overall Score Calculation (Like 9.1 in the uploaded design)
  const totalRating = ((metrics.weekly_wellbeing_score || 91) / 10).toFixed(1);
  const ratingCircumference = 2 * Math.PI * 45; // radius 45
  const strokeDashoffset = ratingCircumference - (parseFloat(totalRating) / 10) * ratingCircumference;

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-300">
      {/* =========================================================
          1. GREETING HEADER (Matching User Reference Image)
          ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hello {firstName},
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            We hope you have a wonderful day!
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1 p-1 liquid-glass-apple rounded-2xl shadow-xs">
            <button
              onClick={() => setDashboardMode('curated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                dashboardMode === 'curated'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Curated</span>
            </button>

            <button
              onClick={() => setDashboardMode('detailed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                dashboardMode === 'detailed'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>In-Depth</span>
            </button>
          </div>

          <button
            onClick={onOpenCheckIn}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Check In</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. TOP ROW: TOTAL WELL-BEING RATING & RATING HISTORY
          (Exact Layout from Uploaded Reference Image)
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Total Well-Being Rating Donut Card (4 cols) */}
        <div className="lg:col-span-4 liquid-glass-interactive rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute inset-0 bg-radial from-sky-100/40 dark:from-sky-900/20 via-transparent to-transparent pointer-events-none" />

          {/* Large Radial Progress Gauge */}
          <div className="relative w-44 h-44 flex items-center justify-center mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Track */}
              <circle
                cx="60"
                cy="60"
                r="45"
                className="text-sky-100 dark:text-slate-800"
                strokeWidth="11"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Active Sky Blue Progress Arc */}
              <circle
                cx="60"
                cy="60"
                r="45"
                className="text-sky-500 transition-all duration-1000 ease-out"
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
                {totalRating}
              </span>
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            Total
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            well-being rating
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 text-[11px] font-bold text-sky-700 dark:text-sky-300 shadow-xs">
            <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
            <span>Optimal Baseline (+0.4)</span>
          </div>
        </div>

        {/* Right: Rating History Dual-Line Area Chart (8 cols) */}
        <div className="lg:col-span-8 liquid-glass-interactive rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Card Header matching photo */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Rating history
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                01.01.2024 – 12.31.2024
              </p>
            </div>

            {/* Range Toggle & Legend */}
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
                      : 'text-slate-500'
                  }`}
                >
                  7D
                </button>
                <button
                  onClick={() => setChartRange('14')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    chartRange === '14'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  14D
                </button>
              </div>
            </div>
          </div>

          {/* Smooth Curved Chart matching reference photo */}
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
                      return (
                        <div className="liquid-glass-apple rounded-2xl p-2.5 shadow-lg border border-sky-100 text-xs">
                          <p className="font-bold text-slate-800 dark:text-white mb-1">{label}</p>
                          <p className="text-sky-600 font-semibold">Wellbeing: {payload[0]?.value}%</p>
                          <p className="text-orange-500 font-semibold">Equilibrium: {payload[1]?.value}%</p>
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
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#f97316"
                  strokeWidth={2.2}
                  dot={false}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. MIDDLE ROW: 5 CORE WELLBEING METRIC CARDS
          (Exact 5 Cards as in User's Reference Image)
          ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Social Network / Mood (Light Sky Tint) */}
        <div className="liquid-glass-interactive rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100/80 dark:border-sky-900/50 min-h-[175px]">
          {/* Top Bar with Icon & 3-dots */}
          <div className="flex items-center justify-between z-10">
            <span className="p-1 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <MoreVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
          </div>

          {/* Center Category Icon */}
          <div className="my-1 flex flex-col items-center text-center z-10">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-sky-500 mb-1.5">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Social network
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              8.9
            </span>
          </div>

          {/* Subtle Bottom Wave/Mountain Landscape Vector (like photo) */}
          <CardWaveDecoration color="#38bdf8" opacity={0.3} />
        </div>

        {/* Card 2: Safety / Stress Relief (Warm Sand Tint) */}
        <div className="liquid-glass-interactive rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100/80 dark:border-amber-900/50 min-h-[175px]">
          {/* Top Bar with Icon & 3-dots */}
          <div className="flex items-center justify-between z-10">
            <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <MoreVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
          </div>

          {/* Center Category Icon */}
          <div className="my-1 flex flex-col items-center text-center z-10">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-amber-500 mb-1.5">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Safety
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              7.5
            </span>
          </div>

          {/* Subtle Bottom Wave/Mountain Landscape Vector */}
          <CardWaveDecoration color="#f59e0b" opacity={0.25} />
        </div>

        {/* Card 3: Health / Vital Energy (Soft Mint / Cyan Tint) */}
        <div className="liquid-glass-interactive rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100/80 dark:border-cyan-900/50 min-h-[175px]">
          {/* Top Bar with Icon & 3-dots */}
          <div className="flex items-center justify-between z-10">
            <span className="p-1 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <MoreVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
          </div>

          {/* Center Category Icon */}
          <div className="my-1 flex flex-col items-center text-center z-10">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-cyan-500 mb-1.5">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Health
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              9.9
            </span>
          </div>

          {/* Subtle Bottom Wave/Mountain Landscape Vector */}
          <CardWaveDecoration color="#06b6d4" opacity={0.25} />
        </div>

        {/* Card 4: Education / Sleep (Light Indigo / Pale Blue Tint) */}
        <div className="liquid-glass-interactive rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-900/50 min-h-[175px]">
          {/* Top Bar with Icon & 3-dots */}
          <div className="flex items-center justify-between z-10">
            <span className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <MoreVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
          </div>

          {/* Center Category Icon */}
          <div className="my-1 flex flex-col items-center text-center z-10">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-blue-500 mb-1.5">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Education
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              8.6
            </span>
          </div>

          {/* Subtle Bottom Wave/Mountain Landscape Vector */}
          <CardWaveDecoration color="#3b82f6" opacity={0.25} />
        </div>

        {/* Card 5: School-life balance (Soft Lavender Tint) */}
        <div className="col-span-2 sm:col-span-1 liquid-glass-interactive rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100/80 dark:border-purple-900/50 min-h-[175px]">
          {/* Top Bar with Icon & 3-dots */}
          <div className="flex items-center justify-between z-10">
            <span className="p-1 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400">
              <Scale className="w-3.5 h-3.5" />
            </span>
            <MoreVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
          </div>

          {/* Center Category Icon */}
          <div className="my-1 flex flex-col items-center text-center z-10">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-purple-500 mb-1.5">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              School-life balance
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              9.2
            </span>
          </div>

          {/* Subtle Bottom Wave/Mountain Landscape Vector */}
          <CardWaveDecoration color="#8b5cf6" opacity={0.25} />
        </div>
      </div>

      {/* =========================================================
          4. BOTTOM SECTION: UPCOMING ACTIVITIES (like reference image)
          ========================================================= */}
      <div className="liquid-glass-apple rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Upcoming activities
          </h3>
          <button
            onClick={() => onNavigate && onNavigate('resources')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition"
          >
            Show all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                <th className="pb-2 font-medium">Activity name</th>
                <th className="pb-2 font-medium hidden sm:table-cell">Survey name</th>
                <th className="pb-2 font-medium hidden md:table-cell">Metrics</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Available</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr className="hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition">
                <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    📝
                  </span>
                  <span>Education evaluation</span>
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">Learning opportunities</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden md:table-cell">Education, School-life balance</td>
                <td className="py-3 pr-4">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    Mandatory
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">10. March - 20. March</td>
                <td className="py-3 text-right">
                  <button
                    onClick={onOpenCheckIn}
                    className="p-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition">
                <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                    🌬️
                  </span>
                  <span>Box Breathing Micro-Action</span>
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">Somatic Stress Relief</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden md:table-cell">Heart Rate, Focus</td>
                <td className="py-3 pr-4">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800/80 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                    Recommended
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">Today, 5:00 PM</td>
                <td className="py-3 text-right">
                  <button
                    onClick={onOpenBreathing}
                    className="p-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 transition"
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
                  <span>Placement & Career Check-in</span>
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">Career Confidence Survey</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden md:table-cell">Stress Radar & Stamina</td>
                <td className="py-3 pr-4">
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                    Self-Paced
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">Always available</td>
                <td className="py-3 text-right">
                  <button
                    onClick={onOpenGrounding}
                    className="p-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          5. BOTTOM SECTION: PAST RESULTS (like reference image)
          ========================================================= */}
      <div className="liquid-glass-apple rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Past results
          </h3>
          <button
            onClick={() => onNavigate && onNavigate('insights')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition"
          >
            Show all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                <th className="pb-2 font-medium">Activity name</th>
                <th className="pb-2 font-medium hidden sm:table-cell">Survey name</th>
                <th className="pb-2 font-medium">Your results</th>
                <th className="pb-2 font-medium">Evaluation date</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr className="hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition">
                <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-sm">
                    🧸
                  </span>
                  <span>Autumn well-being evaluation</span>
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">General survey</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5 text-base">
                    <span>🙂</span>
                    <span>😊</span>
                    <span>😌</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">09.23.2024</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => onNavigate && onNavigate('insights')}
                    className="p-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition">
                <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center text-sm">
                    🌟
                  </span>
                  <span>Semester stress & exams check-in</span>
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">Special well-being survey</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5 text-base">
                    <span>😊</span>
                    <span>😌</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">09.21.2024</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => onNavigate && onNavigate('insights')}
                    className="p-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
