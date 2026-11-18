import React, { useState, useEffect } from 'react';
import {
  Smile,
  Calendar,
  Clock,
  Trash2,
  TrendingUp,
  PieChart as PieIcon,
  Check,
  Sparkles,
  Plus,
  Flame,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { MOOD_VISUALS } from '../components/Illustrations';

const SUGGESTED_TAGS = [
  'Academics',
  'Exams',
  'Placements',
  'Hostel Life',
  'Friends',
  'Family',
  'Sleep',
  'Self-Care',
  'Fitness',
  'Coding & Labs'
];

export default function MoodTracker({ onNavigate, onOpenBreathing }) {
  const [entries, setEntries] = useState([]);
  const [filterDays, setFilterDays] = useState(30);
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [intensity, setIntensity] = useState(7);
  const [selectedTags, setSelectedTags] = useState(['Academics']);
  const [notes, setNotes] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await api.getMoods(filterDays);
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to load mood entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filterDays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.createMood({
        mood: selectedMood,
        intensity,
        tags: selectedTags,
        notes,
      });

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#A78BFA', '#34D399', '#38BDF8'],
      });

      setNotes('');
      setSuccessBanner(true);
      fetchEntries();
      setTimeout(() => setSuccessBanner(false), 3000);
    } catch (err) {
      console.error('Failed to create mood entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this entry?')) {
      try {
        await api.deleteMood(id);
        setEntries(entries.filter((e) => e.id !== id));
      } catch (err) {
        console.error('Failed to delete mood entry:', err);
      }
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const moodCounts = {};
  entries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  const pieData = Object.entries(moodCounts).map(([name, value]) => {
    const visual = MOOD_VISUALS[name] || { accentColor: '#0EA5E9' };
    return { name, value, color: visual.accentColor };
  });

  const chartData = [...entries]
    .reverse()
    .slice(-14)
    .map((e) => ({
      date: new Date(e.recorded_at).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      }),
      intensity: e.intensity,
      mood: e.mood,
    }));

  const activeVisual = MOOD_VISUALS[selectedMood] || MOOD_VISUALS['Happy'];

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-sky-50 via-purple-50 to-teal-50 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-sky-950/40 border border-sky-100/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                Emotional Self-Awareness
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Reflection Log</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Expressive Mood Sanctuary
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
              Track how your feelings shift across exam weeks, project sprints, and campus weekends. Cultivate mindful self-compassion.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigate && onNavigate('insights')}
              className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition shadow-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>View Insights</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Logging Form + Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mood Form (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                How does your emotional weather feel today?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pick the mood that resonates most right now.
              </p>
            </div>
            {successBanner && (
              <span className="text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1 animate-bounce">
                <Check className="w-3.5 h-3.5 text-teal-600" /> Logged!
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Expressive Emojis Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.keys(MOOD_VISUALS).map((key) => {
                const visual = MOOD_VISUALS[key];
                const isSelected = selectedMood === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedMood(key);
                      if (key === 'Very Happy') setIntensity(9);
                      else if (key === 'Happy') setIntensity(7);
                      else if (key === 'Neutral') setIntensity(5);
                      else if (key === 'Sad') setIntensity(4);
                      else if (key === 'Anxious') setIntensity(6);
                      else if (key === 'Stressed') setIntensity(8);
                      else if (key === 'Exhausted') setIntensity(3);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 dark:border-sky-400 bg-sky-50/80 dark:bg-sky-950/50 ring-2 ring-sky-400/50 shadow-sm scale-102'
                        : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl block">{visual.emoji}</span>
                    <span className="text-xs font-bold block mt-1.5 text-slate-800 dark:text-slate-100">
                      {key}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                      {visual.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Intensity Slider */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-slate-800 dark:text-slate-200">
                  Felt Intensity ({activeVisual.label})
                </span>
                <span className="px-3 py-0.5 rounded-full bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 font-extrabold border border-slate-200 dark:border-slate-600 shadow-xs">
                  {intensity} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                <span>Gentle / Subtle</span>
                <span>Moderate</span>
                <span>Intense Presence</span>
              </div>
            </div>

            {/* Suggested Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Context & Triggers
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                        active
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add custom tag (e.g. Lab viva, Coffee date)..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Note & Submit Button */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Personal Journal Note (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="What contributed to this feeling? Any insights to capture..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Recording...' : `Log ${selectedMood} Entry ✨`}
              </button>
            </div>
          </form>
        </div>

        {/* Analytics & Distribution (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Valence Trajectory Chart Card */}
          <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                14-Day Valence Trajectory
              </h3>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                Recent 14 Logs
              </span>
            </div>

            {chartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">
                No mood logs recorded yet. Log your first mood to view your trajectory.
              </p>
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
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
                              <p className="text-sky-600 dark:text-sky-400 font-bold">
                                Valence: {payload[0]?.value}/10 ({payload[0]?.payload?.mood})
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="intensity"
                      stroke="#0EA5E9"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#curveGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Mood History Log */}
          <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Recent Emotion Logs
            </h3>
            {entries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No mood entries recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {entries.slice(0, 6).map((e) => {
                  const visual = MOOD_VISUALS[e.mood] || { emoji: '🙂' };
                  return (
                    <div
                      key={e.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{visual.emoji}</span>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">{e.mood}</div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(e.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                          {e.intensity}/10
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
