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
      setResources(data);
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
    <div className="space-y-7 animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="rounded-4xl bg-gradient-to-r from-sky-100/90 via-lavender-50 to-pink-50 border border-sky-200/80 p-6 sm:p-8 shadow-wellness relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
              Curated Evidence-Based Guides
            </span>
            <span className="text-xs text-charcoal-400 font-medium">Campus Psychoeducation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 tracking-tight">
            Wellbeing Toolkits & Coping Guides
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-xl leading-relaxed">
            Short, actionable guides for exam anxiety, placement rejections, sleep disruptions, and cognitive reframing.
          </p>
        </div>
      </div>

      {/* Somatic Quick Tool Action Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-4xl bg-gradient-to-br from-mint-50 to-emerald-100/80 border border-mint-200 p-6 shadow-wellness flex items-center justify-between gap-4 hover:shadow-wellness-lg transition-all duration-200">
          <div>
            <span className="text-[10px] font-bold text-mint-800 bg-white/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-mint-200 inline-block mb-2">
              Somatic Reset
            </span>
            <h2 className="text-base font-serif font-bold text-charcoal-900">4-7-8 Breathwork Guide</h2>
            <p className="text-xs text-charcoal-600 mt-1 max-w-xs leading-relaxed">
              Stimulates vagal tone to quiet pre-exam racing heartbeats.
            </p>
            <button
              onClick={onOpenBreathing}
              className="mt-4 px-4 py-2 rounded-xl bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-glow-mint"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Open Breathing Tool
            </button>
          </div>
          <div className="w-14 h-14 rounded-3xl bg-mint-500 text-white flex items-center justify-center shrink-0 shadow-glow-mint">
            <Wind className="w-7 h-7" />
          </div>
        </div>

        <div className="rounded-4xl bg-gradient-to-br from-peach-50 to-coral-100/80 border border-peach-200 p-6 shadow-wellness flex items-center justify-between gap-4 hover:shadow-wellness-lg transition-all duration-200">
          <div>
            <span className="text-[10px] font-bold text-coral-800 bg-white/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-peach-200 inline-block mb-2">
              Sensory Grounding
            </span>
            <h2 className="text-base font-serif font-bold text-charcoal-900">5-4-3-2-1 Sensory Scan</h2>
            <p className="text-xs text-charcoal-600 mt-1 max-w-xs leading-relaxed">
              Anchors racing thoughts back into physical reality.
            </p>
            <button
              onClick={onOpenGrounding}
              className="mt-4 px-4 py-2 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-glow-coral"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Open Grounding Tool
            </button>
          </div>
          <div className="w-14 h-14 rounded-3xl bg-coral-500 text-white flex items-center justify-center shrink-0 shadow-glow-coral">
            <Compass className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-cream-200/90 shadow-wellness space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guides, relaxation practices, sleep hygiene..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-cream-50/70 border border-cream-200 text-xs text-charcoal-900 placeholder-charcoal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl shrink-0 font-bold transition ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-wellness-sm'
                  : 'bg-cream-50 border border-cream-200 text-charcoal-600 hover:bg-cream-100'
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
            className="group rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 hover:border-lavender-300 p-6 shadow-wellness hover:shadow-wellness-lg transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {r.category}
                </span>
                <span className="text-[10px] text-charcoal-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {r.read_time_minutes} min read
                </span>
              </div>

              <h3 className="text-base font-serif font-bold text-charcoal-900 group-hover:text-purple-700 transition">
                {r.title}
              </h3>

              <p className="text-xs text-charcoal-600 mt-2 line-clamp-3 leading-relaxed font-sans">
                {r.summary}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-cream-200/80 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Read Full Guide</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Reader Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFDF9] rounded-4xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-cream-200 relative animate-scale-up max-h-[88vh] overflow-y-auto">
            <button
              onClick={() => setSelectedResource(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-cream-100 text-charcoal-400 hover:text-charcoal-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 inline-block mb-2">
              {selectedResource.category}
            </span>

            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-2">
              {selectedResource.title}
            </h2>

            <div className="p-4 rounded-3xl bg-cream-50/80 border border-cream-200 my-4 text-xs font-bold text-charcoal-600">
              Summary: {selectedResource.summary}
            </div>

            <div className="prose text-xs text-charcoal-700 leading-relaxed font-sans whitespace-pre-line space-y-3">
              {selectedResource.body_markdown || selectedResource.summary}
            </div>

            <div className="mt-6 pt-4 border-t border-cream-200/80 flex justify-end">
              <button
                onClick={() => setSelectedResource(null)}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
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
