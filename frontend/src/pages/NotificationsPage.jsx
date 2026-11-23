import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Bot,
  HeartHandshake,
  Check,
  RefreshCw,
  Sliders,
  Send,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
  Radio,
  XCircle,
  PauseCircle,
  PlayCircle,
  MessageCircle,
  Phone,
  Shield,
  Terminal,
  Lock,
  UserCheck,
  Smile
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription
} from '../utils/pushNotifications';
import WeeklyReportModal from '../components/WeeklyReportModal';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function NotificationsPage({ onNavigate, onOpenCounsellor }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications', 'reports', 'settings'

  // Data states
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Weekly report modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Settings form states
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [preferredDays, setPreferredDays] = useState(DAYS_OF_WEEK);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [suddenChangeAlerts, setSuddenChangeAlerts] = useState(true);

  // Push notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testPushStatus, setTestPushStatus] = useState(null);

  // Proactive Follow-Up & Support Settings states
  const [followUpFrequencyDays, setFollowUpFrequencyDays] = useState(2);
  const [counsellorReferralEnabled, setCounsellorReferralEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(null);
  const [responseFeedback, setResponseFeedback] = useState({});
  const [respondingAlertId, setRespondingAlertId] = useState(null);

  // Dedicated Twilio WhatsApp Programmable Messaging states
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+91');
  const [whatsappPhone, setWhatsappPhone] = useState(user?.phone_number || '');
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [whatsappCategoryTest, setWhatsappCategoryTest] = useState('daily_reminder');
  const [waPreferences, setWaPreferences] = useState(null);
  const [waProviderStatus, setWaProviderStatus] = useState(null);
  const [waMessages, setWaMessages] = useState([]);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waTestSending, setWaTestSending] = useState(false);
  const [waTestResult, setWaTestResult] = useState(null);

  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadWhatsAppDetails = async () => {
    try {
      const [statusRes, prefRes, msgsRes] = await Promise.allSettled([
        api.getWhatsAppStatus(),
        api.getWhatsAppPreferences(),
        api.getWhatsAppMessages(20)
      ]);
      if (statusRes.status === 'fulfilled') setWaProviderStatus(statusRes.value);
      if (prefRes.status === 'fulfilled' && prefRes.value) {
        setWaPreferences(prefRes.value);
        setWhatsappEnabled(Boolean(prefRes.value.whatsapp_enabled));
        if (prefRes.value.whatsapp_country_code) {
          setWhatsappCountryCode(prefRes.value.whatsapp_country_code);
        }
        if (prefRes.value.whatsapp_phone) {
          setWhatsappPhone(prefRes.value.whatsapp_phone);
        }
        setWhatsappConsent(Boolean(prefRes.value.whatsapp_consent));
      }
      if (msgsRes.status === 'fulfilled') setWaMessages(msgsRes.value || []);
    } catch (e) {
      console.warn('WhatsApp metadata load note:', e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsData, alertsData, reportsData, prefsData, logsData] = await Promise.allSettled([
        api.getNotifications(50),
        api.getAnomalyAlerts(),
        api.getWeeklyReports(),
        api.getPreferences(),
        api.getNotificationLogs(20)
      ]);

      if (notifsData.status === 'fulfilled') setNotifications(notifsData.value || []);
      if (alertsData.status === 'fulfilled') setAlerts(alertsData.value || []);
      if (reportsData.status === 'fulfilled') setReports(reportsData.value || []);
      if (logsData.status === 'fulfilled') setLogs(logsData.value || []);

      if (prefsData.status === 'fulfilled' && prefsData.value) {
        const p = prefsData.value;
        setPreferences(p);
        setDailyReminder(p.daily_reminder_enabled);
        setReminderTime(p.reminder_time || '20:00');
        setPreferredDays(p.preferred_days || DAYS_OF_WEEK);
        setQuietStart(p.quiet_hours_start || '22:00');
        setQuietEnd(p.quiet_hours_end || '07:00');
        setWeeklySummary(p.weekly_summary_enabled);
        setSuddenChangeAlerts(p.sudden_change_alerts_enabled);
        setWhatsappEnabled(p.whatsapp_enabled);
        if (p.whatsapp_phone) {
          setWhatsappPhone(p.whatsapp_phone);
        }
        setWhatsappConsent(p.whatsapp_consent);
        setWhatsappStatus(p.whatsapp_status);
        setPushSubscribed(p.browser_push_enabled);
        setFollowUpFrequencyDays(p.follow_up_frequency_days || 2);
        setCounsellorReferralEnabled(p.counsellor_referral_enabled ?? true);
        setIsPaused(Boolean(p.is_paused));
        setPausedUntil(p.paused_until || null);
      }

      await loadWhatsAppDetails();

      // Check browser push support
      const supported = await isPushNotificationSupported();
      setPushSupported(supported);
      if (supported) {
        const existingSub = await getPushSubscription();
        if (existingSub) setPushSubscribed(true);
      }
    } catch (err) {
      console.error('Failed to load notifications page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.acknowledgeAnomalyAlert(alertId);
      setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, is_acknowledged: true } : a)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateFreshReport = async () => {
    try {
      setGeneratingReport(true);
      const newReport = await api.generateWeeklyReport();
      if (newReport) {
        setReports(prev => [newReport, ...prev.filter(r => r.id !== newReport.id)]);
        setSelectedReport(newReport);
      }
    } catch (err) {
      alert('Could not generate weekly report: ' + err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const toggleDay = (day) => {
    setPreferredDays(prev =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter(d => d !== day)
          : prev
        : [...prev, day]
    );
  };

  const handleTogglePush = async () => {
    try {
      setPushLoading(true);
      if (pushSubscribed) {
        await unsubscribeFromPushNotifications();
        setPushSubscribed(false);
        await api.updatePreferences({ browser_push_enabled: false });
      } else {
        await subscribeToPushNotifications();
        setPushSubscribed(true);
        await api.updatePreferences({ browser_push_enabled: true });
      }
    } catch (err) {
      alert('Browser Push Notification: ' + err.message);
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    try {
      setTestPushStatus('sending');
      const res = await api.testPushNotification();
      setTestPushStatus(`Delivered to ${res.push_devices_notified} browser endpoint(s) & in-app!`);
      loadData();
      setTimeout(() => setTestPushStatus(null), 4000);
    } catch (err) {
      setTestPushStatus('Error: ' + err.message);
    }
  };

  const handleRespondToAlert = async (alertId, responseText) => {
    try {
      setRespondingAlertId(alertId);
      const res = await api.respondToAnomalyAlert(alertId, responseText);
      setResponseFeedback(prev => ({ ...prev, [alertId]: res }));
      setAlerts(prev => prev.map(a => a.id === alertId ? {
        ...a,
        resolution_status: 'resolved_student_responded',
        student_response: responseText,
        is_acknowledged: true
      } : a));
    } catch (err) {
      alert('Error recording response: ' + err.message);
    } finally {
      setRespondingAlertId(null);
    }
  };

  const handlePauseNotifications = async (days = 7) => {
    try {
      const res = await api.pauseNotifications(days);
      setIsPaused(true);
      setPausedUntil(res.paused_until);
    } catch (err) {
      alert('Failed to pause: ' + err.message);
    }
  };

  const handleResumeNotifications = async () => {
    try {
      await api.resumeNotifications();
      setIsPaused(false);
      setPausedUntil(null);
    } catch (err) {
      alert('Failed to resume: ' + err.message);
    }
  };

  const handleConnectWhatsApp = async (e) => {
    if (e) e.preventDefault();
    if (!whatsappPhone || whatsappPhone.trim().length < 6) {
      alert('Please enter your personal WhatsApp mobile number.');
      return;
    }
    if (!whatsappConsent) {
      alert('Please check the opt-in consent box to authorize WhatsApp notifications.');
      return;
    }
    try {
      setWaConnecting(true);
      await api.connectWhatsApp({
        phone_number: whatsappPhone.trim(),
        country_code: whatsappCountryCode,
        consent: true
      });
      setWhatsappEnabled(true);
      await loadWhatsAppDetails();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Could not register WhatsApp number: ' + (err.message || 'Error'));
    } finally {
      setWaConnecting(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm('Disconnect your WhatsApp number and revoke all notification consents?')) return;
    try {
      setWaConnecting(true);
      await api.disconnectWhatsApp();
      setWhatsappEnabled(false);
      setWhatsappConsent(false);
      setWhatsappPhone('');
      await loadWhatsAppDetails();
    } catch (err) {
      alert('Failed to disconnect WhatsApp: ' + (err.message || 'Error'));
    } finally {
      setWaConnecting(false);
    }
  };

  const handleToggleWaConsent = async (field, value) => {
    try {
      const updated = await api.updateWhatsAppPreferences({ [field]: value });
      setWaPreferences(updated);
      if (field === 'whatsapp_enabled') {
        setWhatsappEnabled(Boolean(value));
      }
    } catch (err) {
      console.error('Failed to update consent:', err);
    }
  };

  const handleSendTestWaMessage = async () => {
    try {
      setWaTestSending(true);
      setWaTestResult(null);
      const targetPhone = whatsappPhone || waPreferences?.whatsapp_phone;
      const res = await api.sendTestWhatsAppMessage({
        phone_number: targetPhone,
        notification_category: whatsappCategoryTest
      });
      setWaTestResult(res);
      await loadWhatsAppDetails();
      setTimeout(() => setWaTestResult(null), 12000);
    } catch (err) {
      setWaTestResult({ success: false, error: err.message });
    } finally {
      setWaTestSending(false);
    }
  };

  const handleSavePreferences = async (e) => {
    if (e) e.preventDefault();
    try {
      await api.updatePreferences({
        daily_reminder_enabled: dailyReminder,
        reminder_time: reminderTime,
        preferred_days: preferredDays,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        weekly_summary_enabled: weeklySummary,
        sudden_change_alerts_enabled: suddenChangeAlerts,
        whatsapp_enabled: whatsappEnabled,
        whatsapp_phone: whatsappPhone,
        whatsapp_consent: whatsappConsent,
        counsellor_referral_enabled: counsellorReferralEnabled,
        follow_up_frequency_days: Number(followUpFrequencyDays),
        is_paused: isPaused,
        paused_until: pausedUntil
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save notification preferences: ' + err.message);
    }
  };

  const handleTalkToMindyAboutAlert = (alert) => {
    if (onNavigate) {
      try {
        sessionStorage.setItem('mindbridge_mindy_context', JSON.stringify({
          type: 'anomaly_alert',
          alert_type: alert.alert_type,
          metric: alert.metric_name,
          observed: alert.observed_value,
          baseline: alert.baseline_value,
          message: alert.supportive_message,
          context: alert.mindy_context
        }));
      } catch (e) {}
      onNavigate('ai');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const activeAlerts = alerts.filter(a => !a.is_acknowledged);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16 transition-colors duration-300">
      {/* Header Hub Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-sky-50 via-teal-50 to-indigo-50 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-teal-950/40 border border-sky-100/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Intelligent Wellbeing Monitoring</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Weekly Reports • Sudden-Change Detection • Configurable Reminders
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Wellbeing Notifications & Reports
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Your personalized campus monitoring sanctuary: celebrate gradual improvements, receive gentle pattern check-ins, and inspect your 7-day comparative wellbeing summaries.
          </p>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200/80 dark:border-slate-800">
        {[
          { id: 'notifications', label: 'Notifications & Alerts', icon: Bell, count: unreadCount + activeAlerts.length },
          { id: 'reports', label: 'Weekly Wellbeing Reports', icon: Calendar, count: reports.length },
          { id: 'settings', label: 'My Wellbeing Support Settings', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Notifications & Alerts */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Active Sudden-Change Anomaly Alerts */}
          {activeAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Gentle Pattern Check-Ins ({activeAlerts.length})
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">
                  Detected from your recent check-in rhythm
                </span>
              </div>

              <div className="space-y-3">
                {activeAlerts.map(alert => {
                  const isCelebration = alert.is_positive_celebration;
                  const isCompound = alert.is_compound;
                  const stage = alert.follow_up_stage || 1;
                  const feedback = responseFeedback[alert.id];

                  // Color scheme based on alert nature
                  const containerBg = isCelebration
                    ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-transparent dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border-emerald-300 dark:border-emerald-800'
                    : isCompound
                    ? 'bg-gradient-to-br from-purple-50/90 via-indigo-50/40 to-transparent dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border-purple-300 dark:border-purple-800'
                    : 'bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border-amber-200 dark:border-amber-900/60';

                  const badgeStyle = isCelebration
                    ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
                    : isCompound
                    ? 'text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
                    : 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800';

                  const stageLabel = stage === 1
                    ? 'Stage 1 • Gentle Observation'
                    : stage === 2
                    ? 'Stage 2 • Check-In Follow-Up'
                    : stage === 3
                    ? 'Stage 3 • Continued Support & Resources'
                    : 'Stage 4 • Campus Counsellor Referral';

                  return (
                    <div
                      key={alert.id}
                      className={`p-5 rounded-3xl border shadow-sm space-y-3 transition ${containerBg}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                              {isCelebration ? 'Progress Celebration 🌿' : isCompound ? 'Co-occurring Pattern ⚡' : `Pattern Observation: ${alert.metric_name}`}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {stageLabel}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(alert.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                            {alert.supportive_message}
                          </p>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            Why this triggered: {alert.trigger_reason}
                          </p>
                        </div>

                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1"
                          title="Acknowledge & dismiss"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Interactive 1-Tap Quick Responses */}
                      {!alert.student_response && alert.resolution_status === 'active' && !isCelebration && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Quick 1-Tap Check-In Response:
                            </span>
                            <span className="text-[10px] text-slate-400">Halts recurring follow-ups</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { text: "I'm doing fine", icon: "🌿", color: "hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300" },
                              { text: "I've been stressed about placements", icon: "💼", color: "hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300" },
                              { text: "I'm having trouble sleeping", icon: "🌙", color: "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300" },
                              { text: "I'd like some advice", icon: "💡", color: "hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300" },
                              { text: "I'd like to speak with a counsellor", icon: "🩺", color: "hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300" }
                            ].map(opt => (
                              <button
                                key={opt.text}
                                disabled={respondingAlertId === alert.id}
                                onClick={() => handleRespondToAlert(alert.id, opt.text)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${opt.color}`}
                              >
                                <span>{opt.icon}</span>
                                <span>{opt.text}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Immediate Feedback Banner after Response */}
                      {feedback && (
                        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 space-y-2 text-xs animate-fade-in">
                          <p className="text-sky-900 dark:text-sky-200 font-semibold leading-relaxed">
                            {feedback.guidance_message}
                          </p>
                          {feedback.mindy_prompt && (
                            <button
                              onClick={() => {
                                try {
                                  sessionStorage.setItem('mindbridge_mindy_context', JSON.stringify({
                                    type: 'student_response_continuation',
                                    prompt: feedback.mindy_prompt,
                                    context: alert.mindy_context
                                  }));
                                } catch (e) {}
                                if (onNavigate) onNavigate('ai');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <Bot className="w-3.5 h-3.5" /> Continue with Mindy AI
                            </button>
                          )}
                          {feedback.action_route === '/counsellors' && onOpenCounsellor && (
                            <button
                              onClick={onOpenCounsellor}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <HeartHandshake className="w-3.5 h-3.5" /> Request Appointment with Dr. Nitu Singh Bhadouria
                            </button>
                          )}
                        </div>
                      )}

                      {/* Display Stored Response if already answered */}
                      {alert.student_response && !feedback && (
                        <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">You replied: "{alert.student_response}"</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Follow-up resolved
                          </span>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                        <button
                          onClick={() => handleTalkToMindyAboutAlert(alert)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Bot className="w-3.5 h-3.5" /> Talk to Mindy about this
                        </button>

                        <button
                          onClick={onOpenCounsellor}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <HeartHandshake className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Connect with Counsellor
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* In-App Notifications Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-500" />
                <span>All In-App Notifications ({notifications.length})</span>
              </h2>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all as read
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="font-bold text-slate-700 dark:text-slate-300">You're completely caught up!</p>
                <p className="mt-0.5">Daily reflection reminders and weekly wellbeing summaries will appear here.</p>
              </div>
            ) : (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) handleMarkRead(n.id);
                      if (n.link && onNavigate) onNavigate(n.link.replace('/', ''));
                    }}
                    className={`p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                      !n.is_read ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {new Date(n.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={(e) => handleMarkRead(n.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Weekly Wellbeing Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Your 7-Day Wellbeing Summaries</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparative analysis generated exclusively from your actual check-in records.
              </p>
            </div>

            <button
              onClick={handleGenerateFreshReport}
              disabled={generatingReport}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generatingReport ? 'animate-spin' : ''}`} />
              <span>{generatingReport ? 'Analyzing Trends...' : 'Generate Latest Summary'}</span>
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-400 opacity-40" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No Weekly Reports Found</p>
              <p>Log at least 3 daily check-ins this week, then click "Generate Latest Summary" above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map(rep => (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition cursor-pointer shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                        {rep.week_start} – {rep.week_end}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {rep.total_checkins_current_week} Check-ins
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed line-clamp-2">
                      {rep.summary_message}
                    </p>

                    {rep.is_sufficient_data && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Stress</span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">{rep.avg_stress}/10</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Sleep</span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">{rep.avg_sleep_hours}h</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Energy</span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">{rep.avg_energy}/10</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                    <span>View Full Report</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: My Wellbeing Support Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
          {/* Pause / Resume Wellbeing Notifications */}
          <div className={`p-6 sm:p-7 rounded-3xl border shadow-xs space-y-4 transition-colors ${
            isPaused
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {isPaused ? (
                      <PauseCircle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <PlayCircle className="w-5 h-5 text-emerald-500" />
                    )}
                    <span>Notification & Monitoring Status</span>
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    isPaused
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {isPaused ? 'Currently Paused' : 'Active & Monitoring'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                  {isPaused ? (
                    <>
                      All check-in reminders and proactive follow-ups are temporarily muted{pausedUntil ? ` until ${new Date(pausedUntil).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}. You can resume anytime whenever you wish.
                    </>
                  ) : (
                    'Need quiet time during study sessions or holidays? You can temporarily pause all automated reminders and proactive follow-ups without affecting your check-in logs or dashboard data.'
                  )}
                </p>
              </div>

              <div>
                {isPaused ? (
                  <button
                    type="button"
                    onClick={handleResumeNotifications}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Resume Notifications</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePauseNotifications(7)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-300 dark:border-slate-700 active:scale-95"
                  >
                    <PauseCircle className="w-4 h-4 text-amber-500" />
                    <span>Pause for 7 Days</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Daily Reminders Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>Daily Check-in Reminders</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prompts you only if you haven't completed your daily check-in yet.
                </p>
              </div>

              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => setDailyReminder(e.target.checked)}
                className="w-5 h-5 accent-sky-500 cursor-pointer"
              />
            </div>

            {dailyReminder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Preferred Reminder Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full text-xs font-bold px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Quiet Hours (No Notifications Sent)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      title="Quiet hours start"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      title="Quiet hours end"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Preferred Notification Days
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map(day => {
                      const isSelected = preferredDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Automated Monitoring Triggers Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-500" />
                <span>Intelligent Trend Triggers</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated weekly synthesis and baseline-driven change alerts.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Weekly Wellbeing Summary Reports</p>
                  <p className="text-[11px] text-slate-400">Receive a supportive 7-day comparative overview every weekend</p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklySummary}
                  onChange={(e) => setWeeklySummary(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Sudden-Change & Anomaly Alerts</p>
                  <p className="text-[11px] text-slate-400">Receive a gentle check-in when stress spikes or sleep duration drops significantly</p>
                </div>
                <input
                  type="checkbox"
                  checked={suddenChangeAlerts}
                  onChange={(e) => setSuddenChangeAlerts(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Proactive Follow-Up & Support Escalation Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-indigo-500" />
                <span>Proactive Follow-Up & Counsellor Referral</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure gradual follow-up frequency and confidential campus counsellor connection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Follow-Up Frequency
                </label>
                <select
                  value={followUpFrequencyDays}
                  onChange={(e) => setFollowUpFrequencyDays(Number(e.target.value))}
                  className="w-full text-xs font-bold px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={1}>Every 1 Day (Frequent check-ins)</option>
                  <option value={2}>Every 2 Days (Recommended default)</option>
                  <option value={3}>Every 3 Days (Relaxed pace)</option>
                  <option value={5}>Every 5 Days (Minimal follow-ups)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Interval between progressive follow-up check-ins (Stages 1 through 4) when wellbeing indicators remain elevated.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Counsellor Referral Option (Stage 4)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Allow MindBridge to offer direct confidential appointment booking with campus counsellor <strong>Dr. Nitu Singh Bhadouria</strong> in SAC I if stress or sleep concerns persist across 4–5 check-ins.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={counsellorReferralEnabled}
                    onChange={(e) => setCounsellorReferralEnabled(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer shrink-0 mt-0.5"
                  />
                </div>
                <div className="mt-2 text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-lg">
                  Strictly opt-in & confidential: Unanswered alerts are never reported to counsellors.
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Channels: Browser Push (Free) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Free Browser Push Notifications
                  </h3>
                  <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    100% Free • Standard Web Push
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Receive notifications directly on your desktop or mobile browser without opening the tab.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTogglePush}
                disabled={pushLoading || !pushSupported}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  pushSubscribed
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                {pushLoading ? (
                  <span>Configuring...</span>
                ) : pushSubscribed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Push Active
                  </>
                ) : (
                  <span>Enable Push</span>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
              <p>
                • <strong>Privacy on Lock Screen:</strong> Push notifications display generic privacy-preserving messages ("MindBridge Wellbeing Check-in") without exposing private notes or stress scores.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSendTestPush}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Send Test Notification
                </button>
                {testPushStatus && (
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 animate-fade-in">
                    {testPushStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Channels: WhatsApp (Twilio Programmable Messaging) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-600" />

            {/* Header with Provider Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>WhatsApp Notifications</span>
                      <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-300 dark:border-teal-800">
                        Twilio Programmable Messaging
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Genuine notifications delivered directly to your personal WhatsApp number. Notifications only.
                    </p>
                  </div>
                </div>
              </div>

              {/* Twilio Mode Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  waProviderStatus?.mode === 'production'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : waProviderStatus?.mode === 'sandbox'
                      ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    waProviderStatus?.is_configured
                      ? waProviderStatus?.mode === 'production' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                      : 'bg-slate-400'
                  }`} />
                  <span>
                    {waProviderStatus?.mode === 'production'
                      ? 'Twilio Production Active'
                      : waProviderStatus?.mode === 'sandbox'
                        ? 'Twilio Sandbox Testing'
                        : 'Twilio Setup Required'}
                  </span>
                </span>
              </div>
            </div>

            {/* Twilio Sandbox Setup Instructions (Shown when in Sandbox Mode) */}
            {waProviderStatus?.mode === 'sandbox' && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Twilio Sandbox 1-Time Join Requirement</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                    Testing Mode
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  During sandbox testing, WhatsApp security requires your number to send a 1-time message to the Twilio Sandbox sender before it can receive notifications:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-mono font-bold bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700">
                    Text <strong>join {waProviderStatus?.sandbox_keyword || 'mindbridge'}</strong> to <strong>+1 415 523 8886</strong>
                  </span>
                  <a
                    href={waProviderStatus?.sandbox_join_url || `https://wa.me/14155238886?text=join%20${waProviderStatus?.sandbox_keyword || 'mindbridge'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                  >
                    <span>1-Click Join on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Account Registration & Connection Status */}
            {(waPreferences?.whatsapp_phone || (whatsappEnabled && whatsappPhone)) ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                      waPreferences?.whatsapp_verified
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}>
                      {waPreferences?.whatsapp_verified ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Registered Number:
                        </span>
                        <span className="font-mono text-xs font-bold bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                          {waPreferences?.whatsapp_phone || whatsappPhone}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          waPreferences?.whatsapp_verified
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {waPreferences?.whatsapp_verified
                            ? 'Verified & Active'
                            : 'Pending Delivery Verification'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {waPreferences?.whatsapp_verified
                          ? 'Real Twilio delivery has been confirmed. Scheduled wellbeing and academic updates are active.'
                          : 'Number is registered. Complete verification by sending a test notification below or await your first delivery.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer mr-2">
                      <input
                        type="checkbox"
                        checked={Boolean(waPreferences?.whatsapp_enabled ?? whatsappEnabled)}
                        onChange={(e) => handleToggleWaConsent('whatsapp_enabled', e.target.checked)}
                        className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                      />
                      <span>Notifications Active</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDisconnectWhatsApp}
                      disabled={waConnecting}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95"
                    >
                      {waConnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                </div>

                {/* Delivery Health Diagnostic */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Delivery Status</span>
                    <span className={`font-mono text-xs font-bold capitalize ${
                      waPreferences?.whatsapp_last_delivery_status === 'delivered'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : waPreferences?.whatsapp_last_delivery_status === 'sent' || waPreferences?.whatsapp_last_delivery_status === 'queued'
                          ? 'text-sky-600 dark:text-sky-400'
                          : waPreferences?.whatsapp_last_delivery_status === 'failed' || waPreferences?.whatsapp_last_delivery_status === 'undelivered'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-500'
                    }`}>
                      {waPreferences?.whatsapp_last_delivery_status || 'None Yet'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Delivery Time</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {waPreferences?.whatsapp_last_delivery_at
                        ? new Date(waPreferences.whatsapp_last_delivery_at).toLocaleString()
                        : 'No deliveries recorded'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Consent Timestamp</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {waPreferences?.whatsapp_consent_at
                        ? new Date(waPreferences.whatsapp_consent_at).toLocaleDateString()
                        : 'Consent Recorded'}
                    </span>
                  </div>
                </div>

                {waPreferences?.whatsapp_last_error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Twilio Notice:</strong> {waPreferences.whatsapp_last_error}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Register Personal WhatsApp Number
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter your active WhatsApp number to receive genuine wellbeing check-in reminders and weekly reports.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Country Code
                    </label>
                    <select
                      value={whatsappCountryCode}
                      onChange={(e) => setWhatsappCountryCode(e.target.value)}
                      className="w-full text-xs font-bold py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="+91">India (+91)</option>
                      <option value="+1">USA / Canada (+1)</option>
                      <option value="+44">UK (+44)</option>
                      <option value="+61">Australia (+61)</option>
                      <option value="+971">UAE (+971)</option>
                      <option value="+65">Singapore (+65)</option>
                      <option value="+49">Germany (+49)</option>
                      <option value="+33">France (+33)</option>
                      <option value="+81">Japan (+81)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Personal Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        placeholder="9876543210 (or E.164)"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        className="w-full text-xs font-mono pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleConnectWhatsApp}
                      disabled={waConnecting || !whatsappPhone || !whatsappConsent}
                      className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{waConnecting ? 'Registering...' : 'Register Number'}</span>
                    </button>
                  </div>
                </div>

                {/* Explicit Opt-in Consent Checkbox */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="wa-explicit-consent-box"
                    checked={whatsappConsent}
                    onChange={(e) => setWhatsappConsent(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-teal-600 rounded cursor-pointer shrink-0"
                  />
                  <label htmlFor="wa-explicit-consent-box" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer select-none">
                    <strong>Explicit Opt-In:</strong> I authorize MindBridge Campus to deliver personal student wellbeing notifications, daily check-in reminders, and academic updates to my WhatsApp number via Twilio. I understand I can reply <strong>STOP</strong> at any time to opt out or disconnect my number from settings.
                  </label>
                </div>
              </div>
            )}

            {/* Granular Notification Category Consents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Notification Category Preferences
                </h4>
                <span className="text-[10px] text-slate-400">Choose which categories to receive on WhatsApp</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Daily Check-in */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      <span>Daily Check-in Reminders</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Gentle prompt to record daily mood, stress, and sleep.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_reminders_consent : true}
                    onChange={(e) => handleToggleWaConsent('whatsapp_reminders_consent', e.target.checked)}
                    className="w-4 h-4 accent-teal-600 cursor-pointer mt-0.5"
                  />
                </div>

                {/* 2. Sudden Change & Wellbeing Alerts */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Wellbeing & Stress Alerts</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Supportive notification when stress increases or sleep drops sharply.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_alerts_consent : true}
                    onChange={(e) => handleToggleWaConsent('whatsapp_alerts_consent', e.target.checked)}
                    className="w-4 h-4 accent-teal-600 cursor-pointer mt-0.5"
                  />
                </div>

                {/* 3. Weekly Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-500" />
                      <span>Weekly Wellbeing Summaries</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      7-day comparative review of Stress Balance % and Sleep Consistency.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_weekly_summary_consent : true}
                    onChange={(e) => handleToggleWaConsent('whatsapp_weekly_summary_consent', e.target.checked)}
                    className="w-4 h-4 accent-teal-600 cursor-pointer mt-0.5"
                  />
                </div>

                {/* 4. Academic & Placement Reminders */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Academic & Placement Reminders</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Timely notifications for upcoming exams, study blocks, and placement prep.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_academic_consent : true}
                    onChange={(e) => handleToggleWaConsent('whatsapp_academic_consent', e.target.checked)}
                    className="w-4 h-4 accent-teal-600 cursor-pointer mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Real Outbound Test Dispatcher */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Send Real Test Notification
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dispatches a genuine WhatsApp message generated from your actual profile records.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={whatsappCategoryTest}
                    onChange={(e) => setWhatsappCategoryTest(e.target.value)}
                    className="text-xs font-bold py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="daily_reminder">Daily Check-in Reminder</option>
                    <option value="weekly_summary">Weekly Wellbeing Summary</option>
                    <option value="wellbeing_alert">Wellbeing / Stress Alert</option>
                    <option value="academic_reminder">Academic & Placement Reminder</option>
                    <option value="test">General Live Test</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleSendTestWaMessage}
                    disabled={waTestSending || (!whatsappPhone && !waPreferences?.whatsapp_phone)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{waTestSending ? 'Dispatching...' : 'Send Test'}</span>
                  </button>
                </div>
              </div>

              {waTestResult && (
                <div className={`p-3.5 rounded-xl text-xs space-y-1 ${
                  waTestResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {waTestResult.success
                        ? `✓ Dispatched via Twilio! Status: ${waTestResult.status}`
                        : `✗ Twilio Dispatch Failed`}
                    </span>
                    {waTestResult.twilio_sid && (
                      <span className="font-mono text-[10px]">SID: {waTestResult.twilio_sid}</span>
                    )}
                  </div>
                  {waTestResult.body_preview && (
                    <p className="text-[11px] font-mono whitespace-pre-line text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
                      {waTestResult.body_preview}
                    </p>
                  )}
                  {waTestResult.error && (
                    <p className="text-[11px] leading-relaxed">
                      {waTestResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Outbound Notification History Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span>Outbound WhatsApp Notification History ({waMessages.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={loadWhatsAppDetails}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Delivery Logs</span>
                </button>
              </div>

              {waMessages.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500">
                  No notifications logged yet. Dispatches will appear here with honest Twilio delivery statuses.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1">
                  {waMessages.map(msg => (
                    <div key={msg.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5 max-w-[75%]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            {msg.phone_number}
                          </span>
                          {msg.conversation_context && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {msg.conversation_context}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                          {msg.body}
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className={`inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          msg.status === 'delivered'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : msg.status === 'sent' || msg.status === 'queued'
                              ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        }`}>
                          {msg.status}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy & Compliance Terms */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Privacy Protection & Messaging Compliance</span>
              </div>
              <p>
                • <strong>Notifications Only:</strong> Twilio Programmable Messaging handles outbound wellbeing notifications only. Mindy AI remains accessible through the web app.
              </p>
              <p>
                • <strong>Student Privacy:</strong> Private journal entries and sensitive counsellor chats are never transmitted over WhatsApp. All messages use supportive, non-diagnostic terminology.
              </p>
              <p>
                • <strong>Opt-Out Anytime:</strong> Reply <strong>STOP</strong> at any time to immediately disable notifications and revoke consent.
              </p>
            </div>
          </div>

          {/* Delivery Logs */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Recent Delivery Logs ({logs.length})</span>
            </h3>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-400">No delivery logs recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {logs.map(log => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{log.title}</span>
                      <span className="text-[10px] text-slate-400 ml-2">via {log.channel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === 'sent'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Bar */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {saveSuccess && (
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 animate-fade-in flex items-center gap-1">
                  <Check className="w-4 h-4" /> Preferences Saved Successfully!
                </span>
              )}
            </div>

            <button
              type="submit"
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition active:scale-95 cursor-pointer"
            >
              Save Notification Preferences ✨
            </button>
          </div>
        </form>
      )}

      {/* Weekly Report Viewer Modal */}
      {selectedReport && (
        <WeeklyReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
