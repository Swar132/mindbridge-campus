import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Lock,
  Calendar,
  Trash2,
  Edit3,
  X,
  Eye,
  Check,
  Sparkles,
  Plus,
  Heart,
  Bookmark,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';

const JOURNAL_PROMPTS = [
  { prompt: 'What is one thought about your career or future you want to unburden onto this page?', tag: 'Career & Placements', color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60 text-teal-950 dark:text-teal-200' },
  { prompt: 'What academic deadline feels heaviest right now, and what is the single next micro-step?', tag: 'Academics & Exams', color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60 text-orange-950 dark:text-orange-200' },
  { prompt: 'How did your sleep and daytime energy feel today, and what helped restore you?', tag: 'Rest & Energy', color: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-950 dark:text-sky-200' },
  { prompt: 'Name three small, ordinary things you felt genuine relief or gratitude for today.', tag: 'Gratitude', color: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-200' },
];

const MOOD_TAGS = [
  { label: 'Reflective', color: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  { label: 'Grateful', color: 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  { label: 'Hopeful', color: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { label: 'Anxious', color: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  { label: 'Determined', color: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  { label: 'Fatigued', color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
];

export default function Journal({ onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [readingEntry, setReadingEntry] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState('Reflective');
  const [tagsInput, setTagsInput] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await api.getJournals(search, selectedTag);
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [search, selectedTag]);

  const openNewEditor = (promptText = '', initialTag = 'Reflective') => {
    setEditingEntry(null);
    setTitle(promptText ? 'Evening Mindful Reflection' : '');
    setContent(promptText ? `${promptText}\n\n` : '');
    setMoodTag(initialTag);
    setTagsInput('Personal');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setIsEditorOpen(true);
  };

  const openEditEditor = (entry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setMoodTag(entry.mood_tag || 'Reflective');
    const tagsArr = Array.isArray(entry.tags) ? entry.tags : [];
    setTagsInput(tagsArr.join(', '));
    setEntryDate(entry.entry_date || new Date().toISOString().split('T')[0]);
    setIsEditorOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      alert('Please write some content or a title for your entry.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: title.trim() || 'Daily Reflection',
        content: content.trim(),
        mood_tag: moodTag,
        tags: parsedTags,
        is_private: true,
        entry_date: entryDate,
      };

      if (editingEntry) {
        await api.updateJournal(editingEntry.id, payload);
      } else {
        await api.createJournal(payload);
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0D9488', '#FB923C', '#38BDF8'],
        });
      }

      await fetchEntries();
      setIsEditorOpen(false);
    } catch (err) {
      alert('Error saving journal: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this private reflection?')) {
      try {
        await api.deleteJournal(id);
        setEntries((prev) => prev.filter((item) => item.id !== id));
        if (readingEntry?.id === id) setReadingEntry(null);
      } catch (err) {
        alert('Error deleting journal: ' + err.message);
      }
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-300">
      {/* 1. Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              🔒 Encrypted Student Diary
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              100% Private to You
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            MindBridge Sanctuary Journal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            An unburdening space to write or speak freely. Never shared with college faculty, counsellors, or peers.
          </p>
        </div>

        <button
          onClick={() => openNewEditor()}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Write Reflection</span>
        </button>
      </div>

      {/* 2. Writing Prompts Carousel */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Guided Writing Sparks:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {JOURNAL_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => openNewEditor(p.prompt, p.tag)}
              className={`p-4 rounded-3xl border text-left text-xs ${p.color} shadow-xs hover:shadow-sm hover:scale-101 transition flex flex-col justify-between cursor-pointer space-y-2`}
            >
              <p className="font-semibold leading-relaxed">"{p.prompt}"</p>
              <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/10 text-[10px] font-bold opacity-80">
                <span>{p.tag}</span>
                <span className="flex items-center gap-1 text-teal-700 dark:text-teal-300">Use spark →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Search & Tag Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your reflections by keyword or feeling..."
            className="w-full py-2.5 pl-10 pr-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedTag === ''
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Entries
          </button>
          {MOOD_TAGS.map((t) => (
            <button
              key={t.label}
              onClick={() => setSelectedTag(selectedTag === t.label ? '' : t.label)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedTag === t.label
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Journal Entries Feed */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading your reflections...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl p-10 text-center space-y-3 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 mx-auto flex items-center justify-center border border-teal-200 dark:border-teal-800">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Sanctuary Diary is Waiting</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Writing down your thoughts even twice a week significantly reduces cognitive overload and academic anxiety. Start your first entry today.
          </p>
          <button
            onClick={() => openNewEditor()}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Create Your First Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => {
            const words = entry.content ? entry.content.trim().split(/\s+/).length : 0;

            return (
              <div
                key={entry.id}
                onClick={() => setReadingEntry(entry)}
                className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between cursor-pointer group space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                      {entry.mood_tag || 'Reflection'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {entry.entry_date || new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug">
                    {entry.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {entry.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    <span>{words} words • Private</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditEditor(entry);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(entry.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Full Entry Reader Modal */}
      {readingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="rounded-3xl max-w-xl w-full p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setReadingEntry(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {readingEntry.mood_tag || 'Reflection'}
                </span>
                <span className="text-xs text-slate-400">
                  {readingEntry.entry_date || new Date(readingEntry.created_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-1">
                {readingEntry.title}
              </h2>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {readingEntry.content}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>Encrypted private entry</span>
              </span>
              <button
                onClick={() => {
                  const toEdit = readingEntry;
                  setReadingEntry(null);
                  openEditEditor(toEdit);
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition cursor-pointer"
              >
                Edit Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Entry Editor / Writer Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="rounded-3xl max-w-2xl w-full p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[95vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                ✍️
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingEntry ? 'Edit Reflection' : 'New Private Reflection'}
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-1">
              {/* Date & Mood Tag Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Entry Date
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Felt Tone
                  </label>
                  <select
                    value={moodTag}
                    onChange={(e) => setMoodTag(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {MOOD_TAGS.map((t) => (
                      <option key={t.label} value={t.label}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your reflection a name..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Your Thoughts ({wordCount} words)
                </label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write freely without judgment. How was your day, what felt stressful, what brought relief..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                />
              </div>

              {/* Tags Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Placements, Exams, Friends, Self-Care"
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Reflection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
