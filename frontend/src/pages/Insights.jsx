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
  BarChart2,
  Lock
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
} from 'recharts';
import { api } from '../api/client';

const TEAL_SHADES = ['#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'];
const PEACH_SHADES = ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'];

export default function Insights({ onNavigate, onOpenBreathing, onOpenCheckIn }) {
  const [data, setData] = useState(null);
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

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs space-y-2">
        <Sparkles className="w-8 h-8 text-teal-500 mx-auto animate-spin" />
        <p>Synthesizing your mindful rhythms and patterns...</p>
      </div>
    );
  }

  const metrics = data?.metrics;
  const insights = data?.insights || [];
  const mood_distribution = data?.mood_distribution || {};
  const stress_categories = data?.stress_categories || {};
  const sleep_analysis = data?.sleep_analysis || {};
  const correlation_notes = data?.correlation_notes || [];

  const hasData = Boolean(metrics?.has_data && (metrics.total_checkins_this_month > 0 || metrics.weekly_wellbeing_score != null));

  // Format mood distribution data for chart
  const moodChartData = Object.entries(mood_distribution).map(([name, count]) => ({
    name,
    count,
  }));

  // Format stress categories for chart
  const stressChartData = Object.entries(stress_categories).map(([category, count]) => ({
    category: category.length > 14 ? category.slice(0, 14) + '...' : category,
    count,
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-300">
      {/* 1. Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-50/80 via-sky-50/70 to-purple-50/80 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-teal-950/40 border border-teal-100/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                Observational Intelligence
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Evidence-Guided Habit Science</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Personal Wellbeing Insights & Trends
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
              Understand self-reported co-occurrences between your sleep schedules, study tension, and daytime emotional energy.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenBreathing && (
              <button
                onClick={onOpenBreathing}
                className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-teal-700 dark:text-teal-300 transition shadow-xs border border-teal-200/80 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Wind className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>2-Min Breath</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EMPTY STATE: If no check-ins logged yet */}
      {!hasData ? (
        <div className="rounded-3xl p-10 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center border border-teal-200 dark:border-teal-800">
            <BarChart2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Check-In Logs Recorded Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Once you complete your daily check-ins, MindBridge’s observational intelligence engine will compute your genuine wellbeing score, 30-day emotion distributions, stress factor breakdown, and rest-energy correlations.
            </p>
          </div>
          <button
            onClick={onOpenCheckIn}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Complete Your First Check-In</span>
          </button>
        </div>
      ) : (
        <>
          {/* 2. Four Key Scorecards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Wellbeing Score */}
            <div className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Wellbeing Score</span>
                </span>
                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {metrics.weekly_wellbeing_score >= 70 ? 'Optimal' : 'Active Growth'}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1">
                <span>{metrics.weekly_wellbeing_score != null ? `${metrics.weekly_wellbeing_score}%` : '—'}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Multi-factor composite</p>
            </div>

            {/* Energy Level */}
            <div className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Battery className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Daytime Energy</span>
                </span>
                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  Daily Pulse
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1">
                <span>{metrics.energy_level != null ? metrics.energy_level : '—'}</span>
                {metrics.energy_level != null && <span className="text-xs font-normal text-slate-400">/ 10</span>}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {metrics.energy_level >= 7 ? 'High vitality' : 'Functional stamina'}
              </p>
            </div>

            {/* Perceived Stress */}
            <div className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span>Average Stress</span>
                </span>
                <span className="text-[10px] text-orange-700 dark:text-orange-300 font-bold bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                  {metrics.today_stress_level <= 4 ? 'Manageable' : 'Elevated'}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1">
                <span>{metrics.today_stress_level != null ? `${metrics.today_stress_level}/10` : '—'}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Academic baseline</p>
            </div>

            {/* Rest Consistency */}
            <div className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-sky-500" />
                  <span>Sleep Schedule</span>
                </span>
                <span className="text-[10px] text-sky-700 dark:text-sky-300 font-bold bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                  Logged
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1">
                <span>{metrics.last_night_sleep_hours != null ? `${metrics.last_night_sleep_hours}h` : '—'}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {metrics.sleep_consistency_score != null ? `Consistency: ${metrics.sleep_consistency_score}%` : 'Consistent rest'}
              </p>
            </div>
          </div>

          {/* 3. Breakdown Charts: Mood Distribution & Stress Domains */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Mood Distribution */}
            <div className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smile className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>30-Day Emotion Distribution</span>
                </h3>
                <span className="text-xs text-slate-400">{metrics.total_checkins_this_month} check-ins</span>
              </div>

              {moodChartData.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">No mood records in the past 30 days.</p>
              ) : (
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moodChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          color: '#fff',
                          borderRadius: '1rem',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
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
              )}
            </div>

            {/* Stress Domains Breakdown */}
            <div className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span>Primary Stress Domains</span>
                </h3>
                <span className="text-[10px] text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                  Student Factors
                </span>
              </div>

              {stressChartData.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">No stress records in the past 30 days.</p>
              ) : (
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stressChartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" horizontal={false} />
                      <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={10} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          color: '#fff',
                          borderRadius: '1rem',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
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
              )}
            </div>
          </div>

          {/* 4. Automated Observation Cards (Only when real insights exist) */}
          {insights.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Observed Personal Patterns</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((ins) => (
                  <div
                    key={ins.id}
                    className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                          {ins.category} pattern
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{ins.observed_metric}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ins.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ins.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Self-reported log correlation</span>
                      <button
                        onClick={() => onNavigate && onNavigate('resources')}
                        className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Explore tools</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Non-Clinical Disclaimer */}
      <div className="p-4 rounded-3xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 text-xs text-teal-950 dark:text-teal-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Important Ethical Note:</strong> MindBridge Campus is a student wellbeing support platform. Insights describe observational patterns in your private logs and do not represent clinical diagnoses. For professional support, consult our verified campus counsellor Dr. Nitu Singh Bhadouria in SAC I, First Floor, or call Tele-MANAS at <strong>14416</strong>.
        </p>
      </div>
    </div>
  );
}
