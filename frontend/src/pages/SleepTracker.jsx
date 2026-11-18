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
      setEntries(entryList || []);
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
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sleep Sanctuary
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/80 mt-1 max-w-xl leading-relaxed">
              Rest is foundational cognitive repair. Track duration, bedtime regularity, and wake quality to protect your memory consolidation.
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
        <div className="lg:col-span-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Log Last Night's Rest
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculate total sleep and record subjective rest quality.
              </p>
            </div>
            {successBanner && (
              <span className="text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1 animate-bounce">
                <Check className="w-3.5 h-3.5 text-teal-600" /> Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Bedtime & Wake Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" /> Fell Asleep
                </label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Woke Up
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Total Calculated Sleep Duration */}
            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100/80 dark:border-sky-900/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Total Calculated Sleep</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Optimal baseline: 7.5+ hrs</span>
              </div>
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {duration} <span className="text-xs font-normal">hours</span>
              </div>
            </div>

            {/* Rest Quality Rating */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Subjective Rest Quality
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {QUALITY_LEVELS.map((q) => (
                  <button
                    key={q.stars}
                    type="button"
                    onClick={() => setQuality(q.stars)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                      quality === q.stars
                        ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex justify-center text-xs">
                      {'⭐'.repeat(q.stars)}
                    </div>
                    <span className="text-[10px] font-bold block mt-1 truncate">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Nighttime Influences & Habits
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SLEEP_FACTORS.map((f) => {
                  const active = selectedFactors.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFactor(f)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Rest Reflection (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="Dreams, nighttime awakenings, or morning energy notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-600 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Log Sleep Record ✨'}
            </button>
          </form>
        </div>

        {/* Analytics & History (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 14-Day Sleep Duration Chart */}
          <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                14-Day Rest Duration
              </h3>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                Target: 7.5 - 8.5h
              </span>
            </div>

            {chartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">
                No sleep records yet. Log your rest on the left to see your sleep history.
              </p>
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                    <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 12]} tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        color: '#fff',
                        borderRadius: '1rem',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        fontSize: '11px',
                      }}
                    />
                    <ReferenceLine y={7.5} stroke="#38BDF8" strokeDasharray="3 3" />
                    <Bar dataKey="duration" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* History Feed */}
          <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Recent Rest Logs
            </h3>
            {entries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No sleep entries recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {entries.slice(0, 6).map((e) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {e.duration_hours} hrs • {e.bedtime} – {e.wake_time}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(e.sleep_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        {e.notes ? ` • "${e.notes}"` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {'⭐'.repeat(e.quality || 3)}
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
