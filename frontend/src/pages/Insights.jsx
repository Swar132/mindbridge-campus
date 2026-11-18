import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sparkles,
  Heart,
  Moon,
  Zap,
  Smile,
  Battery,
  ShieldCheck,
  Info,
  Wind,
  CheckCircle2,
  Award,
  ArrowRight,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { api } from '../api/client';
import { MindyCharacter } from '../components/Illustrations';

const TEAL_SHADES = ['#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'];
const PEACH_SHADES = ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'];

export default function Insights({ onNavigate, onOpenBreathing }) {
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // '7', '14', '30'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      try {
        setLoading(true);
        const res = await api.getPersonalInsights();
        setData(res);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 text-center text-charcoal-400 text-xs space-y-2">
        <Sparkles className="w-8 h-8 text-teal-500 mx-auto animate-spin" />
        <p>Synthesizing your mindful rhythms and patterns...</p>
      </div>
    );
  }

  const { metrics, insights, mood_distribution, stress_categories, sleep_analysis, correlation_notes } = data;

  // Format mood distribution data for chart
  const moodChartData = Object.entries(mood_distribution || {}).map(([name, count]) => ({
    name,
    count,
  }));

  // Format stress categories for chart
  const stressChartData = Object.entries(stress_categories || {}).map(([category, count]) => ({
    category: category.length > 14 ? category.slice(0, 14) + '...' : category,
    count,
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="liquid-glass rounded-4xl p-6 sm:p-8 border border-white/90 shadow-wellness relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Observational Intelligence
              </span>
              <span className="text-xs text-charcoal-400 font-medium">Evidence-Guided Habit Science</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
              Personal Wellbeing Insights & Trends
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-xl leading-relaxed">
              Understand self-reported co-occurrences between your sleep schedules, study tension, and daytime emotional energy.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenBreathing && (
              <button
                onClick={onOpenBreathing}
                className="px-4 py-2 rounded-2xl bg-white hover:bg-cream-50 text-xs font-bold text-teal-700 transition shadow-wellness-sm border border-teal-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Wind className="w-3.5 h-3.5 text-teal-600" />
                <span>2-Min Breath</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Four Key Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wellbeing Score */}
        <div className="liquid-glass-interactive rounded-3xl p-5 border border-white/90 shadow-wellness">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-charcoal-600 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-teal-600 fill-teal-100" />
              <span>Wellbeing Score</span>
            </span>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Balanced
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal-900 flex items-baseline gap-1">
            <span>{metrics.weekly_wellbeing_score}%</span>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">Multi-factor composite</p>
        </div>

        {/* Energy Level (Survey finding 54.3%) */}
        <div className="liquid-glass-interactive rounded-3xl p-5 border border-white/90 shadow-wellness">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-charcoal-600 flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-teal-600" />
              <span>Daytime Energy</span>
            </span>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Daily Pulse
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal-900 flex items-baseline gap-1">
            <span>{metrics.energy_level || 6}</span>
            <span className="text-xs font-normal text-charcoal-400">/ 10</span>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">
            {(metrics.energy_level || 6) >= 7 ? 'High vitality' : 'Functional'}
          </p>
        </div>

        {/* Perceived Stress */}
        <div className="liquid-glass-interactive rounded-3xl p-5 border border-white/90 shadow-wellness">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-charcoal-600 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-peach-600" />
              <span>Average Stress</span>
            </span>
            <span className="text-[10px] text-peach-700 font-bold bg-peach-50 px-2 py-0.5 rounded-full border border-peach-200">
              Stable
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal-900 flex items-baseline gap-1">
            <span>{metrics.today_stress_level}/10</span>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">Controlled study pace</p>
        </div>

        {/* Rest Consistency */}
        <div className="liquid-glass-interactive rounded-3xl p-5 border border-white/90 shadow-wellness">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-charcoal-600 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-sky-600" />
              <span>Sleep Schedule</span>
            </span>
            <span className="text-[10px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              Regular
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal-900 flex items-baseline gap-1">
            <span>{metrics.last_night_sleep_hours}h</span>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">Consistency: {metrics.sleep_consistency_score}%</p>
        </div>
      </div>

      {/* 3. Breakdown Charts: Mood Distribution & Stress Domains */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Mood Distribution */}
        <div className="liquid-glass rounded-3xl p-5 border border-white/90 shadow-wellness space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Smile className="w-4 h-4 text-teal-600" />
              <span>30-Day Emotion Distribution</span>
            </h3>
            <span className="text-xs text-charcoal-400">{metrics.total_checkins_this_month} check-ins</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '1rem',
                    border: '1px solid #E2E8F0',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {moodChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TEAL_SHADES[index % TEAL_SHADES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stress Domains Breakdown (Survey #1 Stressors) */}
        <div className="liquid-glass rounded-3xl p-5 border border-white/90 shadow-wellness space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-peach-600" />
              <span>Primary Stress Domains</span>
            </h3>
            <span className="text-[10px] text-peach-700 bg-peach-50 px-2 py-0.5 rounded-full border border-peach-200">
              Survey Aligned
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stressChartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#64748B" fontSize={10} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '1rem',
                    border: '1px solid #E2E8F0',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {stressChartData.map((entry, index) => (
                    <Cell key={`stress-cell-${index}`} fill={PEACH_SHADES[index % PEACH_SHADES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Automated Observation Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Observed Correlation Patterns</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className="liquid-glass rounded-3xl p-5 border border-white/90 shadow-wellness space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    {ins.category} pattern
                  </span>
                  <span className="text-[10px] text-charcoal-400 font-medium">{ins.observed_metric}</span>
                </div>
                <h4 className="text-sm font-bold text-charcoal-900">{ins.title}</h4>
                <p className="text-xs text-charcoal-600 leading-relaxed">{ins.description}</p>
              </div>

              <div className="pt-2 border-t border-cream-200/80 flex items-center justify-between text-[11px] text-charcoal-500">
                <span>Self-reported log correlation</span>
                <button
                  onClick={() => onNavigate('resources')}
                  className="text-teal-700 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Explore tools</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Non-Clinical Disclaimer */}
      <div className="p-4 rounded-3xl bg-teal-50/80 border border-teal-200/80 text-xs text-teal-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Important Ethical Note:</strong> MindBridge Campus is a student wellbeing support platform. Insights describe statistical co-occurrences in your private logs and do not represent clinical diagnoses. For professional support, consult our verified campus counsellors or call Tele-MANAS at <strong>14416</strong>.
        </p>
      </div>
    </div>
  );
}
