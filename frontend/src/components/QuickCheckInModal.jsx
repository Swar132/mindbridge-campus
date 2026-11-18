import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Battery, Moon, Flame, Heart, Smile } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { MOOD_VISUALS } from './Illustrations';

const STRESS_CATEGORIES = [
  'Career & Placements',
  'Academics & Exams',
  'Time Management',
  'Family Expectations',
  'Financial Concerns',
  'Hostel & Roommate Life',
  'Relationships & Social Life',
  'Health & Energy',
];

const SUGGESTED_TAGS = [
  'Exam revision',
  'Placement test',
  'Project deadline',
  'Hostel quiet time',
  'Restful sleep',
  'Caffeine crash',
  'Social gathering',
  'Gym/Sports',
];

export default function QuickCheckInModal({ isOpen, onClose, onSuccess }) {
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [moodIntensity, setMoodIntensity] = useState(7);
  const [energyLevel, setEnergyLevel] = useState(6);
  const [stressLevel, setStressLevel] = useState(3);
  const [stressCategory, setStressCategory] = useState('Career & Placements');
  const [sleepHours, setSleepHours] = useState(7.5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch today's check-in status if already completed
      api.getTodayCheckIn().then((res) => {
        if (res && res.has_checked_in && res.today_data) {
          setIsEditing(true);
          const td = res.today_data;
          setSelectedMood(td.mood || 'Happy');
          setMoodIntensity(td.mood_intensity || 7);
          setEnergyLevel(td.energy_level || 6);
          setStressLevel(td.stress_level || 3);
          setStressCategory(td.stress_category || 'Career & Placements');
          setSleepHours(td.sleep_hours || 7.5);
          setSelectedTags(td.tags || []);
          setNotes(td.notes || '');
        } else {
          setIsEditing(false);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        mood: selectedMood,
        mood_intensity: Number(moodIntensity),
        energy_level: Number(energyLevel),
        stress_level: Number(stressLevel),
        stress_category: stressCategory,
        sleep_hours: Number(sleepHours),
        tags: selectedTags,
        notes: notes || undefined,
      };

      const res = await api.submitDailyCheckIn(payload);
      setSuccessResult(res);

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0D9488', '#FB923C', '#38BDF8', '#86EFAC'],
      });

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessResult(null);
        if (onSuccess) onSuccess();
        onClose();
      }, 1600);
    } catch (err) {
      alert('Error recording check-in: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="liquid-glass-apple dark:bg-slate-900/95 rounded-4xl max-w-lg w-full shadow-2xl border border-sky-100 dark:border-slate-800 overflow-hidden p-6 sm:p-8 relative animate-scale-up max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-50/90 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
            {isEditing ? "Update Today's Check-in" : '60-Second Daily Check-in'}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          How is your student wellbeing today?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-5">
          Fast, confidential tracking across your mood, energy, tension, and rest.
        </p>

        {successResult ? (
          <div className="py-10 text-center space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 mx-auto flex items-center justify-center shadow-glow-teal animate-bounce-subtle">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900">Check-in Successfully Saved!</h3>
            <p className="text-xs text-charcoal-600 max-w-xs mx-auto">
              Your weekly streak is at <strong>{successResult.weekly_streak_days} days</strong>. Dashboard and analytics have been updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Expressive Mood Selection */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-2.5 flex items-center justify-between">
                <span>1. Select Primary Emotion</span>
                <span className="text-[11px] text-teal-700 font-semibold">{selectedMood}</span>
              </label>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {Object.entries(MOOD_VISUALS).map(([mName, mData]) => {
                  const isSelected = selectedMood === mName;
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => setSelectedMood(mName)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center ${
                        isSelected
                          ? `${mData.bg} ${mData.border} ring-2 ring-teal-500 scale-105 shadow-wellness`
                          : 'bg-white/70 border-cream-200/90 hover:bg-white hover:scale-102 text-charcoal-600'
                      }`}
                    >
                      <span className="text-xl mb-1">{mData.emoji}</span>
                      <span className="text-[10px] font-bold truncate max-w-full">{mName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Mood Intensity Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-charcoal-700">
                <span>Mood Intensity</span>
                <span className="text-teal-700">{moodIntensity}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={moodIntensity}
                onChange={(e) => setMoodIntensity(e.target.value)}
                className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-charcoal-400 mt-1">
                <span>Gentle / Mild</span>
                <span>Moderate</span>
                <span>Intense</span>
              </div>
            </div>

            {/* 3. Energy Level Slider (From Student Survey finding) */}
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-teal-950">
                <span className="flex items-center gap-1.5">
                  <Battery className="w-3.5 h-3.5 text-teal-600" />
                  <span>Daytime Energy Level</span>
                </span>
                <span className="text-teal-800 font-mono bg-white px-2 py-0.5 rounded-lg border border-teal-200">
                  {energyLevel}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value)}
                className="w-full h-2 bg-teal-200/80 rounded-lg appearance-none cursor-pointer accent-teal-700"
              />
              <div className="flex justify-between text-[10px] text-teal-700 font-medium">
                <span>Drained / Fatigued</span>
                <span>Functional</span>
                <span>Vibrant & Alert</span>
              </div>
            </div>

            {/* 4. Stress Level & Domain */}
            <div className="p-3.5 rounded-2xl bg-peach-50/70 border border-peach-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-peach-950">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-peach-600" />
                  <span>Perceived Stress Level</span>
                </span>
                <span className="text-peach-800 font-mono bg-white px-2 py-0.5 rounded-lg border border-peach-200">
                  {stressLevel}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={(e) => setStressLevel(e.target.value)}
                className="w-full h-2 bg-peach-200 rounded-lg appearance-none cursor-pointer accent-peach-600"
              />

              <div className="pt-1">
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1.5">
                  Primary Domain of Stress:
                </label>
                <select
                  value={stressCategory}
                  onChange={(e) => setStressCategory(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl bg-white border border-peach-300 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-peach-500"
                >
                  {STRESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Last Night Sleep Hours */}
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-sky-950">
                <span className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-sky-600" />
                  <span>Last Night Sleep Duration</span>
                </span>
                <span className="text-sky-800 font-mono bg-white px-2 py-0.5 rounded-lg border border-sky-200">
                  {sleepHours} hrs
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full h-2 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-sky-700 font-medium">
                <span>&lt; 5 hrs (Deficit)</span>
                <span>7.5 hrs (Target)</span>
                <span>9+ hrs (Extended)</span>
              </div>
            </div>

            {/* 6. Context Tags */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                What influenced your day? (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((tag) => {
                  const isTagSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition ${
                        isTagSelected
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-white/80 border border-cream-200 text-charcoal-600 hover:bg-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Optional Notes */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Private Note to Yourself (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Anything specific on your mind today..."
                className="w-full p-3 rounded-2xl bg-white/90 border border-cream-200 text-xs text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs sm:text-sm font-bold shadow-glow-teal transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Check-in...' : isEditing ? 'Update Check-in' : 'Complete 60-Second Check-in'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
