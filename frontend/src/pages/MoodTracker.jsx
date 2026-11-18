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
      setEntries(data);
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
        colors: ['#A78BFA', '#34D399', '#FBBF24'],
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
    const visual = MOOD_VISUALS[name] || { accentColor: '#A78BFA' };
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
    <div className="space-y-7 animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="rounded-4xl bg-gradient-to-r from-amber-50 via-lavender-50 to-pink-50 border border-amber-200/80 p-6 sm:p-8 shadow-wellness relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                Emotional Self-Awareness
              </span>
              <span className="text-xs text-charcoal-400 font-medium">Daily Reflection Log</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 tracking-tight">
              Expressive Mood Sanctuary
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-xl leading-relaxed">
              Track how your feelings shift across exam weeks, project sprints, and weekends. Cultivate self-compassion.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigate('insights')}
              className="px-4 py-2 rounded-2xl bg-white hover:bg-cream-50 text-xs font-bold text-charcoal-800 transition shadow-wellness-sm border border-cream-200 flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              <span>View Insights</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Logging Form + Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mood Form (7 Cols) */}
        <div className="lg:col-span-7 rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 sm:p-7 shadow-wellness space-y-5">
          <div className="flex items-center justify-between border-b border-cream-200/80 pb-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-charcoal-900">
                How does your inner weather look today?
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Pick the mood that resonates most right now.
              </p>
            </div>
            {successBanner && (
              <span className="text-xs font-bold text-mint-800 bg-mint-50 px-3 py-1 rounded-full border border-mint-200 flex items-center gap-1 animate-bounce">
                <Check className="w-3.5 h-3.5 text-mint-600" /> Logged!
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
                    className={`p-3 rounded-3xl border-2 text-center transition-all duration-200 flex flex-col items-center justify-between ${
                      isSelected
                        ? `${visual.bg} ${visual.border} ${visual.ring} ring-4 scale-105 shadow-wellness-lg`
                        : 'bg-cream-50/70 border-cream-200 hover:bg-white hover:border-lavender-300 hover:scale-102'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl block">{visual.emoji}</span>
                    <span className={`text-xs font-extrabold block mt-1.5 ${visual.text}`}>
                      {key}
                    </span>
                    <span className="text-[10px] text-charcoal-400 block truncate">
                      {visual.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Intensity Slider */}
            <div className="p-4 rounded-3xl bg-cream-50/80 border border-cream-200">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-charcoal-800">
                  Felt Intensity ({activeVisual.label})
                </span>
                <span className="px-3 py-0.5 rounded-full bg-white text-purple-700 font-extrabold border border-purple-200 shadow-wellness-sm">
                  {intensity} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-charcoal-400 mt-1 font-semibold">
                <span>Gentle / Subtle</span>
                <span>Moderate</span>
                <span>Intense Presence</span>
              </div>
            </div>

            {/* Suggested Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-charcoal-800">
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
                      className={`text-xs px-3 py-1 rounded-xl font-bold transition ${
                        active
                          ? 'bg-purple-600 text-white shadow-wellness-sm'
                          : 'bg-cream-50 border border-cream-200 text-charcoal-600 hover:bg-lavender-50 hover:text-purple-700'
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
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-cream-50/60 border border-cream-200 text-charcoal-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3.5 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal-700 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Note & Submit Button */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-charcoal-800">
                Personal Journal Note (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="What contributed to this feeling? Any insights to capture..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl bg-cream-50/60 border border-cream-200 text-charcoal-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none font-sans"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-coral-500 hover:from-purple-700 hover:to-coral-600 text-white font-extrabold text-xs shadow-glow-lavender transition hover:scale-102 active:scale-98"
              >
                {isSubmitting ? 'Recording...' : `Log ${selectedMood} Entry ✨`}
              </button>
            </div>
          </form>
        </div>

        {/* Analytics & Distribution (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Valence Trajectory Chart Card */}
          <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 shadow-wellness">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-serif font-bold text-charcoal-900">
                14-Day Valence Trajectory
              </h3>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Recent 14 Logs
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
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
                            <p className="text-purple-700 font-bold">
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
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#curveGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mood Breakdown Donut Card */}
          <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 shadow-wellness">
            <h3 className="text-sm font-serif font-bold text-charcoal-900 mb-1">
              Mood Proportion Breakdown
            </h3>
            <p className="text-xs text-charcoal-400 mb-3">Recorded distribution over {filterDays} days</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {pieData.map((item) => (
                <span
                  key={item.name}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 bg-cream-50 border border-cream-200"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name} ({item.value})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline of Past Entries */}
      <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 sm:p-7 shadow-wellness space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200/80 pb-3">
          <div>
            <h3 className="text-lg font-serif font-bold text-charcoal-900">
              Personal Emotional Timeline
            </h3>
            <p className="text-xs text-charcoal-500">
              Browse previous reflections and see your journey over time.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            {entries.length} Entries Recorded
          </span>
        </div>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-xs text-charcoal-400 text-center py-10">No entries recorded yet.</p>
          ) : (
            entries.map((entry) => {
              const visual = MOOD_VISUALS[entry.mood] || MOOD_VISUALS['Happy'];
              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-3xl bg-cream-50/70 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:shadow-wellness-sm transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <span className="text-3xl shrink-0 p-2 rounded-2xl bg-white shadow-wellness-sm border border-cream-200">
                      {visual.emoji}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold ${visual.text}`}>
                          {entry.mood}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white border border-cream-200 text-charcoal-700">
                          Intensity: {entry.intensity}/10
                        </span>
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-charcoal-700 mt-1 italic">
                          "{entry.notes}"
                        </p>
                      )}

                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {entry.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
