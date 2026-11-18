import React, { useState, useEffect } from 'react';
import {
  Moon,
  Clock,
  Sun,
  Trash2,
  Calendar,
  Check,
  Star,
  Sparkles,
  Bed,
  Coffee,
  Smartphone,
  BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { NightSkyIllustration } from '../components/Illustrations';

const SLEEP_FACTORS = [
  'Screen time before bed',
  'Late night study',
  'Caffeine after 5 PM',
  'Calm wind-down routine',
  'Hostel noise',
  'Evening workout',
  'Racing thoughts',
  'Warm shower'
];

const QUALITY_LEVELS = [
  { stars: 1, label: 'Restless', desc: 'Woke up multiple times' },
  { stars: 2, label: 'Light', desc: 'Not fully rested' },
  { stars: 3, label: 'Fair', desc: 'Adequate rest' },
  { stars: 4, label: 'Restorative', desc: 'Woke feeling refreshed' },
  { stars: 5, label: 'Deep', desc: 'Flourishing energy' },
];

export default function SleepTracker({ onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [bedtime, setBedtime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:30');
  const [duration, setDuration] = useState(8.0);
  const [quality, setQuality] = useState(4);
  const [selectedFactors, setSelectedFactors] = useState(['Calm wind-down routine']);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entryList, met] = await Promise.all([
        api.getSleepEntries(30),
        api.getSleepMetrics(),
      ]);
      setEntries(entryList);
      setMetrics(met);
    } catch (err) {
      console.error('Failed to load sleep data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    try {
      const [bH, bM] = bedtime.split(':').map(Number);
      const [wH, wM] = wakeTime.split(':').map(Number);
      let diffMinutes = wH * 60 + wM - (bH * 60 + bM);
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
      }
      const hours = Number((diffMinutes / 60).toFixed(1));
      setDuration(hours);
    } catch (e) {}
  }, [bedtime, wakeTime]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.createSleep({
        sleep_date: today,
        bedtime,
        wake_time: wakeTime,
        duration_hours: duration,
        quality,
        notes: notes || undefined,
        factors: selectedFactors,
      });

      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#818CF8', '#C4B5FD', '#FDE047'],
      });

      setNotes('');
      setSuccessBanner(true);
      fetchData();
      setTimeout(() => setSuccessBanner(false), 3000);
    } catch (err) {
      alert('Error recording sleep: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this entry?')) {
      try {
        await api.deleteSleep(id);
        fetchData();
      } catch (err) {
        console.error('Failed to delete sleep entry:', err);
      }
    }
  };

  const toggleFactor = (factor) => {
    if (selectedFactors.includes(factor)) {
      setSelectedFactors(selectedFactors.filter((f) => f !== factor));
    } else {
      setSelectedFactors([...selectedFactors, factor]);
    }
  };

  const chartData = [...entries]
    .reverse()
    .slice(-14)
    .map((e) => ({
      date: new Date(e.sleep_date).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      }),
      duration: e.duration_hours,
      quality: e.quality,
    }));

  return (
    <div className="space-y-7 animate-fade-in pb-10">
      {/* Twilight Sanctuary Header Banner */}
      <div className="rounded-4xl bg-gradient-to-br from-night-800 via-night-900 to-indigo-950 text-white border border-indigo-900/50 p-6 sm:p-8 shadow-wellness relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-30 pointer-events-none">
          <NightSkyIllustration />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-sky-300" />
                Nocturnal Rest Recovery
              </span>
              <span className="text-xs text-sky-200/80 font-medium">Circadian Baseline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Sleep Sanctuary
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/80 mt-1 max-w-xl leading-relaxed">
              Rest is non-negotiable cognitive repair. Track duration, bedtime regularity, and wake quality to protect your memory consolidation.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto relative z-10">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <span className="text-[10px] text-sky-300 font-bold uppercase block">Target Window</span>
              <span className="text-sm font-extrabold text-white">7.5 – 8.5 hrs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Logging Form (5 cols) */}
        <div className="lg:col-span-5 rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 sm:p-7 shadow-wellness space-y-5">
          <div className="flex items-center justify-between border-b border-cream-200/80 pb-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-charcoal-900">
                Log Last Night's Rest
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Calculate total sleep and record subjective rest quality.
              </p>
            </div>
            {successBanner && (
              <span className="text-xs font-bold text-mint-800 bg-mint-50 px-3 py-1 rounded-full border border-mint-200 flex items-center gap-1 animate-bounce">
                <Check className="w-3.5 h-3.5 text-mint-600" /> Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Bedtime & Wake Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                <label className="block text-[11px] font-bold text-indigo-900 mb-1 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-600" /> Fell Asleep
                </label>
                <input
                  type="time"
                  required
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-indigo-950 focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-600" /> Woke Up
                </label>
                <input
                  type="time"
                  required
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-200 bg-white text-amber-950 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculated Duration Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-900">Calculated Rest Duration</p>
                <p className="text-[10px] text-indigo-700/80">
                  {duration >= 7.5 ? '✨ Within restorative recommendation' : '⚠️ Below optimal 7.5h target'}
                </p>
              </div>
              <span className="text-2xl font-serif font-black text-indigo-950">
                {duration} <span className="text-xs font-normal text-indigo-700">hrs</span>
              </span>
            </div>

            {/* Quality Stars Rating */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-charcoal-800">
                Rest Quality & Morning Energy
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {QUALITY_LEVELS.map((q) => {
                  const isSelected = quality === q.stars;
                  return (
                    <button
                      key={q.stars}
                      type="button"
                      onClick={() => setQuality(q.stars)}
                      className={`p-2 rounded-2xl border text-center transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-wellness-sm scale-105'
                          : 'bg-cream-50/70 border-cream-200 text-charcoal-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-center mb-0.5">
                        <Star className={`w-3.5 h-3.5 ${isSelected ? 'fill-amber-300 text-amber-300' : 'text-amber-400 fill-amber-400'}`} />
                      </div>
                      <span className="text-[10px] font-extrabold block">{q.stars}★</span>
                      <span className="text-[9px] block truncate opacity-80">{q.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-charcoal-800">
                Night Influences & Factors
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SLEEP_FACTORS.map((factor) => {
                  const active = selectedFactors.includes(factor);
                  return (
                    <button
                      key={factor}
                      type="button"
                      onClick={() => toggleFactor(factor)}
                      className={`text-xs px-2.5 py-1 rounded-xl font-bold transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow-wellness-sm'
                          : 'bg-cream-50 border border-cream-200 text-charcoal-600 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      {factor}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 text-white font-extrabold text-xs shadow-glow-lavender transition hover:scale-102 active:scale-98"
            >
              {isSubmitting ? 'Recording...' : 'Log Sleep Sanctuary Entry 🌙'}
            </button>
          </form>
        </div>

        {/* 14-Day Sleep Bar Chart (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 shadow-wellness">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-charcoal-900">
                  14-Day Sleep Duration History
                </h3>
                <p className="text-xs text-charcoal-400">Dotted line marks the 7.5h restorative threshold</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Nightly Rest (Hours)
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE7DC" />
                  <XAxis dataKey="date" tick={{ fill: '#756E96', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 12]} tick={{ fill: '#756E96', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2.5 rounded-xl shadow-wellness border border-cream-200 text-xs">
                            <p className="font-bold text-charcoal-900">{label}</p>
                            <p className="text-indigo-700 font-bold">
                              Duration: {payload[0]?.value} hrs ({payload[0]?.payload?.quality}★ quality)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={7.5} stroke="#10B981" strokeDasharray="4 4" label={{ value: '7.5h Goal', fill: '#10B981', fontSize: 9 }} />
                  <Bar dataKey="duration" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Wind-Down Routine Card */}
          <div className="rounded-4xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/80 p-5 shadow-wellness flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                Digital Wind-Down Tip
              </span>
              <h4 className="text-sm font-extrabold text-charcoal-900 mt-0.5">
                Enable Warm Night Shield 45 Mins Before Bed
              </h4>
              <p className="text-xs text-charcoal-600 mt-0.5">
                Blue spectrum light suppresses melatonin production by up to 50%.
              </p>
            </div>
            <button
              onClick={() => onNavigate('resources')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shrink-0"
            >
              Sleep Guides →
            </button>
          </div>
        </div>
      </div>

      {/* Sleep History Table */}
      <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 sm:p-7 shadow-wellness space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200/80 pb-3">
          <h3 className="text-lg font-serif font-bold text-charcoal-900">
            Past Sleep Logs
          </h3>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            {entries.length} Logs Saved
          </span>
        </div>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-xs text-charcoal-400 text-center py-10">No sleep entries recorded yet.</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-3xl bg-cream-50/70 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:shadow-wellness-sm transition-all"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-serif font-bold text-sm shrink-0 border border-indigo-200">
                    {entry.duration_hours}h
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-charcoal-900">
                        {entry.bedtime} - {entry.wake_time}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.2 rounded-full border border-amber-200">
                        {entry.quality}★ Rest
                      </span>
                    </div>

                    {entry.factors && entry.factors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.factors.map((f, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-charcoal-600 bg-white px-2 py-0.5 rounded-md border border-cream-200"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-[10px] text-charcoal-400 font-mono">
                    {new Date(entry.sleep_date).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short'
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
