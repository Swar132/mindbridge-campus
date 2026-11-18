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
        colors: ['#0EA5E9', '#A78BFA', '#14B8A6', '#FB923C'],
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setSuccessResult(null);
      }, 1600);
    } catch (err) {
      alert('Error submitting check-in: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-sky-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
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
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-300 mx-auto flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Check-in Successfully Saved!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
              Your streak is at <strong>{successResult.weekly_streak_days} days</strong>. Dashboard and analytics have been updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Expressive Mood Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center justify-between">
                <span>1. Select Primary Emotion</span>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">{selectedMood}</span>
              </label>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {Object.entries(MOOD_VISUALS).map(([mName, mData]) => {
                  const isSelected = selectedMood === mName;
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => setSelectedMood(mName)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition text-center cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 dark:border-sky-400 bg-sky-50 dark:bg-sky-950/60 ring-2 ring-sky-400/50 shadow-xs scale-102'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
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
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700 dark:text-slate-300">
                <span>Mood Intensity</span>
                <span className="text-sky-600 dark:text-sky-400">{moodIntensity}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={moodIntensity}
                onChange={(e) => setMoodIntensity(e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                <span>Gentle / Mild</span>
                <span>Moderate</span>
                <span>Intense</span>
              </div>
            </div>

            {/* 3. Energy Level Slider */}
            <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-teal-950 dark:text-teal-200">
                <span className="flex items-center gap-1.5">
                  <Battery className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Daytime Energy Level</span>
                </span>
                <span className="text-teal-800 dark:text-teal-300 font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                  {energyLevel}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value)}
                className="w-full h-2 bg-teal-200 dark:bg-teal-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-teal-700 dark:text-teal-400 font-medium">
                <span>Drained / Fatigued</span>
                <span>Functional</span>
                <span>Vibrant & Alert</span>
              </div>
            </div>

            {/* 4. Stress Level & Domain */}
            <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-orange-950 dark:text-orange-200">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>Perceived Stress Level</span>
                </span>
                <span className="text-orange-800 dark:text-orange-300 font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-800">
                  {stressLevel}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={(e) => setStressLevel(e.target.value)}
                className="w-full h-2 bg-orange-200 dark:bg-orange-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />

              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Domain of Stress:
                </label>
                <select
                  value={stressCategory}
                  onChange={(e) => setStressCategory(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
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
            <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-sky-950 dark:text-sky-200">
                <span className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-sky-500" />
                  <span>Last Night Sleep Duration</span>
                </span>
                <span className="text-sky-800 dark:text-sky-300 font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800">
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
                className="w-full h-2 bg-sky-200 dark:bg-sky-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-sky-700 dark:text-sky-400 font-medium">
                <span>&lt; 5 hrs (Deficit)</span>
                <span>7.5 hrs (Target)</span>
                <span>9+ hrs (Extended)</span>
              </div>
            </div>

            {/* 6. Context Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                        isTagSelected
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Private Note to Yourself (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Anything specific on your mind today..."
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
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
