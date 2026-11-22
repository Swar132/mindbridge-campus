"""
Update wellbeing_resources table with 12 rewritten, highly engaging, practical student guides
covering all 6 official categories following the 6-part framework:
1. The situation
2. What you should know
3. Try this now
4. Quick challenge
5. Remember this
6. Learn more
"""
import sys
import json
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import SessionLocal
from app.models.resource import WellbeingResource

GUIDES = [
    # 1. Academic Life
    {
        "title": "The 80/20 Academic Triage for Finals: Surviving Heavy Syllabus Overload",
        "category": "Academic Life",
        "content_type": "guide",
        "summary": "Identify high-yield exam topics using past papers, active recall, and strategic prioritization when time is running out.",
        "read_time_minutes": 4,
        "tags": ["Academic Life", "Exam Preparation", "Time Management", "Study Techniques"],
        "is_featured": True,
        "content": """### 1. The Situation
Exams are approaching, your syllabus is unfinished, and you don't know where to begin without burning out by 2:00 AM?

### 2. What You Should Know
- **The 80/20 Rule:** 70% of exam marks consistently come from 20% of core recurring concepts across previous semesters.
- **Active Recall vs. Passive Reading:** Highlighting slides feels comforting but builds zero recall under actual exam pressure.
- **Cognitive Sprints:** Your brain retains vastly more in two 90-minute deep blocks than 10 exhausting, unfocused library hours.
- **Sleep Locks Memory:** Studying past midnight cuts memory retrieval speed by up to 40% during morning exams.

### 3. Try This Now
1. **Audit Past 5-Year Question Papers (PYQs):** Skim the last 5 years' papers first; list the 3 most recurring question themes before opening unit 1.
2. **Execute Blank-Sheet Active Recall:** Read a core derivation or algorithm once, close all tabs, and write down the key steps from memory on blank paper.
3. **Schedule Two 90-Minute Focus Sprints:** Dedicate Block 1 (morning) to high-weight derivations/algorithms, and Block 2 (afternoon) to practice problems.
4. **Enforce a Strict Midnight Cutoff:** Step away from study screens by 12:00 AM to allow your brain to consolidate facts into long-term memory.

### 4. Quick Challenge
**The 3-Column Triage (3 mins):** Take a blank sheet right now and write:
- **Must Master (60% marks):** Top 3 topics guaranteed to appear.
- **Should Know (30% marks):** Moderate-frequency concepts.
- **Skip for Now (10% marks):** Low-yield, high-effort outliers.
Commit to finishing Must Master before touching anything else.

### 5. Remember This
You don't need to finish everything today. You just need to know what to do next.

### 6. Learn More
- **Interactive Mini-Tools:** Launch the [Study Planner](#study-planner), [Pomodoro Focus Timer](#pomodoro), or [Exam Countdown](#exam-countdown).
- **Verified Sources:** Dunlosky et al. (2013), *Improving Students' Learning With Effective Learning Techniques*; Stanford Learning Lab.
- **Campus Academic Support:** Schedule a confidential session with campus counsellor Dr. Nitu Singh Bhadouria in SAC I, First Floor."""
    },
    {
        "title": "Defeating Chronic Academic Procrastination & Blank Screen Paralysis",
        "category": "Academic Life",
        "content_type": "article",
        "summary": "Proven cognitive protocols to lower activation energy, overcome the fear of imperfect drafts, and start major assignments.",
        "read_time_minutes": 4,
        "tags": ["Academic Life", "Procrastination", "Concentration", "Assignment Planning"],
        "is_featured": False,
        "content": """### 1. The Situation
A major assignment or lab submission is due soon, but you keep opening social media, checking reels, and staring helplessly at a blank screen?

### 2. What You Should Know
- **Procrastination is Emotional Regulation:** You aren't lazy; your brain is fleeing the discomfort and fear of producing an imperfect first attempt.
- **The Activation Barrier Drops Fast:** Once you push past the first 300 seconds of friction, cognitive resistance drops by over 80%.
- **Drafting & Editing Must Be Separated:** Demanding polished, error-free work on your very first line paralyzes working memory.
- **Environment Dictates Action:** A comfortable hostel bed invites sleep and entertainment; a quiet library desk invites immediate focus.

### 3. Try This Now
1. **Apply the 5-Minute Permission Rule:** Tell yourself: "I only have to work on this code or report for exactly 5 minutes. If I still want to stop, I can."
2. **Write an Intentionally Messy First Draft:** Type out raw bullet points or rough placeholder functions without checking grammar or formatting.
3. **Clear Your Digital Workspace:** Close all unrelated browser tabs, silence notifications, and place your phone inside your backpack out of sight.
4. **Relocate to High-Accountability Environments:** Study in the campus library or quiet reading room where the ambient focus of peers anchors your own.

### 4. Quick Challenge
**The Ugly First Bullet (2 mins):** Open your stalled assignment right now. Type 3 rough, unpolished bullet points stating what the final submission will contain. Do not edit them.

### 5. Remember This
Action precedes motivation. You do not need to feel like starting in order to start.

### 6. Learn More
- **Interactive Mini-Tools:** Open the [Pomodoro Focus Timer](#pomodoro) or [Study Planner](#study-planner) to time your 5-minute jumpstart.
- **Academic Sources:** Dr. Tim Pychyl, Procrastination Research Group (Carleton University); Dr. Piers Steel, *The Procrastination Equation*."""
    },

    # 2. Placement & Career
    {
        "title": "Tackling Placement Rejection & Imposter Syndrome in On-Campus Drives",
        "category": "Placement & Career",
        "content_type": "guide",
        "summary": "How to decouple your identity from corporate shortlists, handle peer comparisons, and maintain resilience throughout recruitment drives.",
        "read_time_minutes": 5,
        "tags": ["Placement & Career", "Placement Anxiety", "Rejection Handling", "Imposter Syndrome"],
        "is_featured": True,
        "content": """### 1. The Situation
You got eliminated from an on-campus recruitment drive while classmates are celebrating their offers, and you're questioning your entire capability?

### 2. What You Should Know
- **Shortlists are Noisy Data Points:** Selection depends on hiring quotas, keyword parsers, and interviewer subjectivity—never your lifelong capability.
- **Peer Comparison is Distorted:** Batchmate LinkedIn and WhatsApp posts highlight victories while hiding dozens of previous silent rejections.
- **Process Metrics Trump Outcome Metrics:** You cannot control interviewer decisions today; you can fully control whether you solved 2 problems and revised core CS topics.
- **Burnout is Cumulative:** Ignoring rejection fatigue leads to emotional depletion in subsequent company tests.

### 3. Try This Now
1. **Enforce the 24-Hour Emotional Processing Rule:** Give yourself 24 hours to feel disappointed or vent to a close friend. No self-judgment allowed.
2. **Conduct an Objective Post-Mortem:** After 24 hours, identify the exact friction point: Was it DSA speed, system design, or HR communication?
3. **Temporarily Mute High-Stress Placement Groups:** Take a 48-hour break from competitive student chat threads that trigger anxious spirals.
4. **Log One Controllable Technical Win Daily:** Solve one familiar LeetCode problem or revise one core DBMS concept to restore your momentum.

### 4. Quick Challenge
**The Resilience Inventory (3 mins):** Write down 3 non-academic challenges you navigated successfully in college (e.g., adapting to hostel life, mastering a tough subject, handling a difficult viva). Remind yourself of your adaptability.

### 5. Remember This
Placement rejection is simply redirection towards an environment that matches your authentic strengths.

### 6. Learn More
- **Interactive Mini-Tools:** Launch the [Placement Tracker](#placement-tracker) to log your DSA counts, or open [Mood Journaling](#mood-journal) to process interview emotions.
- **Academic Sources:** Dr. Carol Dweck (Mindset & Resilience Research); American Psychological Association (APA).
- **Campus Placement Counselling:** Visit campus counsellor Dr. Nitu Singh Bhadouria in SAC I, First Floor."""
    },
    {
        "title": "Technical Interview Anxiety: Mastering Whiteboard & Live Coding Rounds",
        "category": "Placement & Career",
        "content_type": "article",
        "summary": "Overcome mind-blanks, communicate effectively with interviewers, and tackle unexpected coding problems with composure.",
        "read_time_minutes": 4,
        "tags": ["Placement & Career", "Interview Preparation", "Career Uncertainty", "Job-Search Burnout"],
        "is_featured": False,
        "content": """### 1. The Situation
The interviewer pastes a difficult coding question into the shared editor, your mind goes completely blank, and your hands start trembling?

### 2. What You Should Know
- **Mind-Blanks are Physiological:** Anxiety diverts blood flow away from your prefrontal cortex; vocalizing your thoughts immediately restores cognitive control.
- **Collaboration Beats Silent Brilliance:** Companies hire engineers who communicate through ambiguity, not silent code dispensers who freeze under pressure.
- **Brute Force is a Valid First Step:** Stating an unoptimized approach first builds composure and buys crucial thinking time.
- **Clarifying Questions Signal Maturity:** Top candidates ask about edge cases and constraints before typing a single line of code.

### 3. Try This Now
1. **Verbalize Your Mental Stream Immediately:** Say aloud: "Let me restate the problem and confirm the expected inputs, outputs, and constraints."
2. **Ask Two Edge-Case Questions:** Clarify array length limits, negative values, duplicates, and null inputs before writing logic.
3. **Outline the Brute Force Approach First:** State the obvious solution, calculate its Big-O time and space complexity, and pinpoint where the bottleneck lies.
4. **Treat the Interviewer as a Teammate:** If stuck, say: "I am evaluating two approaches—a hash map versus a two-pointer technique. Let me analyze the trade-offs."

### 4. Quick Challenge
**The 2-Minute Vocal Walkthrough (2 mins):** Pick any coding problem (e.g., Two Sum or Valid Palindrome). Stand up and explain the solution out loud to the room as if teaching a beginner, without writing code.

### 5. Remember This
Interviewers aren't grading you on knowing the answer instantly. They are observing how you think when you don't know the answer.

### 6. Learn More
- **Interactive Mini-Tools:** Practice timed focus sprints with the [Pomodoro Focus Timer](#pomodoro) and log DSA progress in [Placement Tracker](#placement-tracker).
- **Recommended Practice Platforms:** [LeetCode](https://leetcode.com/) and [GeeksforGeeks](https://www.geeksforgeeks.org/).
- **Academic Sources:** Gayle Laakmann McDowell, *Cracking the Coding Interview*; MIT Global Education & Career Development Center."""
    },

    # 3. Mental & Emotional Wellbeing
    {
        "title": "The 5-4-3-2-1 Sensory Grounding Technique for Acute Anxiety & Panic",
        "category": "Mental & Emotional Wellbeing",
        "content_type": "exercise",
        "summary": "An evidence-based somatic practice to halt pre-exam panic attacks, ground racing thoughts, and regulate your nervous system.",
        "read_time_minutes": 3,
        "tags": ["Mental & Emotional Wellbeing", "Anxiety Management", "Emotional Regulation", "Grounding"],
        "is_featured": True,
        "content": """### 1. The Situation
Your heart is pounding, your chest feels tight before an exam or presentation, and your mind is spiraling into worst-case catastrophe?

### 2. What You Should Know
- **Anxiety Traps You in the Future:** Anxiety lives in hypothetical future disasters; your physical senses anchor you firmly in the present moment.
- **Somatic Grounding Bypasses Mental Loops:** You cannot think your way out of a physiological fight-or-flight response; you must ground the body first.
- **Sensory Scanning Regulates Heart Rate:** Engaging five distinct sensory circuits activates the parasympathetic rest-and-digest response.
- **Everyday Practice Builds Automatic Reflexes:** Practicing grounding during low-stress moments makes it effortless to trigger during acute exam panic.

### 3. Try This Now
1. **5 Things You SEE:** Look around your room. Name 5 specific items (e.g. desk grain, blue pen cap, window shadow, ceiling fan, water droplet).
2. **4 Things You TOUCH:** Feel 4 physical textures (e.g. your feet flat on the floor, your cotton sleeve, the cold metal desk, the rough paper edge).
3. **3 Things You HEAR:** Listen closely for 3 distinct sounds (e.g. fan hum, distant campus footsteps, birds outside).
4. **2 Things You SMELL:** Inhale deeply through your nose and detect 2 subtle scents (e.g. pencil wood, coffee, fresh air).
5. **1 Thing You TASTE:** Notice the lingering taste of mint or water, or relax your tongue against the floor of your mouth.

### 4. Quick Challenge
**The 60-Second Physical Unclench (2 mins):** Drop your shoulders away from your ears, unclench your jaw, uncross your legs, and place both feet flat on the floor. Take two slow, deep 4-second belly breaths.

### 5. Remember This
Anxiety is a physical sensation, not a forecast of the future. You are safe in this present moment.

### 6. Learn More
- **Interactive Mini-Tools:** Launch the [Breathing & Grounding Tool](#breathing-grounding) for an animated 4-7-8 pacer, or reflect in [Mood Journaling](#mood-journal).
- **Free 24/7 National Mental Health Helpline:** Call **Tele-MANAS** toll-free at **14416** or **1800-891-4416** (Govt of India).
- **Campus Counsellor:** Visit Dr. Nitu Singh Bhadouria in SAC I, First Floor (Confidential student support)."""
    },
    {
        "title": "Untangling Cognitive Distortions: Halting the 'I am Going to Fail' Spiral",
        "category": "Mental & Emotional Wellbeing",
        "content_type": "article",
        "summary": "Identify common thinking traps like catastrophizing, black-and-white thinking, and mind-reading, and replace them with cognitive balance.",
        "read_time_minutes": 4,
        "tags": ["Mental & Emotional Wellbeing", "Overthinking", "Confidence", "Motivation"],
        "is_featured": False,
        "content": """### 1. The Situation
One poor quiz score or difficult viva happens, and suddenly your brain convinces you that your semester GPA is ruined and your future is over?

### 2. What You Should Know
- **Thoughts are Hypotheses, Not Facts:** Your anxious mind generates catastrophic narratives that feel intensely true but have zero factual proof.
- **The All-or-Nothing Trap:** Believing that anything less than 100% is an absolute failure is a distorted cognitive lens that paralyzes effort.
- **Emotional Reasoning Distorts Reality:** Feeling overwhelmed about a subject does not mean you lack the intellect to master it.
- **The Best-Friend Test:** You would never speak to a struggling hostel friend with the brutal criticism your inner voice directs at yourself.

### 3. Try This Now
1. **Spot Absolute Words:** Catch yourself using catastrophic terms like "always", "never", "ruined", or "completely impossible".
2. **Cross-Examine the Evidence:** Ask: What verifiable facts support this fear? What verifiable facts prove I have handled tough situations before?
3. **Calculate the Realistic Likely Outcome:** Ask yourself: What is the worst-case scenario? What is the best-case? What is the realistic 80% outcome?
4. **Reframe with Third-Person Compassion:** Address yourself by name and state one objective, balanced sentence about the situation.

### 4. Quick Challenge
**The Thought on Trial (3 mins):** Write down your single most stressful thought today. Below it, write one balanced, factual sentence that counters it without toxic positivity.

### 5. Remember This
You don't have to believe everything your anxious brain tells you. Thoughts are suggestions, not verdicts.

### 6. Learn More
- **Interactive Mini-Tools:** Use [Mood Journaling Prompts](#mood-journal) to untangle distorted thoughts, and set micro-steps in [Goal Planner](#goal-planner).
- **Academic Sources:** Dr. David D. Burns, *Feeling Good: The New Mood Therapy*; Beck Institute for Cognitive Behavior Therapy.
- **Campus Support:** Connect with campus counsellor Dr. Nitu Singh Bhadouria in SAC I, First Floor."""
    },

    # 4. Sleep & Physical Health
    {
        "title": "The Circadian Reset for Night-Owl University Students",
        "category": "Sleep & Physical Health",
        "content_type": "guide",
        "summary": "A practical roadmap to repair erratic college sleep schedules, eliminate morning brain fog, and align with natural sleep architecture.",
        "read_time_minutes": 5,
        "tags": ["Sleep & Physical Health", "Sleep Routines", "Managing Fatigue", "Healthy Habits"],
        "is_featured": True,
        "content": """### 1. The Situation
You fall asleep at 3:30 AM browsing your phone, dread your 8:30 AM lectures, and struggle with heavy brain fog throughout every afternoon?

### 2. What You Should Know
- **Wake Time Anchors the Circadian Clock:** You cannot force sleep onset, but waking up at a fixed hour sets an automatic 14-hour timer for evening melatonin.
- **Morning Sunlight is Non-Negotiable:** Viewing natural outdoor light within 60 minutes of waking halts melatonin and triggers daytime alertness.
- **Caffeine Has a 6-Hour Half-Life:** An afternoon coffee at 4:00 PM leaves 50% of the stimulant active in your bloodstream at 10:00 PM.
- **Weekend Binge Sleeping Worsens Jetlag:** Sleeping in until 1:00 PM on Sunday causes social jetlag, making Monday morning feel excruciating.

### 3. Try This Now
1. **Lock in Your Wake-Up Time:** Set a consistent wake alarm for the next 7 days (+/- 30 mins), even on weekends.
2. **Get 10 Minutes of Outdoor Morning Light:** Step outside to the campus quad or hostel balcony before heading to your first lecture.
3. **Enforce the 2:00 PM Caffeine Cutoff:** Switch to water or herbal tea after lunch so caffeine does not disrupt slow-wave deep sleep.
4. **Cool Down Your Sleep Environment:** Lowering your core body temperature by just 1°C is a primary biological trigger for falling asleep quickly.

### 4. Quick Challenge
**The Digital Sunset Alarm (2 mins):** Set a daily recurring alarm on your phone for 11:00 PM titled: *"Screen Dim & Wind Down"*. Place your phone across your room away from your bed.

### 5. Remember This
Consistency in your morning wake-up time is the anchor that naturally brings bedtime into healthy alignment.

### 6. Learn More
- **Interactive Mini-Tools:** Track your sleep consistency and bedtime habits with the [Daily Habit Tracker](#habit-tracker).
- **External Resources:** [NHS Sleep and Tiredness Guidance](https://www.nhs.uk/live-well/sleep-and-tiredness/).
- **Academic Sources:** Dr. Matthew Walker, *Why We Sleep* (UC Berkeley Sleep Center); Harvard Medical School Division of Sleep Medicine."""
    },
    {
        "title": "Managing Hostel Fatigue, Hydration & Screen Exhaustion",
        "category": "Sleep & Physical Health",
        "content_type": "article",
        "summary": "Physical habits to combat sedentary desk fatigue, digital eye strain, and hostel dehydration for peak daily energy.",
        "read_time_minutes": 4,
        "tags": ["Sleep & Physical Health", "Screen-Time Management", "Exercise", "Hydration"],
        "is_featured": False,
        "content": """### 1. The Situation
You've spent 7 hours hunched over a laptop in a cramped hostel room, your eyes burn, your neck aches, and you feel completely drained of energy?

### 2. What You Should Know
- **Sedentary Brain Fog is Physical:** Continuous sitting reduces cerebral blood flow, causing physical sluggishness often mistaken for academic burnout.
- **Mild Dehydration Destroys Concentration:** A 2% drop in body water volume reduces working memory and cognitive processing speed by up to 20%.
- **The 20-20-20 Rule Relaxes Eye Muscles:** Staring at close-range screens cramps your ciliary eye muscles; long-distance gaze resets them.
- **Movement Clears Adenosine:** A quick 10-minute campus walk clears sleep pressure and boosts alertness faster than an extra cup of coffee.

### 3. Try This Now
1. **Deploy the 20-20-20 Eye Protocol:** Every 20 minutes, look at an object at least 20 feet away (out the window) for 20 seconds.
2. **Use the 2-Bottle Desk Anchor:** Keep a 1-liter water bottle on your desk; finish Bottle 1 before lunch and Bottle 2 before dinner.
3. **Take a 10-Minute Campus Sunlight Walk:** Stride briskly around the academic complex or sports ground between lectures to restore circulation.
4. **Decompress Your Desk Posture:** Perform 60 seconds of doorway chest openers and hip flexor stretches after every 90 minutes of study.

### 4. Quick Challenge
**The 60-Second Physical Reboot (2 mins):** Stand up right now. Drink a full glass of water, look out the window into the far distance, and roll your shoulders backward 10 times.

### 5. Remember This
Your cognitive stamina can never outperform your physical baseline. Protect your body to sharpen your mind.

### 6. Learn More
- **Interactive Mini-Tools:** Log daily water intake and movement streaks in the [Daily Habit Tracker](#habit-tracker).
- **Academic Sources:** American Academy of Ophthalmology; Mayo Clinic Health System."""
    },

    # 5. Relationships & Social Life
    {
        "title": "Hostel Roommate Dynamics: Setting Boundaries Without Creating Drama",
        "category": "Relationships & Social Life",
        "content_type": "guide",
        "summary": "How to communicate assertively, resolve late-night noise disputes, and establish peaceful boundaries in shared student living spaces.",
        "read_time_minutes": 4,
        "tags": ["Relationships & Social Life", "Hostel Adjustment", "Boundaries", "Conflict Resolution"],
        "is_featured": True,
        "content": """### 1. The Situation
Your roommate plays loud audio, keeps lights on until 3 AM, or invites friends over without asking, and you dread going back to your room?

### 2. What You Should Know
- **Silent Resentment Guarantees Conflict:** Tolerating boundary violations in silence guarantees eventual emotional explosions over minor issues.
- **'I-Statements' Defuse Defensiveness:** Framing requests around your schedule ("I need quiet to sleep") prevents roommates from feeling attacked.
- **Specific Logistics Beat General Complaints:** Agreeing on concrete rules (e.g. desk lamps after 11 PM) resolves 90% of living space tensions.
- **Shared Living Requires Mutual Compromise:** Neither roommate gets 100% of their preferences; peace comes from agreed-upon practical compromises.

### 3. Try This Now
1. **Have the Conversation When Calm:** Never raise an issue during a tense midnight moment; talk casually during the day over tea or lunch.
2. **Use the 'I-Statement' Formula:** Say: "I have an 8 AM lab tomorrow and need to sleep by midnight, so could we switch off the overhead light at 11:30 PM?"
3. **Establish Practical Night Logistics:** Agree that phone calls after 11 PM happen in the corridor and study lamps replace main room lights.
4. **Know When to Seek Campus Mediation:** If basic safety, hygiene, or academic boundaries are ignored repeatedly, consult your hostel warden or floor senior.

### 4. Quick Challenge
**Draft One Respectful Request (3 mins):** Identify your single biggest living space friction point. Write a polite, two-sentence 'I-statement' request that you can share with your roommate today.

### 5. Remember This
Clear, kind boundaries are the foundation of healthy relationships, not a sign of hostility.

### 6. Learn More
- **Interactive Mini-Tools:** Journal through social frustration using [Mood Journaling](#mood-journal) or set actionable communication goals in [Goal Planner](#goal-planner).
- **Academic Sources:** Dr. Marshall Rosenberg, *Nonviolent Communication*; Harvard Division of Student Life.
- **Campus Mediation Support:** Confidential assistance is available with Dr. Nitu Singh Bhadouria in SAC I, First Floor."""
    },
    {
        "title": "Navigating Homesickness & Building Your Authentic Campus Tribe",
        "category": "Relationships & Social Life",
        "content_type": "article",
        "summary": "Overcome campus loneliness, bridge cultural transitions, and create meaningful, low-pressure connections in university.",
        "read_time_minutes": 4,
        "tags": ["Relationships & Social Life", "Homesickness", "Friendships", "Peer Pressure"],
        "is_featured": False,
        "content": """### 1. The Situation
You feel out of place in your hostel, miss home cooking and your family, and worry that everyone else has already found their lifelong friend group?

### 2. What You Should Know
- **The Adaptation Curve is Universal:** Research shows the first 6 to 10 weeks of university are the hardest; feeling disconnected initially is completely normal.
- **Large Social Groups Often Lack Depth:** Those large, loud groups you see on campus are often just as superficial and insecure as you feel.
- **Parallel Routine Builds Natural Friendships:** You don't need charismatic small talk; simply inviting someone to study side-by-side in the library creates connection.
- **Niche Interests Beat Broad Crowds:** Joining one club that matches your authentic hobby introduces you to peers with whom you already share real common ground.

### 3. Try This Now
1. **Practice Low-Pressure 'Study Buddy' Invites:** Ask a classmate: "Hey, are you heading to the library to work on the lab assignment? Want to sit together?"
2. **Join One Technical or Cultural Club:** Attend a meeting for robotics, open-source coding, debate, photography, or music where shared projects remove awkwardness.
3. **Schedule Structured Calls Home:** Call family at a set hour (e.g. 8:00 PM for 20 minutes) so you stay connected without withdrawing from campus life.
4. **Establish One Daily Campus Routine:** Eat meals at consistent times or visit the student center regularly; familiar faces quickly become casual acquaintances.

### 4. Quick Challenge
**The 1-Tap Connection (2 mins):** Send a short message to a classmate: *"Hey, are you heading to the afternoon lecture? Want to grab a quick tea before it starts?"*

### 5. Remember This
Belonging is not something you discover instantly; it is something you build through repeated micro-moments of shared everyday life.

### 6. Learn More
- **Interactive Mini-Tools:** Reflect on campus transitions in [Mood Journaling Prompts](#mood-journal) or track social habits in [Daily Habit Tracker](#habit-tracker).
- **Academic Sources:** Journal of College Student Development; National Center for Higher Education.
- **Campus Support:** Connect with campus counsellor Dr. Nitu Singh Bhadouria in SAC I, First Floor."""
    },

    # 6. Productivity & Personal Growth
    {
        "title": "The Pomodoro Technique & Deep Work for Engineering Students",
        "category": "Productivity & Personal Growth",
        "content_type": "guide",
        "summary": "Master single-tasking, eliminate phone distractions, and achieve 3x output in half the study time with structured intervals.",
        "read_time_minutes": 4,
        "tags": ["Productivity & Personal Growth", "Discipline", "Daily Planning", "Time Management"],
        "is_featured": True,
        "content": """### 1. The Situation
You sit down to code or study for 4 hours, but end up checking notifications every 5 minutes and make almost zero real progress?

### 2. What You Should Know
- **Attention Residue Ruins Focus:** Every quick glance at your phone leaves cognitive residue in working memory that takes up to 20 minutes to clear.
- **25 Minutes Has Low Activation Friction:** Committing to 25 minutes of single-tasking feels manageable to your brain and breaks task avoidance.
- **Breaks Must Be Screen-Free:** Scrolling short-form videos during breaks floods dopamine receptors and destroys focus for your next session.
- **Deep Work Trumps Long Hours:** Two hours of intense, distraction-free concentration achieves more than eight hours of fragmented multi-tasking.

### 3. Try This Now
1. **Choose Exactly ONE Tangible Goal:** Before starting your timer, write: "Solve questions 3 and 4 of the tutorial sheet." Do not switch tasks mid-session.
2. **Keep a Physical 'Distraction Pad':** When an urge to check something strikes ("look at WhatsApp", "buy shoes"), write it on the pad and return to work.
3. **Run 25-Minute Work / 5-Minute Break Cycles:** Set the timer, work with zero interruptions, and step away immediately when the chime sounds.
4. **Take True Rest Breaks:** During your 5-minute break, stand up, drink water, stretch, or look out the window—keep your phone face down.

### 4. Quick Challenge
**Phone Lockdown Sprint (2 mins):** Turn on Do Not Disturb, place your phone out of arm's reach inside your backpack, and start your first 25-minute Pomodoro session.

### 5. Remember This
Two hours of pure single-tasking focus will always outperform eight hours of distracted lingering.

### 6. Learn More
- **Interactive Mini-Tools:** Launch the [Pomodoro Focus Timer](#pomodoro) right now or plan your blocks in [Study Planner](#study-planner).
- **External Resources:** [Notion for Education](https://www.notion.com/product/notion-for-education) for organizing course wikis.
- **Academic Sources:** Cal Newport, *Deep Work: Rules for Focused Success in a Distracted World*; Francesco Cirillo, *The Pomodoro Technique*."""
    },
    {
        "title": "Goal Chunking: Turning Big Semester Ambitions into Daily Sprints",
        "category": "Productivity & Personal Growth",
        "content_type": "guide",
        "summary": "Transform overwhelming ambitions like landing a marquee placement or maintaining an 8.5 CGPA into frictionless daily micro-actions.",
        "read_time_minutes": 4,
        "tags": ["Productivity & Personal Growth", "Goal Setting", "Habit Building", "Self-Reflection"],
        "is_featured": False,
        "content": """### 1. The Situation
You set ambitious goals at the start of the semester ("Crack 300 DSA questions", "Get a 9.0 GPA"), but feel so overwhelmed that you don't do anything?

### 2. What You Should Know
- **Big Goals Paralyze the Brain:** Giant goals trigger intimidation; breaking them into 14-day sprints restores executive control.
- **Lead Measures Beat Lag Measures:** "Get placed at a top company" is a lag measure you can't control today; "Solve 1 DSA problem before noon" is a lead measure you own.
- **Habit Stacking Lowers Resistance:** Attaching a new habit to an existing routine (e.g. "After morning tea, revise 1 page of notes") makes consistency automatic.
- **Systems Outlast Willpower:** Relying on inspiration fails during exam week; having a daily recurring checklist guarantees steady execution.

### 3. Try This Now
1. **Deconstruct Your Semester Goal into 14-Day Sprints:** If your goal is 60 coding problems this term, that is simply 1 problem a day with rest days.
2. **Define One Non-Negotiable Lead Measure:** Choose one specific action you will complete every single day before checking social media.
3. **Use the 2-Minute Entry Rule:** Make the starting step so easy it is impossible to say no (e.g. open the textbook and read 1 definition).
4. **Run a 10-Minute Sunday Retrospective:** Every Sunday night, review your habit tracker, celebrate wins, and set 3 micro-goals for next week.

### 4. Quick Challenge
**The 1-Micro Step Definition (3 mins):** Pick your biggest academic or placement ambition right now. Write down the single smallest physical action you can complete in the next 10 minutes to move it forward.

### 5. Remember This
You do not rise to the level of your goals; you fall to the level of your daily systems.

### 6. Learn More
- **Interactive Mini-Tools:** Launch the [Goal Planner](#goal-planner) to decompose your ambitions and sync with Mindy AI, or track daily streaks in [Daily Habit Tracker](#habit-tracker).
- **Academic Sources:** James Clear, *Atomic Habits*; Stephen Covey & Chris McChesney, *The 4 Disciplines of Execution*."""
    }
]

def update_resources():
    db = SessionLocal()
    try:
        existing = db.query(WellbeingResource).all()
        print(f"Found {len(existing)} existing resources in local database.")
        
        # Delete existing to replace with our 12 comprehensive guides
        db.query(WellbeingResource).delete()
        db.flush()

        for g in GUIDES:
            res = WellbeingResource(
                title=g["title"],
                category=g["category"],
                content_type=g["content_type"],
                summary=g["summary"],
                content=g["content"],
                read_time_minutes=g["read_time_minutes"],
                tags=json.dumps(g["tags"]),
                is_featured=g["is_featured"]
            )
            db.add(res)
        
        db.commit()
        count = db.query(WellbeingResource).count()
        print(f"Successfully seeded {count} comprehensive resources across all 6 categories in local DB!")
        for r in db.query(WellbeingResource).all():
            print(f"- [{r.id}] ({r.category}) {r.title}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding resources: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_resources()
