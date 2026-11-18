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
    has_data: bool = True
    current_mood: Optional[str] = None
    current_mood_intensity: Optional[int] = None
    today_stress_level: Optional[int] = None
    last_night_sleep_hours: Optional[float] = None
    energy_level: Optional[int] = None
    weekly_wellbeing_score: Optional[int] = None
    total_checkins_this_month: int = 0
    sleep_consistency_score: Optional[int] = None

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
