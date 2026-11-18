import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  Save,
  Moon,
  Clock,
  LogOut,
  Sparkles,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [yearOfStudy, setYearOfStudy] = useState(user?.year_of_study || '');
  const [checkinReminder, setCheckinReminder] = useState(true);
  const [sleepReminder, setSleepReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:30');
  const [consentAI, setConsentAI] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrefs() {
      try {
        setLoading(true);
        const prefs = await api.getPreferences();
        setPreferences(prefs);
        setCheckinReminder(prefs.checkin_reminder_enabled);
        setSleepReminder(prefs.sleep_reminder_enabled);
        setReminderTime(prefs.reminder_time);
        setConsentAI(prefs.consent_ai_analysis);
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPrefs();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateUser({
        full_name: fullName,
        department,
        year_of_study: yearOfStudy,
      });

      await api.updatePreferences({
        checkin_reminder_enabled: checkinReminder,
        sleep_reminder_enabled: sleepReminder,
        reminder_time: reminderTime,
        consent_ai_analysis: consentAI,
      });

      setIsSaved(true);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#0EA5E9', '#A78BFA', '#14B8A6'],
      });
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err) {
      alert('Error updating settings: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12 transition-colors duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-sky-50 via-purple-50 to-teal-50 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-sky-950/40 border border-sky-100/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
              <SettingsIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Account & Privacy Control
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Student Privacy Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Settings & Sanctuary Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
            Customize gentle notification windows, configure profile details, and manage AI reflection consent.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-sky-500" />
              <span>Campus Profile Details</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Your visible identity on MindBridge Campus</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs font-bold px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Email Address (Primary Account)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full text-xs font-mono px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Department / Major
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full text-xs font-bold px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Faculty / Staff">Faculty / Staff</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gentle Notification Schedule */}
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Gentle Wellbeing Reminders</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Soft, guilt-free invitations designed to encourage check-ins without shame or streak pressure.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Evening Mindful Check-in Prompt</p>
                <p className="text-[11px] text-slate-400">Gentle invitation to log daily mood and release study tension</p>
              </div>
              <input
                type="checkbox"
                checked={checkinReminder}
                onChange={(e) => setCheckinReminder(e.target.checked)}
                className="w-4 h-4 accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Bedtime Wind-Down Reminder</p>
                <p className="text-[11px] text-slate-400">Prompts 30 minutes before your target sleep window</p>
              </div>
              <input
                type="checkbox"
                checked={sleepReminder}
                onChange={(e) => setSleepReminder(e.target.checked)}
                className="w-4 h-4 accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Preferred Reminder Window</p>
                <p className="text-[11px] text-slate-400">Optimal evening delivery window</p>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* AI Privacy & Data Sharing Consent */}
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span>AI Insights & Data Consent</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control which signals Mindy AI synthesizes to generate tailored guidance.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="max-w-lg">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Consent for AI Pattern Recognition</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Allows Mindy AI to synthesize your self-reported mood, sleep, and stress logs to detect helpful habits. Your private journals remain strictly excluded and client-isolated.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentAI}
              onChange={(e) => setConsentAI(e.target.checked)}
              className="w-4 h-4 accent-sky-500 shrink-0 ml-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={logout}
            className="px-5 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center gap-3">
            {isSaved && (
              <span className="text-xs text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 animate-bounce">
                Settings Saved Successfully! 🌿
              </span>
            )}
            <button
              type="submit"
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition active:scale-95 cursor-pointer"
            >
              Save Preferences ✨
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
