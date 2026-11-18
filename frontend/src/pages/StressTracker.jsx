import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  Trash2,
  TrendingUp,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Heart,
  Home,
  CreditCard,
  Users,
  User,
  Compass,
  Wind,
  Check,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../api/client';

const STRESS_CATEGORIES = [
  { name: 'Placements and Career', icon: Briefcase, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' },
  { name: 'Academics', icon: GraduationCap, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' },
  { name: 'Time Management', icon: Clock, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
  { name: 'Family', icon: Home, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  { name: 'Financial Issues', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  { name: 'Relationships', icon: Heart, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
  { name: 'Social Life', icon: Users, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800' },
  { name: 'Personal Issues', icon: User, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
];

export default function StressTracker({ onNavigate, onOpenBreathing }) {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [level, setLevel] = useState(4);
  const [category, setCategory] = useState('Academics');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entryList, sum] = await Promise.all([
        api.getStressEntries(30),
        api.getStressSummary(),
      ]);
      setEntries(entryList || []);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load stress data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createStress({
        level: Number(level),
        category,
        notes: notes || undefined,
      });

      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#FB7185', '#F59E0B', '#34D399'],
      });

      setNotes('');
      setSuccessBanner(true);
      fetchData();
      setTimeout(() => setSuccessBanner(false), 3000);
    } catch (err) {
      alert('Error recording stress: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this entry?')) {
      try {
        await api.deleteStress(id);
        fetchData();
      } catch (err) {
        console.error('Failed to delete stress entry:', err);
      }
    }
  };

  const chartData = [...entries]
    .reverse()
    .slice(-14)
    .map((e) => ({
      date: new Date(e.recorded_at).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      }),
      level: e.level,
      category: e.category,
    }));

  const getTensionDescriptor = (val) => {
    if (val <= 3) return { text: 'Calm & Flowing', color: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800' };
    if (val <= 6) return { text: 'Moderate Study Tension', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' };
    if (val <= 8) return { text: 'Heightened Pressure', color: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800' };
    return { text: 'Acute Overwhelm', color: 'text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' };
  };

  const descriptor = getTensionDescriptor(level);

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-orange-950/40 border border-orange-100/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                Cognitive Pressure & Load
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Decompression Radar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Campus Stress Radar
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
              Name and demystify study pressure, placement anxiety, and deadlines. Awareness is the first step toward nervous system relief.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenBreathing && (
              <button
                onClick={onOpenBreathing}
                className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-orange-700 dark:text-orange-300 transition shadow-xs border border-orange-200/80 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Somatic Breath</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Logging Form (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Check In With Your Body
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Notice physical tightness in shoulders, jaw, or chest.
              </p>
            </div>
            {successBanner && (
              <span className="text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1 animate-bounce">
                <Check className="w-3.5 h-3.5 text-teal-600" /> Recorded!
              </span>
            )}
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Visual Tension Meter */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200">Tension Level</span>
                <span className={`px-2.5 py-0.5 rounded-full border font-bold text-[11px] ${descriptor.color}`}>
                  {level} / 10 • {descriptor.text}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                <span>1 (Serene)</span>
                <span>5 (Manageable)</span>
                <span>10 (Overwhelmed)</span>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Primary Source of Tension
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STRESS_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 dark:border-orange-400 bg-orange-50/80 dark:bg-orange-950/50 ring-2 ring-orange-400/50 font-bold'
                          : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-orange-500" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Context & Triggers (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="Specific exams, shortlists, assignments causing pressure..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Log Stress Check-In ✨'}
            </button>
          </form>
        </div>

        {/* Analytics & History (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Trend Chart */}
          <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                14-Day Stress Trajectory
              </h3>
              <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                Recent 14 Logs
              </span>
            </div>

            {chartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">
                No stress entries recorded yet. Log your first check-in on the left.
              </p>
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                    <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 text-xs">
                              <p className="font-bold text-slate-900 dark:text-white">{label}</p>
                              <p className="text-orange-600 dark:text-orange-400 font-bold">
                                Stress: {payload[0]?.value}/10 ({payload[0]?.payload?.category})
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="level"
                      stroke="#F97316"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#stressGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* History Feed */}
          <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Recent Tension Logs
            </h3>
            {entries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No stress records found.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {entries.slice(0, 6).map((e) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">{e.category}</div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(e.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {e.notes ? ` • "${e.notes}"` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold text-[10px]">
                        {e.level}/10
                      </span>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
