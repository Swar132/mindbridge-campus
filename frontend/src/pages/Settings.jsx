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
  Heart,
  Phone,
  Smartphone,
  Send,
  RefreshCw,
  AlertCircle,
  Check,
  History,
  ShieldAlert,
  Globe,
  Calendar,
  XCircle
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

  // SMS Reminder State
  const [reminderStatus, setReminderStatus] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpNotice, setOtpNotice] = useState(null);
  const [otpError, setOtpError] = useState(null);

  // SMS Preferences State
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsTime, setSmsTime] = useState('20:00');
  const [smsFrequency, setSmsFrequency] = useState('daily');
  const [smsTimezone, setSmsTimezone] = useState('Asia/Kolkata');
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsLogs, setSmsLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prefs, remStatus] = await Promise.all([
          api.getPreferences(),
          api.getReminderStatus().catch(() => null)
        ]);

        setPreferences(prefs);
        setCheckinReminder(prefs.checkin_reminder_enabled);
        setSleepReminder(prefs.sleep_reminder_enabled);
        setReminderTime(prefs.reminder_time || '20:30');
        setConsentAI(prefs.consent_ai_analysis);

        if (remStatus) {
          setReminderStatus(remStatus);
          setSmsEnabled(remStatus.sms_reminders_enabled);
          setSmsTime(remStatus.reminder_time || '20:00');
          setSmsFrequency(remStatus.reminder_frequency || 'daily');
          setSmsTimezone(remStatus.timezone || 'Asia/Kolkata');
          setSmsConsent(remStatus.sms_consent_given);
          if (remStatus.phone_number) {
            setPhoneInput(remStatus.phone_number.replace(/^\+91/, ''));
          }
        }
      } catch (err) {
        console.error('Failed to load settings data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadLogs = async () => {
    try {
      const logs = await api.getSMSLogs();
      setSmsLogs(logs);
      setShowLogs(true);
    } catch (err) {
      console.error('Failed to fetch SMS logs:', err);
    }
  };

  // Dispatch OTP
  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    if (!phoneInput.trim()) {
      setOtpError('Please enter a valid phone number.');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    setOtpNotice(null);
    try {
      const res = await api.updatePhoneNumber({
        phone_number: phoneInput.trim(),
        country_code: countryCode
      });
      setOtpSent(true);
      setOtpNotice(res.message);
      // Refresh status
      const updated = await api.getReminderStatus();
      setReminderStatus(updated);
    } catch (err) {
      setOtpError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    if (!otpCode.trim()) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const fullPhone = reminderStatus?.phone_number || `${countryCode}${phoneInput.trim()}`;
      const res = await api.verifyReminderOTP(fullPhone, otpCode.trim());
      setOtpNotice(res.message);
      setOtpSent(false);
      setOtpCode('');
      setIsEditingPhone(false);
      setSmsEnabled(true);
      setSmsConsent(true);

      const updated = await api.getReminderStatus();
      setReminderStatus(updated);

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#0EA5E9', '#A78BFA'],
      });
    } catch (err) {
      setOtpError(err.message || 'Incorrect verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // 1-Click Opt-Out
  const handleOptOut = async () => {
    if (!window.confirm('Are you sure you want to opt out of daily wellbeing check-in SMS reminders? You can re-enable anytime.')) {
      return;
    }
    try {
      await api.optOutReminders();
      setSmsEnabled(false);
      setSmsConsent(false);
      const updated = await api.getReminderStatus();
      setReminderStatus(updated);
      alert('You have been successfully opted out of SMS reminders.');
      loadLogs();
    } catch (err) {
      alert('Error during opt-out: ' + err.message);
    }
  };

  // Save All Settings
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

      // Update SMS preferences if phone is verified
      if (reminderStatus?.phone_verified) {
        await api.updateReminderPreferences({
          sms_reminders_enabled: smsEnabled,
          reminder_time: smsTime,
          reminder_frequency: smsFrequency,
          timezone: smsTimezone,
          sms_consent_given: smsConsent,
        });
      }

      setIsSaved(true);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#0EA5E9', '#A78BFA', '#14B8A6'],
      });
      setTimeout(() => setIsSaved(false), 3500);

      const updatedReminders = await api.getReminderStatus();
      setReminderStatus(updatedReminders);
    } catch (err) {
      alert('Error updating settings: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-16 transition-colors duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-sky-50 via-purple-50 to-teal-50 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-sky-950/40 border border-sky-100/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
              <SettingsIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Sanctuary Settings & SMS Reminders
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Student Notifications & Privacy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Settings & Wellbeing Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
            Configure your mobile number, manage daily SMS check-in invitations, set preferred delivery windows, and manage reflection privacy.
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email Address (Primary Account)
                </label>
                {user?.email_verified ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Awaiting Verification
                  </span>
                )}
              </div>
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

        {/* ------------------------------------------------------------- */}
        {/* DEDICATED SECTION: Daily SMS Wellbeing Reminders */}
        {/* ------------------------------------------------------------- */}
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-sky-100 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-500" />
                <span>Daily SMS Check-in Reminders</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reliable, automated SMS reminders sent directly to your phone. Works even when your laptop or browser is closed.
              </p>
            </div>

            {reminderStatus?.provider_info && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                Gateway: {reminderStatus.provider_info.provider.toUpperCase()}
              </span>
            )}
          </div>

          {/* 1. Phone Ownership & Verification Sub-card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                  Mobile Number Status
                </span>
                {reminderStatus?.phone_number && !isEditingPhone ? (
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                      {reminderStatus.phone_masked || reminderStatus.phone_number}
                    </span>
                    {reminderStatus.phone_verified ? (
                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified via OTP
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {reminderStatus?.phone_number ? 'Update your registered mobile number below' : 'No mobile number linked. Add your phone number to receive daily SMS reminders.'}
                  </p>
                )}
              </div>

              {!isEditingPhone && reminderStatus?.phone_number && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPhone(true);
                    setOtpSent(false);
                    setOtpError(null);
                    setOtpNotice(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                >
                  Change Number
                </button>
              )}
            </div>

            {/* Phone Number Input Form (when editing or not set or unverified) */}
            {(isEditingPhone || !reminderStatus?.phone_number || !reminderStatus?.phone_verified) && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full sm:w-36 py-2 px-3 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="+91">🇮🇳 India (+91)</option>
                    <option value="+1">🇺🇸 USA / CA (+1)</option>
                    <option value="+44">🇬🇧 UK (+44)</option>
                    <option value="+61">🇦🇺 Australia (+61)</option>
                    <option value="+971">🇦🇪 UAE (+971)</option>
                    <option value="+65">🇸🇬 Singapore (+65)</option>
                    <option value="+49">🇩🇪 Germany (+49)</option>
                  </select>

                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 98765 43210"
                      className="w-full py-2 pl-9 pr-3 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    disabled={otpLoading || !phoneInput.trim()}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {otpLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{otpSent ? 'Resend OTP' : 'Send OTP Code'}</span>
                  </button>

                  {isEditingPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPhone(false);
                        setOtpSent(false);
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-500 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* OTP Verification Input Box */}
                {otpSent && (
                  <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-sky-900 dark:text-sky-200">
                        Enter 6-Digit Verification Code:
                      </label>
                      <span className="text-[10px] text-sky-600 dark:text-sky-300">Valid for 10 minutes</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength="6"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-40 tracking-widest text-center text-sm font-extrabold font-mono py-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />

                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={otpLoading || otpCode.length < 6}
                        className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {otpLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Verify & Activate</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Alerts */}
                {otpNotice && (
                  <p className="text-xs text-teal-700 dark:text-teal-300 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>{otpNotice}</span>
                  </p>
                )}

                {otpError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{otpError}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Reminder Configuration Controls (Active when verified) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Enable Daily Wellbeing SMS Reminders</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Sends a friendly daily check-in message encouraging you to log your emotional state.
                </p>
              </div>
              <input
                type="checkbox"
                checked={smsEnabled}
                disabled={!reminderStatus?.phone_verified}
                onChange={(e) => {
                  setSmsEnabled(e.target.checked);
                  if (e.target.checked) setSmsConsent(true);
                }}
                className="w-4 h-4 accent-sky-500 cursor-pointer disabled:opacity-40"
              />
            </div>

            {!reminderStatus?.phone_verified && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/60 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Verify your phone number above via OTP to activate SMS reminders.</span>
              </p>
            )}

            {/* Time, Frequency, and Timezone settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-500" />
                  <span>Reminder Time</span>
                </label>
                <input
                  type="time"
                  value={smsTime}
                  disabled={!smsEnabled}
                  onChange={(e) => setSmsTime(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-teal-500" />
                  <span>Frequency</span>
                </label>
                <select
                  value={smsFrequency}
                  disabled={!smsEnabled}
                  onChange={(e) => setSmsFrequency(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer disabled:opacity-50"
                >
                  <option value="daily">Every Day</option>
                  <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-indigo-500" />
                  <span>Local Timezone</span>
                </label>
                <select
                  value={smsTimezone}
                  disabled={!smsEnabled}
                  onChange={(e) => setSmsTimezone(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer disabled:opacity-50"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC">UTC (GMT +0:00)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Asia/Dubai">Dubai (GST +4:00)</option>
                </select>
              </div>
            </div>

            {/* Explicit Student Consent Checkbox */}
            <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="sms-consent"
                checked={smsConsent}
                disabled={!reminderStatus?.phone_verified}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-sky-500 cursor-pointer disabled:opacity-50"
              />
              <label htmlFor="sms-consent" className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer">
                <strong>Explicit Student Consent:</strong> I voluntarily consent to receive automated daily check-in invitations via SMS at my verified number. I understand I can easily reply <strong>STOP</strong> or opt out in Settings at any time with zero penalty.
              </label>
            </div>

            {/* Delivery History & Opt-Out Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadLogs}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Delivery History</span>
                </button>
              </div>

              {reminderStatus?.sms_reminders_enabled && (
                <button
                  type="button"
                  onClick={handleOptOut}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
                >
                  Revoke Consent / STOP
                </button>
              )}
            </div>

            {/* Delivery Logs Modal/Dropdown */}
            {showLogs && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 mt-3 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-sky-500" />
                    <span>Recent SMS Delivery Records</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLogs(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                  >
                    Close
                  </button>
                </div>

                {smsLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No SMS messages logged yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {smsLogs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wide text-[10px]">
                            {log.message_type.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            To: {log.phone_masked} • Provider: {log.provider}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === 'delivered' || log.status === 'sent' || log.status === 'simulated' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300' : 'bg-rose-50 text-rose-700'}`}>
                            {log.status.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Browser & Bedtime In-App Reminders */}
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>In-App & Browser Reminders</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Soft, in-browser notification prompts when the web tab is active.
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
