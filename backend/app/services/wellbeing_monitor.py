import json
import logging
import statistics
import zoneinfo
from datetime import datetime, timezone, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.user import User, UserPreference
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.models.notification import Notification
from app.models.monitoring import (
    WeeklyWellbeingReport,
    WellbeingAnomalyAlert,
    NotificationLog
)
from app.services.push_service import PushService
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)

class WellbeingMonitor:
    """
    Intelligent Student Wellbeing Monitoring & Notification Engine.
    Handles:
    - Weekly Personalized Wellbeing Reports (7-day comparative analytics & supportive messages)
    - Baseline-Driven Anomaly Detection (Sudden stress, sleep, energy, and mood changes)
    - Configurable Daily Check-in Reminders with Quiet Hours & Idempotency
    """

    # ---------------------------------------------------------
    # 1. Weekly Personalized Wellbeing Reports
    # ---------------------------------------------------------
    @staticmethod
    def generate_weekly_report(user_id: int, db: Session, force: bool = False) -> Optional[WeeklyWellbeingReport]:
        today = date.today()
        # Define current week: past 7 days (today - 6 days through today)
        week_end = today
        week_start = week_end - timedelta(days=6)
        
        # Preceding week: (week_start - 7 days through week_start - 1 day)
        prev_week_end = week_start - timedelta(days=1)
        prev_week_start = prev_week_end - timedelta(days=6)

        # Check idempotency: If report already exists for this week and not forced, return existing
        existing_report = (
            db.query(WeeklyWellbeingReport)
            .filter(
                WeeklyWellbeingReport.user_id == user_id,
                WeeklyWellbeingReport.week_start == week_start,
                WeeklyWellbeingReport.week_end == week_end
            )
            .first()
        )
        if existing_report and not force:
            return existing_report

        # Convert to UTC timestamps for DB queries
        tz = zoneinfo.ZoneInfo("Asia/Kolkata")
        curr_start_utc = datetime.combine(week_start, datetime.min.time(), tzinfo=tz).astimezone(timezone.utc)
        curr_end_utc = datetime.combine(week_end, datetime.max.time(), tzinfo=tz).astimezone(timezone.utc)
        prev_start_utc = datetime.combine(prev_week_start, datetime.min.time(), tzinfo=tz).astimezone(timezone.utc)
        prev_end_utc = datetime.combine(prev_week_end, datetime.max.time(), tzinfo=tz).astimezone(timezone.utc)

        # Fetch current week entries
        curr_moods = db.query(MoodEntry).filter(
            MoodEntry.user_id == user_id,
            MoodEntry.recorded_at >= curr_start_utc,
            MoodEntry.recorded_at <= curr_end_utc
        ).all()

        curr_stresses = db.query(StressEntry).filter(
            StressEntry.user_id == user_id,
            StressEntry.recorded_at >= curr_start_utc,
            StressEntry.recorded_at <= curr_end_utc
        ).all()

        curr_sleeps = db.query(SleepEntry).filter(
            SleepEntry.user_id == user_id,
            SleepEntry.sleep_date >= week_start,
            SleepEntry.sleep_date <= week_end
        ).all()

        # Fetch preceding week entries
        prev_moods = db.query(MoodEntry).filter(
            MoodEntry.user_id == user_id,
            MoodEntry.recorded_at >= prev_start_utc,
            MoodEntry.recorded_at <= prev_end_utc
        ).all()

        prev_stresses = db.query(StressEntry).filter(
            StressEntry.user_id == user_id,
            StressEntry.recorded_at >= prev_start_utc,
            StressEntry.recorded_at <= prev_end_utc
        ).all()

        prev_sleeps = db.query(SleepEntry).filter(
            SleepEntry.user_id == user_id,
            SleepEntry.sleep_date >= prev_week_start,
            SleepEntry.sleep_date <= prev_week_end
        ).all()

        total_curr_checkins = len(curr_moods)
        total_prev_checkins = len(prev_moods)

        # Rule: Do not generate false reports for students with insufficient data (< 3 entries in current week)
        if total_curr_checkins < 3:
            summary = (
                f"You logged {total_curr_checkins} check-in(s) over the past 7 days. "
                "MindBridge requires at least 3 daily check-ins to construct a verified, non-fabricated weekly comparative report. "
                "Keep logging your daily rhythm to unlock complete weekly trends!"
            )
            feedback_bullets = [
                "Logging 3 or more days a week allows MindBridge to detect genuine patterns in your sleep, stress balance, and focus.",
                "Take 60 seconds each evening to record your mood and sleep—every entry helps calibrate personalized recommendations."
            ]

            report = WeeklyWellbeingReport(
                user_id=user_id,
                week_start=week_start,
                week_end=week_end,
                avg_stress=0.0,
                prev_avg_stress=None,
                stress_trend="insufficient",
                avg_sleep_hours=0.0,
                prev_avg_sleep_hours=None,
                sleep_trend="insufficient",
                avg_energy=0.0,
                prev_avg_energy=None,
                energy_trend="insufficient",
                dominant_mood="Unrecorded",
                prev_dominant_mood=None,
                mood_trend="steady",
                top_stress_domain=None,
                summary_message=summary,
                supportive_feedback=json.dumps(feedback_bullets),
                total_checkins_current_week=total_curr_checkins,
                total_checkins_prev_week=total_prev_checkins,
                is_sufficient_data=False
            )
            db.add(report)
            db.commit()
            db.refresh(report)
            return report

        # Compute Current Week Averages
        avg_stress = round(statistics.mean([s.level for s in curr_stresses]), 1) if curr_stresses else 4.0
        avg_sleep = round(statistics.mean([s.duration_hours for s in curr_sleeps]), 1) if curr_sleeps else 7.0
        avg_energy = round(statistics.mean([m.energy_level for m in curr_moods if m.energy_level is not None]), 1) if curr_moods else 5.0
        
        # Dominant mood
        mood_counts: Dict[str, int] = {}
        for m in curr_moods:
            mood_counts[m.mood] = mood_counts.get(m.mood, 0) + 1
        dominant_mood = max(mood_counts, key=mood_counts.get) if mood_counts else "Neutral"

        # Top stress domain
        domain_counts: Dict[str, int] = {}
        for s in curr_stresses:
            if s.category:
                domain_counts[s.category] = domain_counts.get(s.category, 0) + 1
        top_domain = max(domain_counts, key=domain_counts.get) if domain_counts else "Academics"

        # Compute Preceding Week Averages
        prev_avg_stress = round(statistics.mean([s.level for s in prev_stresses]), 1) if prev_stresses else None
        prev_avg_sleep = round(statistics.mean([s.duration_hours for s in prev_sleeps]), 1) if prev_sleeps else None
        prev_avg_energy = round(statistics.mean([m.energy_level for m in prev_moods if m.energy_level is not None]), 1) if prev_moods else None

        prev_mood_counts: Dict[str, int] = {}
        for m in prev_moods:
            prev_mood_counts[m.mood] = prev_mood_counts.get(m.mood, 0) + 1
        prev_dominant_mood = max(prev_mood_counts, key=prev_mood_counts.get) if prev_mood_counts else None

        # Determine Trends
        # Stress trend
        stress_trend = "steady"
        if prev_avg_stress is not None:
            delta_stress = avg_stress - prev_avg_stress
            if delta_stress <= -0.8:
                stress_trend = "improved"
            elif delta_stress >= 0.8:
                stress_trend = "elevated"
        elif avg_stress >= 6.5:
            stress_trend = "elevated"

        # Sleep trend
        sleep_trend = "steady"
        if prev_avg_sleep is not None:
            delta_sleep = avg_sleep - prev_avg_sleep
            if delta_sleep >= 0.75:
                sleep_trend = "improved"
            elif delta_sleep <= -0.75 or avg_sleep < 6.0:
                sleep_trend = "deteriorated"
        elif avg_sleep < 6.0:
            sleep_trend = "deteriorated"

        # Energy trend
        energy_trend = "steady"
        if prev_avg_energy is not None:
            delta_energy = avg_energy - prev_avg_energy
            if delta_energy >= 0.8:
                energy_trend = "improved"
            elif delta_energy <= -0.8:
                energy_trend = "lower"

        # Mood trend
        positive_moods = {"Very Happy", "Happy"}
        curr_pos_count = sum(1 for m in curr_moods if m.mood in positive_moods)
        prev_pos_count = sum(1 for m in prev_moods if m.mood in positive_moods) if prev_moods else 0
        curr_pos_ratio = curr_pos_count / len(curr_moods) if curr_moods else 0
        prev_pos_ratio = prev_pos_count / len(prev_moods) if prev_moods else 0
        
        mood_trend = "steady"
        if curr_pos_ratio >= prev_pos_ratio + 0.2:
            mood_trend = "more_positive"
        elif curr_pos_ratio <= prev_pos_ratio - 0.2 and curr_pos_ratio < 0.3:
            mood_trend = "lower"

        # Generate Supportive Messages based on actual data
        feedback_bullets = []

        if stress_trend == "improved":
            feedback_bullets.append(
                f"Great progress! Your average stress level decreased compared with last week (from {prev_avg_stress} to {avg_stress}/10). "
                "Keep practising the habits that seem to be helping you."
            )
        elif avg_stress >= 6.5:
            feedback_bullets.append(
                f"We noticed that your stress levels have been relatively high this week (averaging {avg_stress}/10, primarily around {top_domain}). "
                "College life can be overwhelming sometimes. Would you like to talk to Mindy or connect with a campus counsellor?"
            )
        else:
            feedback_bullets.append(
                f"Your stress balance has remained steady this week (averaging {avg_stress}/10). "
                "Consistent pacing helps maintain steady cognitive endurance."
            )

        if sleep_trend == "improved":
            feedback_bullets.append(
                f"Good news! Your sleep duration has improved this week (averaging {avg_sleep} hrs/night). "
                "Maintaining a consistent sleep routine may help you feel more refreshed."
            )
        elif sleep_trend == "deteriorated":
            prev_note = f" (down from {prev_avg_sleep} hrs)" if prev_avg_sleep else ""
            feedback_bullets.append(
                f"Your sleep duration has been lower than your recent average this week (averaging {avg_sleep} hrs{prev_note}). "
                "Have you been experiencing difficulty sleeping? You can explore some sleep-support resources in MindBridge."
            )
        else:
            feedback_bullets.append(
                f"You averaged {avg_sleep} hours of rest per night. A steady sleep schedule protects your memory retention."
            )

        if energy_trend == "improved":
            feedback_bullets.append(
                f"Your daytime energy levels have improved compared with last week (averaging {avg_energy}/10). "
                "That's encouraging! Keep taking care of your daily routine."
            )
        elif energy_trend == "lower":
            feedback_bullets.append(
                f"Your daytime energy averaged {avg_energy}/10 this week. Remember that taking short active breaks between study sprints helps prevent sedentary fatigue."
            )

        if mood_trend == "more_positive":
            feedback_bullets.append(
                f"We noticed more positive mood entries this week (predominantly {dominant_mood}). "
                "It's lovely to see this progress. Keep making time for the things that help you feel good."
            )
        elif dominant_mood in ["Happy", "Very Happy"]:
            feedback_bullets.append(
                f"Your predominant mood was {dominant_mood}. Celebrating small wins reinforces long-term wellbeing."
            )

        # Primary summary statement
        summary = (
            f"Weekly Overview ({week_start.strftime('%b %d')} – {week_end.strftime('%b %d')}): "
            f"You logged {total_curr_checkins} check-ins. "
            f"Average stress was {avg_stress}/10, sleep averaged {avg_sleep} hrs, daytime energy was {avg_energy}/10, "
            f"and your predominant mood was {dominant_mood}."
        )

        report = WeeklyWellbeingReport(
            user_id=user_id,
            week_start=week_start,
            week_end=week_end,
            avg_stress=avg_stress,
            prev_avg_stress=prev_avg_stress,
            stress_trend=stress_trend,
            avg_sleep_hours=avg_sleep,
            prev_avg_sleep_hours=prev_avg_sleep,
            sleep_trend=sleep_trend,
            avg_energy=avg_energy,
            prev_avg_energy=prev_avg_energy,
            energy_trend=energy_trend,
            dominant_mood=dominant_mood,
            prev_dominant_mood=prev_dominant_mood,
            mood_trend=mood_trend,
            top_stress_domain=top_domain,
            summary_message=summary,
            supportive_feedback=json.dumps(feedback_bullets),
            total_checkins_current_week=total_curr_checkins,
            total_checkins_prev_week=total_prev_checkins,
            is_sufficient_data=True
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        # Create in-app notification linking to weekly report
        notif = Notification(
            user_id=user_id,
            title="Your Weekly Wellbeing Summary is Ready",
            message=f"Check out your 7-day patterns ({week_start.strftime('%b %d')} – {week_end.strftime('%b %d')}): Stress {avg_stress}/10, Sleep {avg_sleep}h. Tap to explore insights.",
            type="recommendation",
            is_read=False,
            link="/notifications"
        )
        db.add(notif)
        db.commit()

        # Dispatch Web Push if student enabled browser notifications
        prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if prefs and prefs.browser_push_enabled:
            PushService.dispatch_to_user(
                db=db,
                user_id=user_id,
                title="Weekly Wellbeing Summary Ready 📊",
                body=f"Your 7-day wellbeing summary is ready to view: Stress {avg_stress}/10, Sleep {avg_sleep}h.",
                url="/notifications",
                notification_type="weekly_report"
            )

        # Log notification dispatch
        log_entry = NotificationLog(
            user_id=user_id,
            channel="in_app",
            notification_type="weekly_report",
            title="Weekly Wellbeing Report Generated",
            message_preview=summary[:100],
            status="sent"
        )
        db.add(log_entry)
        db.commit()

        return report

    # ---------------------------------------------------------
    # 2. Intelligent Sudden-Change Anomaly Detection
    # ---------------------------------------------------------
    @staticmethod
    def evaluate_anomalies(user_id: int, db: Session) -> List[WellbeingAnomalyAlert]:
        """
        Continuously evaluates newly logged check-in entries against student's personal rolling baseline.
        Implements safeguards against false alarms:
        - Requires at least 4 historical check-in records before evaluating anomalies.
        - 48h to 72h cooldown per anomaly type to prevent alert fatigue.
        - Provides supportive, non-alarmist check-ins with explainable trigger reasons.
        """
        alerts_generated = []
        now_utc = datetime.now(timezone.utc)
        today = date.today()

        # Check if student disabled sudden change alerts in preferences
        prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if prefs and not prefs.sudden_change_alerts_enabled:
            return []

        # Fetch baseline history: prior 30 days excluding today
        start_baseline = datetime.combine(today - timedelta(days=30), datetime.min.time(), tzinfo=timezone.utc)
        end_baseline = datetime.combine(today - timedelta(days=1), datetime.max.time(), tzinfo=timezone.utc)

        hist_stresses = db.query(StressEntry).filter(
            StressEntry.user_id == user_id,
            StressEntry.recorded_at >= start_baseline,
            StressEntry.recorded_at <= end_baseline
        ).all()

        hist_sleeps = db.query(SleepEntry).filter(
            SleepEntry.user_id == user_id,
            SleepEntry.sleep_date >= (today - timedelta(days=30)),
            SleepEntry.sleep_date <= (today - timedelta(days=1))
        ).all()

        hist_moods = db.query(MoodEntry).filter(
            MoodEntry.user_id == user_id,
            MoodEntry.recorded_at >= start_baseline,
            MoodEntry.recorded_at <= end_baseline
        ).all()

        # Minimum data requirement: at least 4 past entries
        if len(hist_stresses) < 4 or len(hist_moods) < 4:
            return []

        # Baseline stats
        baseline_stress_mean = statistics.mean([s.level for s in hist_stresses])
        baseline_sleep_mean = statistics.mean([s.duration_hours for s in hist_sleeps]) if hist_sleeps else 7.0
        baseline_energy_mean = statistics.mean([m.energy_level for m in hist_moods if m.energy_level is not None]) if hist_moods else 5.0

        # Today's entries
        today_start_utc = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
        today_stress = db.query(StressEntry).filter(
            StressEntry.user_id == user_id,
            StressEntry.recorded_at >= today_start_utc
        ).order_by(StressEntry.recorded_at.desc()).first()

        today_sleep = db.query(SleepEntry).filter(
            SleepEntry.user_id == user_id,
            SleepEntry.sleep_date == today
        ).first()

        today_mood = db.query(MoodEntry).filter(
            MoodEntry.user_id == user_id,
            MoodEntry.recorded_at >= today_start_utc
        ).order_by(MoodEntry.recorded_at.desc()).first()

        # Helper: check alert cooldown in past X hours
        def has_recent_alert(alert_type: str, hours: int = 48) -> bool:
            cutoff = now_utc - timedelta(hours=hours)
            existing = db.query(WellbeingAnomalyAlert).filter(
                WellbeingAnomalyAlert.user_id == user_id,
                WellbeingAnomalyAlert.alert_type == alert_type,
                WellbeingAnomalyAlert.created_at >= cutoff
            ).first()
            return existing is not None

        # -----------------------------------------------------
        # A. Stress Anomaly Checks
        # -----------------------------------------------------
        if today_stress:
            # Check 1: Sudden Stress Spike
            # Trigger: Today's stress >= 7 AND >= baseline + 2.5 (or >= 1.4x baseline)
            if today_stress.level >= 7 and (today_stress.level >= baseline_stress_mean + 2.5 or today_stress.level >= baseline_stress_mean * 1.4):
                if not has_recent_alert("sudden_stress_increase", hours=48):
                    reason = f"Stress rose to {today_stress.level}/10 compared to your rolling baseline of {baseline_stress_mean:.1f}/10 (+{today_stress.level - baseline_stress_mean:.1f} points) in {today_stress.category}."
                    msg = "Your stress level has increased noticeably compared with your recent check-ins. Is something bothering you? You can talk to Mindy or request support from a campus counsellor."
                    mindy_ctx = f"The student's stress level increased noticeably to {today_stress.level}/10 today (baseline: {baseline_stress_mean:.1f}/10) centered around {today_stress.category}. Greet them with gentle warmth, validate that university stress is real, ask if they want to unpack it, and offer practical grounding or counsellor options."
                    
                    alert = WellbeingAnomalyAlert(
                        user_id=user_id,
                        alert_type="sudden_stress_increase",
                        metric_name="stress",
                        severity="attention",
                        baseline_value=round(baseline_stress_mean, 1),
                        observed_value=float(today_stress.level),
                        trigger_reason=reason,
                        supportive_message=msg,
                        mindy_context=mindy_ctx
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    alerts_generated.append(alert)
                    WellbeingMonitor._dispatch_anomaly_notification(db, user_id, alert)

            # Check 2: Persistently Elevated Stress (Last 3 logs >= 7.0)
            recent_3_stresses = db.query(StressEntry).filter(
                StressEntry.user_id == user_id
            ).order_by(StressEntry.recorded_at.desc()).limit(3).all()

            if len(recent_3_stresses) == 3 and all(s.level >= 7 for s in recent_3_stresses):
                if not has_recent_alert("persistent_high_stress", hours=72):
                    avg_recent_stress = round(statistics.mean([s.level for s in recent_3_stresses]), 1)
                    reason = f"Last 3 check-ins have sustained elevated stress (averaging {avg_recent_stress}/10)."
                    msg = "We noticed that your stress levels have been relatively high across your recent check-ins. College life can be overwhelming sometimes. Would you like to talk to Mindy or connect with a campus counsellor?"
                    mindy_ctx = f"The student has logged persistently elevated stress (averaging {avg_recent_stress}/10 over their last 3 check-ins). Offer compassionate support, check if academic or placement deadlines are accumulating, and suggest practical stress de-escalation."

                    alert = WellbeingAnomalyAlert(
                        user_id=user_id,
                        alert_type="persistent_high_stress",
                        metric_name="stress",
                        severity="attention",
                        baseline_value=round(baseline_stress_mean, 1),
                        observed_value=avg_recent_stress,
                        trigger_reason=reason,
                        supportive_message=msg,
                        mindy_context=mindy_ctx
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    alerts_generated.append(alert)
                    WellbeingMonitor._dispatch_anomaly_notification(db, user_id, alert)

        # -----------------------------------------------------
        # B. Sleep Anomaly Checks
        # -----------------------------------------------------
        if today_sleep:
            # Check 3: Sudden Sleep Drop (<= 5.0h AND >= 2.5h below baseline)
            if today_sleep.duration_hours <= 5.0 and (today_sleep.duration_hours <= baseline_sleep_mean - 2.5):
                if not has_recent_alert("sudden_sleep_drop", hours=48):
                    reason = f"Sleep duration dropped to {today_sleep.duration_hours:.1f} hrs (baseline: {baseline_sleep_mean:.1f} hrs, -{baseline_sleep_mean - today_sleep.duration_hours:.1f} hrs)."
                    msg = "We noticed a change in your sleep duration compared with your usual pattern. Have your sleeping habits changed recently?"
                    mindy_ctx = f"The student slept only {today_sleep.duration_hours:.1f} hours last night compared to their normal baseline of {baseline_sleep_mean:.1f} hours. Inquire gently whether late study, assignments, or racing thoughts kept them awake."

                    alert = WellbeingAnomalyAlert(
                        user_id=user_id,
                        alert_type="sudden_sleep_drop",
                        metric_name="sleep",
                        severity="medium",
                        baseline_value=round(baseline_sleep_mean, 1),
                        observed_value=round(today_sleep.duration_hours, 1),
                        trigger_reason=reason,
                        supportive_message=msg,
                        mindy_context=mindy_ctx
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    alerts_generated.append(alert)
                    WellbeingMonitor._dispatch_anomaly_notification(db, user_id, alert)

            # Check 4: Sudden Sleep Surge (>= 10.5h AND >= 3.0h above baseline)
            elif today_sleep.duration_hours >= 10.5 and (today_sleep.duration_hours >= baseline_sleep_mean + 3.0):
                if not has_recent_alert("sudden_sleep_increase", hours=48):
                    reason = f"Sleep duration increased to {today_sleep.duration_hours:.1f} hrs (baseline: {baseline_sleep_mean:.1f} hrs, +{today_sleep.duration_hours - baseline_sleep_mean:.1f} hrs)."
                    msg = "Your sleep duration has increased significantly compared with your recent pattern. If this change is unusual for you, would you like to talk about it?"
                    mindy_ctx = f"The student slept {today_sleep.duration_hours:.1f} hours last night (well above their {baseline_sleep_mean:.1f} hrs average). Check if they are recovering from sleep debt or feeling fatigued."

                    alert = WellbeingAnomalyAlert(
                        user_id=user_id,
                        alert_type="sudden_sleep_increase",
                        metric_name="sleep",
                        severity="medium",
                        baseline_value=round(baseline_sleep_mean, 1),
                        observed_value=round(today_sleep.duration_hours, 1),
                        trigger_reason=reason,
                        supportive_message=msg,
                        mindy_context=mindy_ctx
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    alerts_generated.append(alert)
                    WellbeingMonitor._dispatch_anomaly_notification(db, user_id, alert)

        # -----------------------------------------------------
        # C. Energy & Mood Anomaly Checks
        # -----------------------------------------------------
        if today_mood:
            # Check 5: Sudden Energy Drop (<= 3/10 AND >= 3.0 points below baseline)
            if today_mood.energy_level is not None and today_mood.energy_level <= 3 and (today_mood.energy_level <= baseline_energy_mean - 3.0):
                if not has_recent_alert("sudden_energy_drop", hours=48):
                    reason = f"Daytime energy dropped to {today_mood.energy_level}/10 (baseline: {baseline_energy_mean:.1f}/10)."
                    msg = "Your energy levels seem lower than usual. Would you like to explore some practical wellbeing resources?"
                    mindy_ctx = f"The student reported daytime energy of {today_mood.energy_level}/10 today (baseline: {baseline_energy_mean:.1f}/10). Suggest manageable micro-actions, taking an active break, or looking into hydration and rest."

                    alert = WellbeingAnomalyAlert(
                        user_id=user_id,
                        alert_type="sudden_energy_drop",
                        metric_name="energy",
                        severity="medium",
                        baseline_value=round(baseline_energy_mean, 1),
                        observed_value=float(today_mood.energy_level),
                        trigger_reason=reason,
                        supportive_message=msg,
                        mindy_context=mindy_ctx
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    alerts_generated.append(alert)
                    WellbeingMonitor._dispatch_anomaly_notification(db, user_id, alert)

            # Check 6: Repeated Low Mood (Last 3 entries negative with intensity >= 6)
            recent_3_moods = db.query(MoodEntry).filter(
                MoodEntry.user_id == user_id
            ).order_by(MoodEntry.recorded_at.desc()).limit(3).all()

            negative_mood_set = {"Sad", "Exhausted", "Anxious", "Stressed", "Angry"}
            if len(recent_3_moods) == 3 and all(m.mood in negative_mood_set and m.intensity >= 6 for m in recent_3_moods):
                if not has_recent_alert("repeated_low_mood", hours=72):
                    mood_names = [m.mood for m in recent_3_moods]
                    reason = f"Last 3 check-ins recorded heavy emotional valence ({', '.join(mood_names)})."
                    msg = "We noticed you've been navigating some tough days recently. You do not have to carry this alone. You can reflect with Mindy or book confidential guidance with campus counsellor Dr. Nitu Singh Bhadouria in SAC I."
                    mindy_ctx = f"The student has recorded low or strained mood across their last 3 check-ins ({', '.join(mood_names)}). Greet them with deep empathy, avoid unsolicited toxic positivity, and offer a safe conversational space."

                    alert = WellbeingAnomalyAlert(
                        user_id=user_id,
                        alert_type="repeated_low_mood",
                        metric_name="mood",
                        severity="attention",
                        baseline_value=None,
                        observed_value=float(statistics.mean([m.intensity for m in recent_3_moods])),
                        trigger_reason=reason,
                        supportive_message=msg,
                        mindy_context=mindy_ctx
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    alerts_generated.append(alert)
                    WellbeingMonitor._dispatch_anomaly_notification(db, user_id, alert)

        return alerts_generated

    @staticmethod
    def _dispatch_anomaly_notification(db: Session, user_id: int, alert: WellbeingAnomalyAlert):
        """
        Creates in-app notification and dispatches Web Push for a detected anomaly alert.
        """
        # In-app notification
        notif = Notification(
            user_id=user_id,
            title="Wellbeing Check-in • We Noticed a Pattern Change",
            message=alert.supportive_message,
            type="checkin",
            is_read=False,
            link=f"/ai-assistant?alert_id={alert.id}"
        )
        db.add(notif)
        db.commit()

        # Web Push notification (Generic lock-screen text for privacy)
        prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if prefs and prefs.browser_push_enabled:
            PushService.dispatch_to_user(
                db=db,
                user_id=user_id,
                title="MindBridge Wellbeing Check-in 🌿",
                body="We noticed a change in your recent rhythm. Tap to chat with Mindy or view suggestions.",
                url=f"/ai-assistant?alert_id={alert.id}",
                notification_type="sudden_change_alert"
            )

        # Log notification dispatch
        log_entry = NotificationLog(
            user_id=user_id,
            channel="in_app",
            notification_type="sudden_change_alert",
            title=f"Anomaly Alert: {alert.alert_type}",
            message_preview=alert.supportive_message[:100],
            status="sent"
        )
        db.add(log_entry)
        db.commit()

    # ---------------------------------------------------------
    # 3. Daily Check-in Reminders
    # ---------------------------------------------------------
    @staticmethod
    def evaluate_daily_reminder(user_id: int, db: Session, force: bool = False) -> Optional[Notification]:
        """
        Evaluates whether a student is due for their daily check-in reminder.
        Rules:
        - NEVER send if student has already completed check-in today.
        - Respect quiet hours.
        - Respect preferred days.
        - Only send once per day (idempotent).
        """
        prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not prefs or not prefs.daily_reminder_enabled:
            return None

        tz_str = getattr(prefs, "timezone", "Asia/Kolkata") or "Asia/Kolkata"
        try:
            tz = zoneinfo.ZoneInfo(tz_str)
        except Exception:
            tz = zoneinfo.ZoneInfo("Asia/Kolkata")

        now_local = datetime.now(tz)
        today_date = now_local.date()
        current_time_str = now_local.strftime("%H:%M")
        day_abbr = now_local.strftime("%a")  # e.g. "Mon"

        # Check if already sent today
        if not force and prefs.last_daily_reminder_date == today_date:
            return None

        # Check preferred days
        try:
            pref_days = json.loads(prefs.preferred_days) if isinstance(prefs.preferred_days, str) else prefs.preferred_days
        except Exception:
            pref_days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        
        if not force and day_abbr not in pref_days:
            return None

        # Check quiet hours (e.g. 22:00 to 07:00)
        q_start = prefs.quiet_hours_start or "22:00"
        q_end = prefs.quiet_hours_end or "07:00"
        if not force:
            if q_start > q_end:  # Over midnight quiet hours
                if current_time_str >= q_start or current_time_str < q_end:
                    return None
            else:
                if q_start <= current_time_str < q_end:
                    return None

        # Check time match
        target_time = prefs.reminder_time or "20:00"
        if not force and current_time_str != target_time:
            return None

        # Critical requirement: Check if student has ALREADY completed check-in today
        start_of_day_utc = datetime.combine(today_date, datetime.min.time(), tzinfo=tz).astimezone(timezone.utc)
        already_checked_in = db.query(MoodEntry).filter(
            MoodEntry.user_id == user_id,
            MoodEntry.recorded_at >= start_of_day_utc
        ).first()

        if already_checked_in:
            logger.info(f"[MONITOR] User {user_id} already checked in today. Suppressing reminder.")
            return None

        # Dispatch daily reminder
        title = "Daily Wellbeing Reflection"
        message = "Hey! Have you completed your daily wellbeing check-in? Take a minute to reflect on your mood, stress, energy and sleep."
        
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type="checkin",
            is_read=False,
            link="/mood-tracker"
        )
        db.add(notif)
        prefs.last_daily_reminder_date = today_date
        db.commit()

        # Web Push
        if prefs.browser_push_enabled:
            PushService.dispatch_to_user(
                db=db,
                user_id=user_id,
                title="Time for Your 60-Second Check-In 🌿",
                body="Take a minute to reflect on your mood, stress, and sleep balance today.",
                url="/mood-tracker",
                notification_type="daily_reminder"
            )

        # Log
        log_entry = NotificationLog(
            user_id=user_id,
            channel="in_app",
            notification_type="daily_reminder",
            title=title,
            message_preview=message[:100],
            status="sent"
        )
        db.add(log_entry)
        db.commit()

        return notif

    # ---------------------------------------------------------
    # 4. Global Monitoring Cycle (Scheduler / Cron Execution)
    # ---------------------------------------------------------
    @staticmethod
    def run_monitoring_cycle(db: Session) -> Dict[str, Any]:
        """
        Executes one sweep of monitoring across all registered students:
        1. Checks daily reminders for students whose local target time matches now.
        2. Generates weekly reports on Sundays/Mondays if not yet generated this week.
        Idempotent and safe for periodic cron or background worker.
        """
        students = db.query(User).filter(User.role == "student", User.is_active == True).all()
        reminders_sent = 0
        reports_generated = 0
        today = date.today()

        for s in students:
            # 1. Daily reminder check
            rem = WellbeingMonitor.evaluate_daily_reminder(s.id, db, force=False)
            if rem:
                reminders_sent += 1

            # 2. Weekly report check: If Sunday or Monday, generate report for previous 7 days
            if today.weekday() in [0, 6]:  # Monday or Sunday
                prefs = s.preferences
                if not prefs or prefs.weekly_summary_enabled:
                    # Check if already generated within past 5 days
                    cutoff_date = today - timedelta(days=5)
                    last_rep = (
                        db.query(WeeklyWellbeingReport)
                        .filter(WeeklyWellbeingReport.user_id == s.id, WeeklyWellbeingReport.created_at >= cutoff_date)
                        .first()
                    )
                    if not last_rep:
                        rep = WellbeingMonitor.generate_weekly_report(s.id, db, force=False)
                        if rep:
                            reports_generated += 1

        return {
            "total_students_evaluated": len(students),
            "reminders_sent": reminders_sent,
            "reports_generated": reports_generated,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
