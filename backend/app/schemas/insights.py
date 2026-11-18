from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class TrendInsight(BaseModel):
    id: str
    type: str  # positive, attention, significant_change, pattern
    title: str
    description: str
    category: str  # mood, stress, sleep, correlation
    icon_hint: str
    observed_metric: str

class MetricSummary(BaseModel):
    current_mood: Optional[str] = "Neutral"
    current_mood_intensity: Optional[int] = 6
    today_stress_level: Optional[int] = 4
    last_night_sleep_hours: Optional[float] = 7.5
    energy_level: Optional[int] = 6
    weekly_wellbeing_score: int = 78
    total_checkins_this_month: int = 24
    sleep_consistency_score: int = 82  # %

class InsightsSummaryResponse(BaseModel):
    metrics: MetricSummary
    insights: List[TrendInsight]
    mood_distribution: Dict[str, int]
    stress_categories: Dict[str, int]
    sleep_analysis: Dict[str, Any]
    correlation_notes: List[str]
    disclaimer: str = "MindBridge Campus is a student wellbeing support platform. Insights are observational and not clinical diagnoses."

class AggregateTrendsResponse(BaseModel):
    total_students: int
    total_checkins: int
    active_this_week: int
    campus_mood_distribution: Dict[str, int]
    top_campus_stressors: Dict[str, int]
    average_campus_sleep: float
    counselling_sessions_completed: int
    counselling_sessions_pending: int
