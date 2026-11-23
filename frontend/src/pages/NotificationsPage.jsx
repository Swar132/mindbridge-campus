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

  // Dedicated Meta WhatsApp Business Cloud API & Mindy states
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(user?.phone_number || '');
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [waPreferences, setWaPreferences] = useState(null);
  const [waProviderStatus, setWaProviderStatus] = useState(null);
  const [waMessages, setWaMessages] = useState([]);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waTestSending, setWaTestSending] = useState(false);
  const [waTestResult, setWaTestResult] = useState(null);
  const [waSimulatorInput, setWaSimulatorInput] = useState('');
  const [waSimulatorSending, setWaSimulatorSending] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

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
    if (!whatsappPhone || whatsappPhone.trim().length < 8) {
      alert('Please enter a valid phone number with country code, e.g. +919876543210');
      return;
    }
    try {
      setWaConnecting(true);
      await api.connectWhatsApp({
        phone_number: whatsappPhone.trim(),
        consent: true
      });
      setWhatsappEnabled(true);
      setWhatsappConsent(true);
      await loadWhatsAppDetails();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Could not connect WhatsApp: ' + (err.message || 'Error'));
    } finally {
      setWaConnecting(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm('Disconnect your WhatsApp number and revoke all messaging consents?')) return;
    try {
      setWaConnecting(true);
      await api.disconnectWhatsApp();
      setWhatsappEnabled(false);
      setWhatsappConsent(false);
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
    } catch (err) {
      console.error('Failed to update consent:', err);
    }
  };

  const handleSendTestWaMessage = async (type = 'interactive_buttons') => {
    try {
      setWaTestSending(true);
      setWaTestResult(null);
      const res = await api.sendTestWhatsAppMessage({
        phone_number: whatsappPhone || user?.phone_number || '+919876543210',
        message_type: type
      });
      setWaTestResult(res);
      await loadWhatsAppDetails();
      setTimeout(() => setWaTestResult(null), 8000);
    } catch (err) {
      setWaTestResult({ success: false, error: err.message });
    } finally {
      setWaTestSending(false);
    }
  };

  const handleSimulateInbound = async (text, buttonId = null, buttonTitle = null) => {
    try {
      setWaSimulatorSending(true);
      const payload = buttonId
        ? {
            phone_number: whatsappPhone || user?.phone_number || '+919876543210',
            message_type: 'button_reply',
            button_id: buttonId,
            button_title: buttonTitle || buttonId
          }
        : {
            phone_number: whatsappPhone || user?.phone_number || '+919876543210',
            message_type: 'text',
            text: text || 'Hello Mindy!'
          };
      await api.simulateIncomingWhatsApp(payload);
      setWaSimulatorInput('');
      await loadWhatsAppDetails();
    } catch (err) {
      alert('Simulation error: ' + (err.message || 'Error'));
    } finally {
      setWaSimulatorSending(false);
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

          {/* Delivery Channels: WhatsApp (Official Meta Business Cloud API & Mindy Companion) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs space-y-6 relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>WhatsApp Notifications & Mindy AI</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                        Official Meta Cloud API
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Receive reminders, weekly reports, anomaly alerts, and talk with Mindy directly on WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  waProviderStatus?.is_active
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${waProviderStatus?.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`} />
                  <span>{waProviderStatus?.is_active ? 'Meta API Connected (Live)' : 'Interactive Simulator Active'}</span>
                </span>
              </div>
            </div>

            {/* Account Connection Card */}
            {(waPreferences?.is_connected || (whatsappEnabled && whatsappPhone)) ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/30 dark:border-emerald-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>Connected WhatsApp Account:</span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                          {waPreferences?.whatsapp_phone || whatsappPhone}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Opt-in verified • 1-tap interactive buttons & Mindy conversational chat enabled
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendTestWaMessage('interactive_buttons')}
                      disabled={waTestSending}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{waTestSending ? 'Sending Test...' : 'Send Test Notification'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectWhatsApp}
                      disabled={waConnecting}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                {waTestResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                    waTestResult.success
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    <span>
                      {waTestResult.success
                        ? `✓ WhatsApp interactive message dispatched! Message ID: ${waTestResult.wa_message_id}`
                        : `✗ Test dispatch notice: ${waTestResult.error || 'Check credentials'}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSimulator(true)}
                      className="text-[11px] font-bold underline cursor-pointer"
                    >
                      View in Simulator →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      WhatsApp Phone Number (E.164 with country code)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        placeholder="+919876543210"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        className="w-full text-xs font-mono pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleConnectWhatsApp}
                      disabled={waConnecting || !whatsappPhone}
                      className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{waConnecting ? 'Connecting...' : 'Connect WhatsApp Account'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    By connecting your number, you opt in to receive student wellbeing reminders and support from MindBridge Campus. You can reply <strong>STOP</strong> at any time on WhatsApp to immediately opt out, or <strong>HELP</strong> for crisis helplines.
                  </span>
                </div>
              </div>
            )}

            {/* Granular Category Consents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Granular Notification Category Consents
                </h4>
                <span className="text-[10px] text-slate-400">You decide what messages reach your WhatsApp</span>
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
                      Gentle evening reminder with 1-tap mood logging buttons.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_reminders_consent : dailyReminder}
                    onChange={(e) => handleToggleWaConsent('whatsapp_reminders_consent', e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer mt-0.5"
                  />
                </div>

                {/* 2. Weekly Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-500" />
                      <span>Weekly Wellbeing Summaries</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      7-day comparative overview of stress, sleep, and mood trends.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_weekly_summary_consent : weeklySummary}
                    onChange={(e) => handleToggleWaConsent('whatsapp_weekly_summary_consent', e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer mt-0.5"
                  />
                </div>

                {/* 3. Anomaly & Sudden Change Alerts */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Sudden Change & Trend Alerts</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Empathetic check-in when stress spikes or sleep drops sharply.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_alerts_consent : suddenChangeAlerts}
                    onChange={(e) => handleToggleWaConsent('whatsapp_alerts_consent', e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer mt-0.5"
                  />
                </div>

                {/* 4. Proactive Multi-Stage Follow-ups */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Proactive Follow-Ups (Stages 1–4)</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Gradual check-ins every {followUpFrequencyDays} days if stress remains elevated.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_followup_consent : true}
                    onChange={(e) => handleToggleWaConsent('whatsapp_followup_consent', e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer mt-0.5"
                  />
                </div>

                {/* 5. Campus Counsellor Referral & Confirmation */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                      <span>Campus Counsellor Notifications</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Direct priority referrals for Dr. Nitu Singh Bhadouria in SAC I.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_counsellor_consent : counsellorReferralEnabled}
                    onChange={(e) => handleToggleWaConsent('whatsapp_counsellor_consent', e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer mt-0.5"
                  />
                </div>

                {/* 6. Mindy AI Interactive Chat */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Mindy AI Direct Chat on WhatsApp</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Message Mindy anytime for CBT reflections & placement prep.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waPreferences ? waPreferences.whatsapp_mindy_consent : true}
                    onChange={(e) => handleToggleWaConsent('whatsapp_mindy_consent', e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Interactive WhatsApp Simulator Drawer */}
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowSimulator(!showSimulator)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <span>{showSimulator ? 'Hide WhatsApp Simulator' : 'Open WhatsApp Live Simulator & Chat Preview'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    {waMessages.length} message(s)
                  </span>
                </button>

                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Simulate incoming student WhatsApp messages and button taps
                </span>
              </div>

              {showSimulator && (
                <div className="mt-4 rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6 text-white shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                        🌿
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Mindy AI • MindBridge Campus</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <p className="text-[10px] text-slate-400">Official WhatsApp Business Account • Always Active</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={loadWhatsAppDetails}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                      title="Refresh WhatsApp message history"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* WhatsApp Messages Feed */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {waMessages.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        No WhatsApp messages logged yet. Tap a button below or send a message to start!
                      </div>
                    ) : (
                      waMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                            msg.direction === 'inbound'
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                          }`}>
                            <p className="whitespace-pre-line leading-relaxed">{msg.body}</p>
                            <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                              msg.direction === 'inbound' ? 'text-emerald-200' : 'text-slate-400'
                            }`}>
                              <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {msg.direction === 'outbound' && (
                                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400">
                                  ✓ {msg.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick-Reply Simulation Buttons */}
                  <div className="border-t border-slate-800 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Simulate 1-Tap Student Button Replies:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={waSimulatorSending}
                        onClick={() => handleSimulateInbound('', 'checkin_start', 'Log Check-in 🌿')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Log Check-in 🌿
                      </button>
                      <button
                        type="button"
                        disabled={waSimulatorSending}
                        onClick={() => handleSimulateInbound('', 'checkin_mood_great', 'Great 😊')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 border border-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Mood: Great 😊
                      </button>
                      <button
                        type="button"
                        disabled={waSimulatorSending}
                        onClick={() => handleSimulateInbound('', 'anomaly_doing_fine', 'Doing Fine 👍')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-300 border border-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Doing Fine 👍
                      </button>
                      <button
                        type="button"
                        disabled={waSimulatorSending}
                        onClick={() => handleSimulateInbound('', 'anomaly_placements', 'Placement Stress')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 border border-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Placement Stress 💼
                      </button>
                      <button
                        type="button"
                        disabled={waSimulatorSending}
                        onClick={() => handleSimulateInbound('', 'anomaly_sleep', 'Trouble Sleeping')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300 border border-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Trouble Sleeping 🌙
                      </button>
                      <button
                        type="button"
                        disabled={waSimulatorSending}
                        onClick={() => handleSimulateInbound('', 'anomaly_counsellor', 'Campus Counsellor 🤝')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-teal-300 border border-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Campus Counsellor 🤝
                      </button>
                      <button
                        type="button"
                        disabled={waSimulatorSending}
                        onClick={() => handleSimulateInbound('HELP')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Send 'HELP' 🆘
                      </button>
                      <button
                        type="button"
                        disabled={waSimulatorSending}
                        onClick={() => handleSimulateInbound('STOP')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-300 border border-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Send 'STOP' 🛑
                      </button>
                    </div>
                  </div>

                  {/* Freeform WhatsApp Message Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (waSimulatorInput.trim()) {
                        handleSimulateInbound(waSimulatorInput.trim());
                      }
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      placeholder="Type a WhatsApp message to Mindy (e.g. 'I feel anxious about tomorrow')..."
                      value={waSimulatorInput}
                      onChange={(e) => setWaSimulatorInput(e.target.value)}
                      disabled={waSimulatorSending}
                      className="flex-1 text-xs px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={waSimulatorSending || !waSimulatorInput.trim()}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{waSimulatorSending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Official Meta Free Tier & Privacy Disclosures */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero-Cost Guarantee & Meta Compliance Terms</span>
              </div>
              <p>
                • <strong>1,000 Free Conversations / Month:</strong> Meta provides 1,000 free service (student-initiated) conversations each month. When you reply, a 24-hour customer service window opens with zero messaging costs.
              </p>
              <p>
                • <strong>Confidentiality:</strong> Wellbeing check-ins, sleep scores, and Mindy chat transcripts are strictly end-to-end encrypted in transit and never shared with advertisers or third parties.
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
