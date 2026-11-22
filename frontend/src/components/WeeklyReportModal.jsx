import React from 'react';
import {
  X,
  Calendar,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  Moon,
  Zap,
  Smile,
  ShieldCheck,
  Bot,
  HeartHandshake,
  ArrowRight,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function WeeklyReportModal({ report, onClose, onNavigate }) {
  if (!report) return null;

  const isSufficient = report.is_sufficient_data;
  const feedbackList = Array.isArray(report.supportive_feedback)
    ? report.supportive_feedback
    : [];

  const handleTalkToMindy = () => {
    onClose();
    if (onNavigate) {
      // Store context for Mindy AI to pick up
      const contextObj = {
        type: 'weekly_report',
        week: `${report.week_start} to ${report.week_end}`,
        avg_stress: report.avg_stress,
        stress_trend: report.stress_trend,
        avg_sleep: report.avg_sleep_hours,
        sleep_trend: report.sleep_trend,
        dominant_mood: report.dominant_mood,
        top_domain: report.top_stress_domain
      };
      try {
        sessionStorage.setItem('mindbridge_mindy_context', JSON.stringify(contextObj));
      } catch (e) {}
      onNavigate('ai');
    }
  };

  const handleOpenCounsellor = () => {
    onClose();
    if (onNavigate) {
      onNavigate('counsellors');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden relative animate-scale-up">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 sticky top-0 z-20 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{report.week_start} – {report.week_end}</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isSufficient
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {report.total_checkins_current_week} Check-ins Logged
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
              Weekly Wellbeing Summary
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
          
          {/* Summary Overview Banner */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-sky-50 via-teal-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-teal-950/30 border border-sky-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-800 dark:text-sky-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Personalized Synthesis</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
              {report.summary_message}
            </p>
          </div>

          {/* 4 Metric Comparison Cards (If Sufficient Data) */}
          {isSufficient ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Stress Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stress Level</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">{report.avg_stress}</span>
                  <span className="text-[10px] text-slate-400">/ 10</span>
                </div>
                <div className="text-[10px] font-bold flex items-center gap-1 pt-1">
                  {report.stress_trend === 'improved' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" /> Decreased
                    </span>
                  ) : report.stress_trend === 'elevated' ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> Elevated
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <Minus className="w-3 h-3" /> Steady
                    </span>
                  )}
                  {report.prev_avg_stress && (
                    <span className="text-slate-400 font-normal">vs {report.prev_avg_stress}</span>
                  )}
                </div>
              </div>

              {/* Sleep Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Sleep</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">{report.avg_sleep_hours}</span>
                  <span className="text-[10px] text-slate-400">hrs</span>
                </div>
                <div className="text-[10px] font-bold flex items-center gap-1 pt-1">
                  {report.sleep_trend === 'improved' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> Longer
                    </span>
                  ) : report.sleep_trend === 'deteriorated' ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" /> Lower
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <Minus className="w-3 h-3" /> Steady
                    </span>
                  )}
                  {report.prev_avg_sleep_hours && (
                    <span className="text-slate-400 font-normal">vs {report.prev_avg_sleep_hours}h</span>
                  )}
                </div>
              </div>

              {/* Daytime Energy Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Energy Level</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">{report.avg_energy}</span>
                  <span className="text-[10px] text-slate-400">/ 10</span>
                </div>
                <div className="text-[10px] font-bold flex items-center gap-1 pt-1">
                  {report.energy_trend === 'improved' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> Higher
                    </span>
                  ) : report.energy_trend === 'lower' ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" /> Lower
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <Minus className="w-3 h-3" /> Steady
                    </span>
                  )}
                </div>
              </div>

              {/* Dominant Mood Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Predominant Mood</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {report.dominant_mood}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate pt-1">
                  Top focus: <strong className="text-slate-700 dark:text-slate-300">{report.top_stress_domain || 'Academics'}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Notice on Data Sufficiency</span>
              </div>
              <p className="leading-relaxed">
                MindBridge adheres to a strict non-fabrication standard. To generate reliable, comparative metrics, we require at least 3 daily check-ins per week. As you continue logging, full comparative charts and trend analysis will automatically unlock.
              </p>
            </div>
          )}

          {/* Supportive Observations & Practical Guidance */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Supportive Guidance & Observations</span>
            </h3>

            <div className="space-y-2">
              {feedbackList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Ethical Disclaimer */}
          <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Non-Clinical Note:</strong> Weekly wellbeing summaries reflect self-reported observational patterns and are not psychological or medical diagnoses. If you are experiencing acute distress, call Tele-MANAS (<strong>14416</strong>) or visit campus counsellor Dr. Nitu Singh Bhadouria in SAC I.
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTalkToMindy}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Bot className="w-4 h-4" /> Talk with Mindy
            </button>

            <button
              onClick={handleOpenCounsellor}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Connect with Counsellor
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
