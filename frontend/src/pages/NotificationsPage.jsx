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
  XCircle
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

  // WhatsApp state
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(user?.phone_number || '');
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState(null);

  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        setWhatsappPhone(p.whatsapp_phone || user?.phone_number || '');
        setWhatsappConsent(p.whatsapp_consent);
        setWhatsappStatus(p.whatsapp_status);
        setPushSubscribed(p.browser_push_enabled);
      }

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
        whatsapp_consent: whatsappConsent
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
          { id: 'settings', label: 'Wellbeing Notification Settings', icon: Sliders }
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
                {activeAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            Pattern Observation: {alert.metric_name}
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
                        title="Dismiss alert"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
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
                ))}
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

      {/* TAB 3: Wellbeing Notification Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
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

          {/* Delivery Channels: WhatsApp (Official Meta Cloud API) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  WhatsApp Notifications (Official Meta Cloud API)
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  Optional Provider
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official, compliant Meta Business API integration. Unofficial scrapers and browser bots are strictly forbidden.
              </p>
            </div>

            {/* Official Meta Status Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Meta WhatsApp Cloud API Status:
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {whatsappStatus?.status === 'active' ? 'Active & Connected' : 'Safely Disabled (Zero Cost)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                To guarantee zero unexpected charges for students, official WhatsApp message delivery remains safely inactive until university administrators configure Meta Developer credentials in the environment. Free in-app and browser push notifications remain 100% operational.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  WhatsApp Phone Number (E.164 e.g. +919876543210)
                </label>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full text-xs font-mono px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="whatsapp-consent"
                  checked={whatsappConsent}
                  onChange={(e) => {
                    setWhatsappConsent(e.target.checked);
                    if (!e.target.checked) setWhatsappEnabled(false);
                  }}
                  className="w-4 h-4 accent-sky-500 mt-0.5 cursor-pointer"
                />
                <label htmlFor="whatsapp-consent" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  I give explicit consent for MindBridge Campus to send me automated wellbeing check-in reminders and weekly reports on WhatsApp via the official Meta Cloud API. I understand I can revoke this consent at any time.
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enable WhatsApp Channel
                </span>
                <input
                  type="checkbox"
                  disabled={!whatsappConsent || !whatsappPhone}
                  checked={whatsappEnabled && whatsappConsent}
                  onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 cursor-pointer disabled:opacity-40"
                />
              </div>
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
