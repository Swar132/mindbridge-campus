import React, { useState, useEffect } from 'react';
import {
  Library,
  Search,
  Wind,
  Clock,
  ArrowRight,
  X,
  Play,
  Compass,
  BookOpen,
  Sparkles,
  Bookmark
} from 'lucide-react';
import { api } from '../api/client';

const CATEGORIES = [
  'All',
  'Stress Management',
  'Anxiety Management',
  'Academic Pressure',
  'Placement Preparation Stress',
  'Sleep Hygiene',
  'Emotional Wellbeing',
  'Mindfulness and Meditation',
];

export default function Resources({ onOpenBreathing, onOpenGrounding }) {
  const [resources, setResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await api.getResources(selectedCategory, search);
      setResources(data || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedCategory, search]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-sky-50 via-teal-50 to-purple-50 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-teal-950/40 border border-sky-100/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
              Curated Evidence-Based Guides
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Campus Psychoeducation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Wellbeing Toolkits & Coping Guides
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
            Short, actionable guides for exam anxiety, placement rejections, sleep disruptions, and cognitive reframing.
          </p>
        </div>
      </div>

      {/* Somatic Quick Tool Action Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/50 p-6 shadow-sm flex items-center justify-between gap-4 transition">
          <div>
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-white/80 dark:bg-slate-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-teal-200 dark:border-teal-800 inline-block mb-2">
              Somatic Reset
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">4-7-8 Breathwork Guide</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs leading-relaxed">
              Stimulates vagal tone to quiet pre-exam racing heartbeats.
            </p>
            <button
              onClick={onOpenBreathing}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Open Breathing Tool
            </button>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Wind className="w-7 h-7" />
          </div>
        </div>

        <div className="rounded-3xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 p-6 shadow-sm flex items-center justify-between gap-4 transition">
          <div>
            <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 bg-white/80 dark:bg-slate-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-orange-200 dark:border-orange-800 inline-block mb-2">
              Sensory Grounding
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">5-4-3-2-1 Sensory Scan</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs leading-relaxed">
              Anchors racing thoughts back into physical reality.
            </p>
            <button
              onClick={onOpenGrounding}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Open Grounding Tool
            </button>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Compass className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guides, relaxation practices, sleep hygiene..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl shrink-0 font-bold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((r) => (
          <div
            key={r.id}
            onClick={() => setSelectedResource(r)}
            className="group rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                  {r.category}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {r.read_time_minutes} min read
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition leading-snug">
                {r.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                {r.summary}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
              <span>Read Full Guide</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Reader Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-up max-h-[88vh] overflow-y-auto">
            <button
              onClick={() => setSelectedResource(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800 inline-block mb-2">
              {selectedResource.category}
            </span>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {selectedResource.title}
            </h2>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 my-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Summary: {selectedResource.summary}
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-3">
              {selectedResource.body_markdown || selectedResource.summary}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedResource(null)}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
