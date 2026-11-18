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
import { ZenStonesIllustration } from '../components/Illustrations';

const STRESS_CATEGORIES = [
  { name: 'Placements and Career', icon: Briefcase, color: 'text-peach-600 bg-peach-50 border-peach-200' },
  { name: 'Academics', icon: GraduationCap, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { name: 'Time Management', icon: Clock, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { name: 'Family', icon: Home, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { name: 'Financial Issues', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { name: 'Relationships', icon: Heart, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { name: 'Social Life', icon: Users, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { name: 'Personal Issues', icon: User, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
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
      setEntries(entryList);
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
    if (val <= 3) return { text: 'Calm & Flowing', color: 'text-mint-700 bg-mint-50 border-mint-200' };
    if (val <= 6) return { text: 'Moderate Academic Tension', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (val <= 8) return { text: 'Heightened Pressure', color: 'text-coral-700 bg-coral-50 border-coral-200' };
    return { text: 'Acute Exhaustion / Overwhelm', color: 'text-rose-800 bg-rose-50 border-rose-200' };
  };

  const descriptor = getTensionDescriptor(level);

  return (
    <div className="space-y-7 animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="rounded-4xl bg-gradient-to-r from-coral-100/90 via-peach-50 to-amber-100/70 border border-coral-200/80 p-6 sm:p-8 shadow-wellness relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-coral-800 bg-coral-100 px-3 py-1 rounded-full border border-coral-200">
                Cognitive Pressure & Load
              </span>
              <span className="text-xs text-charcoal-400 font-medium">Decompression Radar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 tracking-tight">
              Campus Stress Radar
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-xl leading-relaxed">
              Name and demystify study pressure, placement anxiety, and deadlines. Awareness is the first step toward nervous system relief.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenBreathing && (
              <button
                onClick={onOpenBreathing}
                className="px-4 py-2 rounded-2xl bg-white hover:bg-cream-50 text-xs font-bold text-coral-700 transition shadow-wellness-sm border border-coral-200 flex items-center gap-1.5"
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
        <div className="lg:col-span-5 rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 sm:p-7 shadow-wellness space-y-5">
          <div className="flex items-center justify-between border-b border-cream-200/80 pb-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-charcoal-900">
                Check In With Your Body
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Notice physical tightness in shoulders, jaw, or chest.
              </p>
            </div>
            {successBanner && (
              <span className="text-xs font-bold text-mint-800 bg-mint-50 px-3 py-1 rounded-full border border-mint-200 flex items-center gap-1 animate-bounce">
                <Check className="w-3.5 h-3.5 text-mint-600" /> Recorded!
              </span>
            )}
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Visual Tension Meter */}
            <div className="p-4 rounded-3xl bg-cream-50/80 border border-cream-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-charcoal-800">Tension Level</span>
                <span className={`px-2.5 py-0.5 rounded-full border font-extrabold ${descriptor.color}`}>
                  {level} / 10 • {descriptor.text}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-coral-500"
              />
              <div className="flex justify-between text-[10px] text-charcoal-400 font-semibold">
                <span>1 (Serene)</span>
                <span>5 (Manageable)</span>
                <span>10 (Overwhelmed)</span>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-charcoal-800">
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
                      className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition flex items-center gap-2 ${
                        isSelected
                          ? 'bg-coral-500 text-white border-coral-500 shadow-glow-coral'
                          : 'bg-cream-50/70 border-cream-200 text-charcoal-700 hover:bg-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-coral-500'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note & Submit */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-charcoal-800">
                Reflection Note (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="What feels heavy right now? Any deadline or conversation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl bg-cream-50/60 border border-cream-200 text-charcoal-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral-400 resize-none font-sans"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-coral-500 via-rose-500 to-amber-500 hover:from-coral-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-glow-coral transition hover:scale-102 active:scale-98"
              >
                {isSubmitting ? 'Logging...' : 'Record Stress Radar Entry ✨'}
              </button>
            </div>
          </form>
        </div>

        {/* Trajectory Chart & Summary Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Trajectory Chart */}
          <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 shadow-wellness">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-charcoal-900">
                  Stress Variation Curve
                </h3>
                <p className="text-xs text-charcoal-400">14-day tension trajectory</p>
              </div>
              <span className="text-[10px] font-bold text-coral-700 bg-coral-50 px-2.5 py-0.5 rounded-full border border-coral-200">
                Self-Reported Tension
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stressPageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB7185" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FB7185" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE7DC" />
                  <XAxis dataKey="date" tick={{ fill: '#756E96', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#756E96', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2.5 rounded-xl shadow-wellness border border-cream-200 text-xs">
                            <p className="font-bold text-charcoal-900">{label}</p>
                            <p className="text-rose-600 font-bold">
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
                    stroke="#F43F5E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#stressPageGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Somatic Decompression Card */}
          <div className="rounded-4xl bg-gradient-to-r from-mint-50 to-teal-50 border border-mint-200/80 p-5 shadow-wellness flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-mint-500 text-white flex items-center justify-center shrink-0 shadow-glow-mint">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-charcoal-900">
                  Feel High Tension Right Now?
                </h4>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Engage your five senses with our interactive grounding sequence.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('resources')}
              className="px-4 py-2 rounded-xl bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs transition shrink-0"
            >
              Start Grounding →
            </button>
          </div>
        </div>
      </div>

      {/* Stress History Timeline */}
      <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 sm:p-7 shadow-wellness space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200/80 pb-3">
          <h3 className="text-lg font-serif font-bold text-charcoal-900">
            Recorded Stress Logs
          </h3>
          <span className="text-xs font-bold text-coral-700 bg-coral-50 px-2.5 py-1 rounded-full border border-coral-200">
            {entries.length} Logs Saved
          </span>
        </div>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-xs text-charcoal-400 text-center py-10">No stress entries recorded yet.</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-3xl bg-cream-50/70 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:shadow-wellness-sm transition-all"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-coral-100 text-coral-700 flex items-center justify-center font-bold text-sm shrink-0 border border-coral-200">
                    {entry.level}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-charcoal-900">
                        {entry.category}
                      </span>
                      <span className="text-[10px] font-bold text-charcoal-400">
                        Level {entry.level}/10
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-charcoal-600 mt-0.5 italic">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-[10px] text-charcoal-400 font-mono">
                    {new Date(entry.recorded_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-xl text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
