import json
from datetime import datetime, timedelta, timezone, date
from sqlalchemy.orm import Session
from app.auth import hash_password
from app.models.user import User, CounsellorProfile, UserPreference
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.models.journal import JournalEntry
from app.models.appointment import Appointment
from app.models.resource import WellbeingResource
from app.models.notification import Notification

def seed_database(db: Session):
    # Check if database is already seeded
    existing_user = db.query(User).filter(User.email == "student@mindbridge.edu").first()
    if existing_user:
        return  # Already seeded

    print("Seeding database with realistic campus wellbeing data...")

    # 1. Create Demo Users
    # Student
    student = User(
        email="student@mindbridge.edu",
        password_hash=hash_password("student123"),
        full_name="Priya Sharma",
        role="student",
        college_id="CS2023-4089",
        department="Computer Science & Engineering",
        year_of_study="3rd Year (Semester 5)",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        is_active=True
    )
    db.add(student)
    db.flush()

    # Student Preferences
    student_prefs = UserPreference(
        user_id=student.id,
        checkin_reminder_enabled=True,
        sleep_reminder_enabled=True,
        reminder_time="20:30",
        consent_ai_analysis=True,
        email_notifications=True
    )
    db.add(student_prefs)

    # Official Campus Counsellor: Nitu Singh Bhadouria
    counsellor_user = User(
        email="nitusingh_b@dau.ac.in",
        password_hash=hash_password("counsellor123"),
        full_name="Nitu Singh Bhadouria",
        role="counsellor",
        college_id="FAC-SAC1-01",
        department="Student Wellness & Counselling",
        year_of_study="Faculty / Staff",
        avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        is_active=True
    )
    db.add(counsellor_user)
    db.flush()

    counsellor_profile = CounsellorProfile(
        user_id=counsellor_user.id,
        title="College Mental Health & Student Counsellor",
        qualifications="Licensed Student Counsellor & Mental Wellbeing Specialist",
        experience_years=8,
        areas_of_support="Academic Stress, Placement & Career Uncertainty, Exam Anxiety, Sleep & Lifestyle, Emotional Wellness",
        bio="Nitu Singh Bhadouria provides compassionate, confidential guidance for students navigating examination pressure, placement challenges, academic stress, and personal wellbeing in SAC I.",
        availability_hours="Mon - Fri: 10:00 AM - 5:00 PM",
        contact_email="nitusingh_b@dau.ac.in",
        office_location="Counselling Room, SAC I, First Floor"
    )
    db.add(counsellor_profile)

    # Admin User
    admin = User(
        email="admin@mindbridge.edu",
        password_hash=hash_password("admin123"),
        full_name="Prof. Rajesh Kumar",
        role="admin",
        college_id="ADMIN-WELLBEING-01",
        department="Dean of Student Affairs & Welfare",
        year_of_study="Administration",
        avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        is_active=True
    )
    db.add(admin)
    db.flush()

    # 2. Seed 35 Days of Realistic Tracking History for Priya
    now = datetime.now(timezone.utc)
    today = date.today()

    patterns = [
        # (day_offset, mood, intensity, mood_tags, notes, stress_level, stress_cat, stress_tags, bedtime, wake, duration, quality, sleep_factors)
        # Week 1: 35-29 days ago (baseline calm)
        (35, "Happy", 7, ["Friends", "Campus Walk"], "Good start to the week. Enjoyed the lab session.", 3, "Social Life", ["Friends"], "23:15", "07:15", 8.0, 4, ["Calm night"]),
        (34, "Happy", 8, ["Academics", "Coffee"], "Understood algorithm design problem clearly today.", 3, "Academics", ["Classes"], "23:30", "07:30", 8.0, 4, ["Reading"]),
        (33, "Neutral", 6, ["Routine"], "Standard lecture day, feeling steady.", 4, "Academics", ["Assignments"], "23:45", "07:15", 7.5, 3, ["Screen time"]),
        (32, "Very Happy", 9, ["Hostel Life", "Music"], "Celebrated roommate's birthday evening.", 2, "Social Life", ["Hostel"], "00:15", "08:15", 8.0, 5, ["Good mood"]),
        (31, "Happy", 7, ["Weekend", "Relax"], "Caught up on laundry and video called family.", 2, "Family", ["Call home"], "23:00", "07:30", 8.5, 4, ["Relaxed"]),
        (30, "Neutral", 5, ["Preparation"], "Reviewed week's notes before bed.", 4, "Academics", ["Study"], "23:30", "07:00", 7.5, 3, ["Normal"]),
        (29, "Neutral", 6, ["Campus Walk"], "Morning library study was productive.", 3, "Academics", ["Library"], "23:15", "07:00", 7.7, 4, ["Calm"]),

        # Week 2: 28-22 days ago (Midterm Announcement & Prep)
        (28, "Anxious", 6, ["Exams", "Academics"], "Midterm timetable released. 4 papers in 5 days.", 6, "Academics", ["Exams", "Deadlines"], "00:00", "06:30", 6.5, 3, ["Late study"]),
        (27, "Stressed", 7, ["Exams", "Caffeine"], "So much syllabus left for Computer Networks.", 7, "Academics", ["Exams"], "00:45", "06:30", 5.7, 2, ["Caffeine", "Anxiety"]),
        (26, "Anxious", 7, ["Late Night", "Exams"], "Study group was slightly panic-inducing.", 7, "Academics", ["Exams", "Peer pressure"], "01:00", "06:45", 5.7, 2, ["Late study"]),
        (25, "Stressed", 8, ["Exams", "Overwhelmed"], "Feeling like I haven't retained anything.", 8, "Academics", ["Exams"], "01:15", "06:30", 5.2, 2, ["Stress", "Screen time"]),
        (24, "Exhausted", 8, ["Exams", "No sleep"], "First exam day done. Brain feels completely fried.", 8, "Academics", ["Exams"], "01:30", "06:30", 5.0, 2, ["Exhaustion"]),
        (23, "Stressed", 7, ["Exams"], "Second paper went okay, preparing for third.", 7, "Academics", ["Exams"], "00:30", "06:15", 5.7, 3, ["Late study"]),
        (22, "Exhausted", 9, ["Exams", "Burnout"], "Tired, just want the exam week to conclude.", 8, "Academics", ["Exams", "Burnout"], "00:45", "06:15", 5.5, 2, ["Fatigue"]),

        # Week 3: 21-15 days ago (Exam Finish & Post-Exam Recovery)
        (21, "Very Happy", 9, ["Exams Done", "Celebration"], "Exams are officially over! Slept right after.", 3, "Academics", ["Relief"], "22:30", "08:30", 10.0, 5, ["Deep sleep", "Relief"]),
        (20, "Happy", 8, ["Rest", "Friends"], "Went to campus cafeteria with friends.", 3, "Social Life", ["Hangout"], "23:00", "07:45", 8.7, 4, ["Restful"]),
        (19, "Neutral", 6, ["Chill"], "Quiet day reading a non-academic novel.", 3, "Personal Issues", ["Reading"], "23:15", "07:30", 8.2, 4, ["Peaceful"]),
        (18, "Happy", 7, ["Health", "Sports"], "Played badminton at the university complex.", 3, "Social Life", ["Sports"], "23:00", "07:00", 8.0, 5, ["Exercise"]),
        (17, "Neutral", 5, ["Routine"], "Classes resumed with regular timetable.", 4, "Academics", ["Lectures"], "23:30", "07:15", 7.7, 4, ["Normal"]),
        (16, "Anxious", 6, ["Placement Cell", "Resume"], "Placement orientation meeting conducted today.", 6, "Placements and Career", ["Resume", "Companies"], "00:15", "07:00", 6.7, 3, ["Overthinking"]),
        (15, "Stressed", 6, ["Career", "Competitive"], "Everyone is updating their LinkedIn and GitHub.", 6, "Placements and Career", ["Peer pressure", "Imposter"], "00:30", "07:00", 6.5, 3, ["Screen time"]),

        # Week 4: 14-8 days ago (Placement Preparation & Balancing)
        (14, "Neutral", 6, ["Coding", "Practice"], "Solved two LeetCode medium problems today.", 5, "Placements and Career", ["Coding"], "23:45", "07:15", 7.5, 3, ["Late practice"]),
        (13, "Happy", 7, ["Mentorship", "Confidence"], "Nitu Singh Bhadouria's breathing exercise helped with pre-interview jitters.", 4, "Placements and Career", ["Mindfulness"], "23:15", "07:15", 8.0, 4, ["Breathing exercise"]),
        (12, "Neutral", 5, ["Busy"], "Long day with capstone project meeting.", 5, "Academics", ["Projects"], "23:45", "07:00", 7.2, 3, ["Busy"]),
        (11, "Anxious", 6, ["Interview Shortlist"], "First round shortlist announced. Didn't make it to slot 1.", 6, "Placements and Career", ["Rejection", "Self doubt"], "00:30", "07:00", 6.5, 2, ["Disappointment"]),
        (10, "Neutral", 6, ["Refocus", "Journaling"], "Wrote down what I need to improve. Feeling more grounded.", 5, "Placements and Career", ["Planning"], "23:30", "07:15", 7.7, 4, ["Journaling"]),
        (9, "Happy", 7, ["Friends", "Support"], "Good talk with roommate. Reminded me that it's early in the season.", 4, "Relationships", ["Friends", "Support"], "23:00", "07:15", 8.2, 4, ["Good conversation"]),
        (8, "Happy", 8, ["Progress"], "Mock interview went much better than expected.", 4, "Placements and Career", ["Mock interview"], "23:15", "07:15", 8.0, 4, ["Calm mind"]),

        # Week 5: 7-0 days ago (Recent Current Baseline)
        (7, "Happy", 7, ["Good sleep", "Campus"], "Morning run by the campus lake. Felt very fresh.", 3, "Personal Issues", ["Running"], "23:00", "07:00", 8.0, 5, ["Exercise", "Fresh air"]),
        (6, "Neutral", 6, ["Classes"], "Attended machine learning lecture and submitted mini-project.", 4, "Academics", ["Submission"], "23:30", "07:15", 7.7, 4, ["Satisfied"]),
        (5, "Anxious", 6, ["Placement Test"], "Online technical assessment scheduled for Thursday.", 6, "Placements and Career", ["Aptitude", "Coding"], "00:00", "06:45", 6.7, 3, ["Prep"]),
        (4, "Stressed", 6, ["Deadlines", "Placement"], "Balancing DSA prep alongside database coursework.", 6, "Academics", ["Deadlines"], "00:15", "07:00", 6.7, 3, ["Late study"]),
        (3, "Happy", 7, ["Assessment Done"], "Technical assessment went smoothly. Fingers crossed.", 4, "Placements and Career", ["Test completed"], "23:15", "07:15", 8.0, 4, ["Relief"]),
        (2, "Neutral", 6, ["Weekend Study"], "Light revision and spent time in the hostel garden.", 3, "Social Life", ["Nature"], "23:00", "07:30", 8.5, 4, ["Restful"]),
        (1, "Happy", 8, ["Family Call", "Good Food"], "Home cooked meal parcel arrived! Boosted my mood.", 3, "Family", ["Family", "Food"], "23:15", "07:15", 8.0, 5, ["Grateful"]),
        (0, "Happy", 7, ["Today", "Reflective"], "Feeling optimistic and balanced heading into this week.", 3, "Academics", ["Balance"], "23:00", "07:15", 8.2, 4, ["Consistent rest"]),
    ]

    for p in patterns:
        day_offset = p[0]
        rec_time = now - timedelta(days=day_offset, hours=2)
        rec_date = today - timedelta(days=day_offset)

        # Mood
        m = MoodEntry(
            user_id=student.id,
            mood=p[1],
            intensity=p[2],
            tags=json.dumps(p[3]),
            notes=p[4],
            recorded_at=rec_time
        )
        db.add(m)

        # Stress
        s = StressEntry(
            user_id=student.id,
            level=p[5],
            category=p[6],
            tags=json.dumps(p[7]),
            notes=f"Reported {p[6]} stress: {p[4]}",
            recorded_at=rec_time
        )
        db.add(s)

        # Sleep
        sl = SleepEntry(
            user_id=student.id,
            bedtime=p[8],
            wake_time=p[9],
            duration_hours=p[10],
            quality=p[11],
            factors=json.dumps(p[12]),
            notes="Regular log",
            sleep_date=rec_date,
            recorded_at=rec_time
        )
        db.add(sl)

    # 3. Seed Private Journal Entries for Priya
    journals = [
        (
            today - timedelta(days=26),
            "Midterm Overwhelm & The Fear of Not Doing Enough",
            "Sitting in the central library at 11:30 PM. The silence here is heavy today. Every time I open the Operating Systems syllabus, my chest tightens. Everyone around me seems to have mastered threading and memory management, while I feel like I'm rereading the same chapter three times. I need to remind myself: comparing my backstage with someone else's highlight reel won't help. I will do 2 more questions, drink water, and sleep before midnight.",
            "Anxious",
            ["Exams", "Library", "Coping"],
            True
        ),
        (
            today - timedelta(days=20),
            "The Sweet Stillness After the Storm",
            "Exams are finally over. Slept for 10 hours straight last night, and waking up without an alarm felt like pure luxury. Walked around the campus lawn with Divya in the evening breeze. It's fascinating how different the campus looks when you aren't rushing between exam halls with panicked notes. I am worthy of rest even when I'm not producing something.",
            "Relieved",
            ["Post-Exam", "Rest", "Gratitude"],
            True
        ),
        (
            today - timedelta(days=10),
            "Handling My First Placement Rejection With Grace",
            "Didn't make the cut for the first software engineering shortlist today. Initially, I felt that familiar sinking pit in my stomach—the voice that whispers 'Maybe you aren't cut out for product companies.' But after journaling for 10 minutes and doing the 4-7-8 breathing exercise counsellor Nitu Singh Bhadouria recommended, the rational part of my brain came back online. One company's automated test score is not an appraisal of my intelligence or my career arc. Regrouping tomorrow with fresh energy.",
            "Reflective",
            ["Placement", "Resilience", "Mindfulness"],
            True
        ),
        (
            today - timedelta(days=2),
            "Finding My Rhythm Again",
            "This past week has felt so much more balanced. Going to bed by 11:15 PM and waking up at 7:15 AM consistently has made a noticeable difference in my afternoon fatigue. I haven't needed three cups of instant coffee just to stay awake in afternoon lectures. Taking care of my sleep isn't selfish—it's foundational.",
            "Grateful",
            ["Sleep", "Routine", "Balance"],
            True
        )
    ]

    for j_date, title, content, mood_tag, tags, is_priv in journals:
        j = JournalEntry(
            user_id=student.id,
            title=title,
            content=content,
            mood_tag=mood_tag,
            tags=json.dumps(tags),
            is_private=is_priv,
            entry_date=j_date,
            created_at=datetime.combine(j_date, datetime.min.time(), tzinfo=timezone.utc)
        )
        db.add(j)

    # 4. Seed Sample Appointments
    # Appointment 1: Completed
    apt_completed = Appointment(
        student_id=student.id,
        counsellor_id=counsellor_profile.id,
        appointment_date=today - timedelta(days=14),
        time_slot="02:00 PM - 03:00 PM",
        reason="Midterm exam panic and sleep disruption",
        student_shared_notes="Felt intense physical anxiety during study sessions, difficulty falling asleep.",
        share_wellbeing_summary=True,
        status="completed",
        meeting_room="Counselling Room, SAC I, First Floor",
        counsellor_private_notes="Discussed somatic anxiety signs. Introduced 4-7-8 diaphragmatic breathing and cognitive reframing of exam catastrophizing. Student responded well to grounding. Advised 11:30 PM screen curfew.",
        created_at=now - timedelta(days=16)
    )
    db.add(apt_completed)

    # Appointment 2: Approved upcoming
    apt_approved = Appointment(
        student_id=student.id,
        counsellor_id=counsellor_profile.id,
        appointment_date=today + timedelta(days=2),
        time_slot="03:00 PM - 04:00 PM",
        reason="Follow-up on placement interview stress management",
        student_shared_notes="Would like to practice grounding techniques specifically for technical interview anxiety.",
        share_wellbeing_summary=True,
        status="approved",
        meeting_room="Counselling Room, SAC I, First Floor",
        meeting_link="https://meet.mindbridge.campus/session-4089",
        created_at=now - timedelta(days=1)
    )
    db.add(apt_approved)

    # Appointment 3: Another student pending request for Counsellor 1
    # Create an additional dummy student for counsellor dashboard realism
    student2 = User(
        email="rohit.mehta@mindbridge.edu",
        password_hash=hash_password("student123"),
        full_name="Rohit Mehta",
        role="student",
        college_id="ME2024-1102",
        department="Mechanical Engineering",
        year_of_study="2nd Year",
        avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
        is_active=True
    )
    db.add(student2)
    db.flush()

    apt_pending = Appointment(
        student_id=student2.id,
        counsellor_id=counsellor_profile.id,
        appointment_date=today + timedelta(days=4),
        time_slot="11:00 AM - 12:00 PM",
        reason="Feeling isolated in hostel and academic adjustment difficulties",
        student_shared_notes="First time living away from home. Finding it hard to make friends in the department.",
        share_wellbeing_summary=False,
        status="pending",
        meeting_room="Counselling Room, SAC I, First Floor",
        created_at=now - timedelta(hours=6)
    )
    db.add(apt_pending)

    # 5. Seed Curated Wellbeing Resources
    resources = [
        WellbeingResource(
            title="The 4-7-8 Breathing Technique for Acute Stress & Panic",
            category="Stress Management",
            content_type="breathing",
            summary="A clinically validated breathwork technique developed to calm the sympathetic nervous system in under two minutes.",
            content="""### How the 4-7-8 Breathing Technique Works

The 4-7-8 breathing method, popularized by Dr. Andrew Weil, acts as a natural tranquilizer for the nervous system. When you deliberately lengthen your exhalation relative to your inhalation, your body stimulates the vagus nerve, lowering heart rate and blood pressure.

#### Step-by-Step Instructions:
1. **Empty Your Lungs:** Exhale completely through your mouth, making a gentle whoosh sound.
2. **Inhale (4 Seconds):** Close your mouth and inhale quietly through your nose for a mental count of **4**.
3. **Hold Your Breath (7 Seconds):** Hold your breath comfortably for a count of **7**.
4. **Exhale (8 Seconds):** Exhale completely through your mouth, making a whoosh sound for a count of **8**.
5. **Repeat:** Complete this cycle 4 times in total.

#### When to Use This in College:
- Right before walking into a test hall or viva examination.
- During technical coding rounds when your mind blanks out.
- When lying in bed unable to stop racing thoughts about grades or deadlines.
""",
            read_time_minutes=3,
            tags=json.dumps(["Breathing", "Acute Panic", "Exam Anxiety", "Instant Relief"]),
            is_featured=True
        ),
        WellbeingResource(
            title="Tackling Placement Rejection & Imposter Syndrome",
            category="Placement Preparation Stress",
            content_type="article",
            summary="Practical strategies for university students to separate their identity from shortlisting outcomes during recruitment drives.",
            content="""### Understanding the Psychology of Placement Season

Campus placement drives are uniquely stressful because they condense years of academic preparation into rapid-fire interviews, high-visibility WhatsApp groups, and relentless peer comparisons.

#### 1. Decouple Performance From Self-Worth
An interview rejection is not a character diagnosis. It is merely data about one company's specific algorithmic filter or staffing quota on that particular morning.

#### 2. Beware the Availability Heuristic
When someone lands a marquee job offer, everyone hears about it immediately. But behind every offer are dozens of unannounced rejections that classmates quietly absorb. You are never as uniquely 'behind' as you imagine.

#### 3. Focus on Process Milestones
Instead of measuring your day by whether you got an email callback, measure it by concrete daily commitments:
- Did you solve your two data structure problems?
- Did you practice explaining your project architecture out loud?
- Did you step away from screens and get proper rest?

#### 4. The 24-Hour Rule
Allow yourself 24 hours to grieve a missed opportunity or feel frustrated. After 24 hours, perform an objective retro: What technical question gave you friction? Refactor that topic, and move forward.
""",
            read_time_minutes=6,
            tags=json.dumps(["Placements", "Career Anxiety", "Imposter Syndrome", "Self Worth"]),
            is_featured=True
        ),
        WellbeingResource(
            title="The College Student's Guide to Sleep Hygiene During Finals",
            category="Sleep Hygiene",
            content_type="guide",
            summary="How to optimize sleep architecture without sacrificing academic productivity during intensive study weeks.",
            content="""### The Myth of the All-Nighter

Neuroimaging studies show that pulling an all-nighter impairs cognitive retrieval by up to 40%—the neurological equivalent of having a blood alcohol concentration of 0.10%. Sacrificing sleep to cram is biologically counterproductive.

#### Evidence-Based Sleep Rules for Campus:
- **Anchor Your Wake-Up Time:** Even if you slept 45 minutes later, try to wake up within a 30-minute window every day. Your circadian clock is primarily reset by morning light.
- **The 20-Minute Rebound:** If you're tossing and turning after 20 minutes, get out of bed. The bed must only be associated with sleep, not academic frustration.
- **The Screen Buffer:** Blue light from IDEs and phone screens suppresses melatonin synthesis. Switch to night mode at 8 PM and avoid screens 30 minutes before sleep.
- **Caffeine Half-Life:** Caffeine has an average half-life of 5 to 7 hours in young adults. A 4:00 PM cold brew is still circulating in your bloodstream at 11:00 PM.
""",
            read_time_minutes=5,
            tags=json.dumps(["Sleep Hygiene", "Circadian Rhythm", "Finals", "Productivity"]),
            is_featured=True
        ),
        WellbeingResource(
            title="The 5-4-3-2-1 Sensory Grounding Technique",
            category="Anxiety Management",
            content_type="exercise",
            summary="An effective somatic exercise to interrupt panic spirals and bring your awareness back into the present moment.",
            content="""### Grounding Yourself in the Present

When anxiety spikes, your brain enters survival mode, flooding you with worst-case scenarios. Grounding uses your sensory pathways to signal to your nervous system that you are physically safe right now.

#### The 5 Steps:
1. **5 Things You Can SEE:** Look around your room or lecture hall. Notice tiny details: a crack in a floor tile, the reflection on your water bottle, dust motes in sunlight.
2. **4 Things You Can TOUCH:** Feel the firmness of your chair beneath you, the fabric of your jeans, your notebook's texture, your feet rooted on the floor.
3. **3 Things You Can HEAR:** Listen beyond the obvious. A distant ceiling fan, birds outside the window, someone turning a page.
4. **2 Things You Can SMELL:** Pencil shavings, coffee, fresh air, hand sanitizer.
5. **1 Thing You Can TASTE:** A sip of water, mint gum, or simply notice the taste in your mouth.

End with a long, slow sigh.
""",
            read_time_minutes=4,
            tags=json.dumps(["Grounding", "Panic", "Anxiety", "Sensory"]),
            is_featured=False
        ),
        WellbeingResource(
            title="Overcoming Campus Isolation & Building Meaningful Ties",
            category="Emotional Wellbeing",
            content_type="article",
            summary="Navigating the unspoken epidemic of loneliness in university hostels and finding authentic community.",
            content="""### Loneliness in a Crowded Campus

It is entirely possible to be surrounded by hundreds of peers in a hostel mess or lecture hall and still feel acutely isolated. True connection is not about the quantity of your acquaintances; it is about feeling seen.

#### Low-Friction Ways to Reconnect:
- **Parallel Play:** You don't need intense conversations to connect. Studying alongside someone in the library or working on code side-by-side provides low-stakes social nourishment.
- **Join Micro-Interest Clubs:** From campus astronomy societies to badminton clubs, interest-based groups remove the awkwardness of small talk because you have an immediate shared topic.
- **Speak With a Counsellor:** If social anxiety is blocking you from stepping out, speaking with a campus counsellor can help you untangle core beliefs about acceptance.
""",
            read_time_minutes=5,
            tags=json.dumps(["Loneliness", "Hostel Life", "Friendships", "Campus Adaptation"]),
            is_featured=False
        ),
        WellbeingResource(
            title="Progressive Muscle Relaxation (PMR) for Deep Rest",
            category="Mindfulness and Meditation",
            content_type="exercise",
            summary="A systematic relaxation method to release physical muscle tension stored from prolonged study sessions.",
            content="""### What is Progressive Muscle Relaxation?

Under chronic academic stress, our shoulders hunch, jaws clench, and diaphragms tighten without us even noticing. PMR systematically tenses and then releases each muscle group so you learn the distinct physical contrast between tension and release.

#### Sequence:
1. **Feet & Toes:** Curl toes tightly for 5 seconds. Release and feel the warmth.
2. **Calves & Thighs:** Flex legs firmly for 5 seconds. Release completely.
3. **Abdomen:** Tighten your stomach muscles. Hold for 5 seconds. Release.
4. **Hands & Arms:** Clench fists and tighten biceps for 5 seconds. Release.
5. **Shoulders & Neck:** Shrug shoulders up toward your ears. Hold for 5 seconds. Drop them down completely.
6. **Face & Jaw:** Scrunch eyes and clench jaw gently for 5 seconds. Release.
""",
            read_time_minutes=4,
            tags=json.dumps(["PMR", "Body Scan", "Rest", "Tension Release"]),
            is_featured=False
        )
    ]

    for r in resources:
        db.add(r)

    # 6. Seed Notifications for Priya
    notifications = [
        Notification(
            user_id=student.id,
            title="Daily Wellbeing Check-in",
            message="Take 60 seconds to log today's mood and stress. Keep your self-awareness streak alive!",
            type="checkin",
            is_read=False,
            link="/mood-tracker",
            created_at=now - timedelta(hours=2)
        ),
        Notification(
            user_id=student.id,
            title="Counselling Appointment Confirmed",
            message="Nitu Singh Bhadouria has approved your appointment for follow-up on placement stress.",
            type="appointment",
            is_read=False,
            link="/appointments",
            created_at=now - timedelta(hours=18)
        ),
        Notification(
            user_id=student.id,
            title="New Weekly Wellbeing Insight",
            message="Your sleep consistency improved by 14% this week. See your updated correlation report.",
            type="recommendation",
            is_read=True,
            link="/insights",
            created_at=now - timedelta(days=2)
        )
    ]

    for n in notifications:
        db.add(n)

    db.commit()
    print("Database seeding completed successfully!")
