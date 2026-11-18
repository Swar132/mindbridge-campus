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
  Mic,
  Volume2,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import VoiceNoteRecorder from '../components/VoiceNoteRecorder';

const JOURNAL_PROMPTS = [
  { prompt: 'What is one thought about your career or future you want to unburden onto this page?', tag: 'Career & Placements', color: 'bg-teal-50 border-teal-200 text-teal-950' },
  { prompt: 'What academic deadline feels heaviest right now, and what is the single next micro-step?', tag: 'Academics & Exams', color: 'bg-peach-50 border-peach-200 text-peach-950' },
  { prompt: 'How did your sleep and daytime energy feel today, and what helped restore you?', tag: 'Rest & Energy', color: 'bg-sky-50 border-sky-200 text-sky-950' },
  { prompt: 'Name three small, ordinary things you felt genuine relief or gratitude for today.', tag: 'Gratitude', color: 'bg-mint-50 border-mint-200 text-teal-950' },
];

const MOOD_TAGS = [
  { label: 'Reflective', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { label: 'Grateful', color: 'bg-peach-100 text-peach-800 border-peach-200' },
  { label: 'Hopeful', color: 'bg-mint-100 text-teal-800 border-mint-200' },
  { label: 'Anxious', color: 'bg-coral-100 text-coral-800 border-coral-200' },
  { label: 'Determined', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  { label: 'Fatigued', color: 'bg-slate-100 text-slate-800 border-slate-200' },
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
  const [voiceNoteUrl, setVoiceNoteUrl] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
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
    setVoiceNoteUrl(null);
    setShowVoiceRecorder(false);
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
    setVoiceNoteUrl(entry.voice_note_url || null);
    setShowVoiceRecorder(false);
    setEntryDate(entry.entry_date || new Date().toISOString().split('T')[0]);
    setIsEditorOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim() && !voiceNoteUrl) {
      alert('Please write some content, a title, or record a voice note for your entry.');
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
        content: content.trim() || (voiceNoteUrl ? '🎙️ Voice note reflection recorded.' : ''),
        mood_tag: moodTag,
        tags: parsedTags,
        voice_note_url: voiceNoteUrl,
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              🔒 Encrypted Student Diary
            </span>
            <span className="text-[11px] font-bold text-charcoal-500 bg-white/80 px-2.5 py-0.5 rounded-full border border-cream-200">
              Optional & Private
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            MindBridge Sanctuary Journal
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
            An unburdening space to write or speak freely. Never shared with college faculty or peers.
          </p>
        </div>

        <button
          onClick={() => openNewEditor()}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold text-xs sm:text-sm shadow-glow-teal transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Write Reflection</span>
        </button>
      </div>

      {/* 2. Writing Prompts Carousel (Addressing Survey Stressors) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-charcoal-600 uppercase tracking-wider block">
          Guided Writing Sparks:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {JOURNAL_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => openNewEditor(p.prompt, p.tag)}
              className={`p-4 rounded-3xl border text-left text-xs ${p.color} shadow-wellness-sm hover:shadow-wellness hover:scale-102 transition flex flex-col justify-between cursor-pointer space-y-2`}
            >
              <p className="font-semibold leading-relaxed">"{p.prompt}"</p>
              <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] font-bold opacity-80">
                <span>{p.tag}</span>
                <span className="flex items-center gap-1 text-teal-800">Use spark →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Search & Tag Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your reflections by keyword or feeling..."
            className="w-full py-2.5 pl-10 pr-4 rounded-2xl liquid-glass border border-white/90 text-xs sm:text-sm text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-wellness-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedTag === ''
                ? 'bg-teal-600 text-white shadow-sm'
                : 'liquid-glass text-charcoal-600 hover:text-charcoal-900 border border-cream-200'
            }`}
          >
            All Entries
          </button>
          {MOOD_TAGS.map((t) => (
            <button
              key={t.label}
              onClick={() => setSelectedTag(selectedTag === t.label ? '' : t.label)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedTag === t.label
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'liquid-glass text-charcoal-600 hover:text-charcoal-900 border border-cream-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Journal Entries Feed */}
      {loading ? (
        <div className="py-12 text-center text-xs text-charcoal-400">Loading your reflections...</div>
      ) : entries.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-10 text-center space-y-3 border border-white/90 shadow-wellness">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center border border-teal-200">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-charcoal-900">Your Diary is Completely Private</h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            Writing or speaking your thoughts even twice a week significantly reduces cognitive overload. Start your first entry today.
          </p>
          <button
            onClick={() => openNewEditor()}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
          >
            Create Your First Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => {
            const hasVoice = entry.voice_note_url && entry.voice_note_url.startsWith('data:audio');
            const words = entry.content ? entry.content.trim().split(/\s+/).length : 0;

            return (
              <div
                key={entry.id}
                onClick={() => setReadingEntry(entry)}
                className="liquid-glass-interactive rounded-3xl p-5 border border-white/90 shadow-wellness flex flex-col justify-between cursor-pointer group space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      {entry.mood_tag || 'Reflection'}
                    </span>
                    <span className="text-[10px] text-charcoal-400 font-medium">
                      {entry.entry_date || new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-charcoal-900 group-hover:text-teal-700 transition leading-snug">
                    {entry.title}
                  </h3>

                  <p className="text-xs text-charcoal-600 line-clamp-3 leading-relaxed">
                    {entry.content}
                  </p>

                  {/* Audio preview if voice note exists */}
                  {hasVoice && (
                    <div className="pt-1">
                      <audio controls src={entry.voice_note_url} className="w-full h-8 rounded-lg" onClick={(e) => e.stopPropagation()} />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-cream-200/80 text-[10px] text-charcoal-400">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-teal-600" />
                    <span>{words} words • Private</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditEditor(entry);
                      }}
                      className="p-1 rounded-lg text-charcoal-500 hover:text-teal-700 hover:bg-teal-50 transition"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(entry.id, e)}
                      className="p-1 rounded-lg text-charcoal-500 hover:text-rose-600 hover:bg-rose-50 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm animate-fade-in">
          <div className="liquid-glass rounded-4xl max-w-xl w-full p-6 sm:p-8 border border-white/90 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setReadingEntry(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-charcoal-400 hover:bg-white/80 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {readingEntry.mood_tag || 'Reflection'}
              </span>
              <span className="text-xs text-charcoal-400">
                {readingEntry.entry_date || new Date(readingEntry.created_at).toLocaleDateString()}
              </span>
            </div>

            <h2 className="text-xl font-bold text-charcoal-900">{readingEntry.title}</h2>

            {readingEntry.voice_note_url && (
              <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-1.5">
                <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-teal-600" />
                  <span>Voice Note Reflection</span>
                </span>
                <audio controls src={readingEntry.voice_note_url} className="w-full h-8" />
              </div>
            )}

            <div className="text-xs sm:text-sm text-charcoal-800 leading-relaxed whitespace-pre-line border-t border-cream-200 pt-3">
              {readingEntry.content}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-cream-200 text-xs text-charcoal-500">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>Confidential Entry</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const entryToEdit = readingEntry;
                    setReadingEntry(null);
                    openEditEditor(entryToEdit);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold transition flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Distraction-Free Journal Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm animate-fade-in">
          <div className="liquid-glass rounded-4xl max-w-xl w-full p-6 sm:p-8 border border-white/90 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-charcoal-400 hover:bg-white/80 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {editingEntry ? 'Edit Private Reflection' : 'New Journal Sanctuary Entry'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-charcoal-900 mt-1 mb-4">
              {editingEntry ? 'Update your reflection' : 'Put thoughts into words or voice'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Entry Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give today's reflection a name..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-white/90 border border-cream-200 text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-wellness-sm"
                />
              </div>

              {/* Mood Tag & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">Emotional Baseline</label>
                  <select
                    value={moodTag}
                    onChange={(e) => setMoodTag(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-xl bg-white border border-cream-200 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {MOOD_TAGS.map((t) => (
                      <option key={t.label} value={t.label}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">Entry Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-xl bg-white border border-cream-200 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                  </input>
                </div>
              </div>

              {/* Voice Note Option (Phase 10) */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-teal-600" />
                    <span>Attach Audio Voice Note (Optional)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 underline"
                  >
                    {showVoiceRecorder ? 'Close Recorder' : voiceNoteUrl ? 'Re-record' : '+ Record Voice'}
                  </button>
                </div>

                {voiceNoteUrl && !showVoiceRecorder && (
                  <div className="flex items-center gap-2 pt-1">
                    <audio controls src={voiceNoteUrl} className="w-full h-8 rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setVoiceNoteUrl(null)}
                      className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                      title="Remove voice note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {showVoiceRecorder && (
                  <VoiceNoteRecorder
                    onAudioReady={(audio) => {
                      setVoiceNoteUrl(audio.base64);
                      setShowVoiceRecorder(false);
                    }}
                    onCancel={() => setShowVoiceRecorder(false)}
                  />
                )}
              </div>

              {/* Content Body */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-charcoal-700 mb-1">
                  <span>Reflection Content</span>
                  <span className="text-charcoal-400 font-normal">{wordCount} words</span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="Write freely without judgment. Let thoughts flow onto this safe page..."
                  className="w-full p-4 rounded-2xl bg-white/90 border border-cream-200 text-xs sm:text-sm text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-wellness-sm resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Placement Prep, Exam Stress, Hostel Life"
                  className="w-full py-2 px-3 text-xs rounded-xl bg-white border border-cream-200 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-charcoal-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-teal-600" />
                  <span>Encrypted & visible only to you</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-charcoal-600 hover:bg-white/80 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold text-xs shadow-glow-teal transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Reflection'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
