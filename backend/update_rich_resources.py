"""
Update wellbeing_resources table with 12 comprehensive, actionable college guides
covering all 6 official categories.
"""
import sys
import json
import os
sys.path.insert(0, 'backend')

from app.database import SessionLocal
from app.models.resource import WellbeingResource

GUIDES = [
    # 1. Academic Life
    {
        "title": "The 80/20 Academic Triage for Finals: Surviving Heavy Syllabus Overload",
        "category": "Academic Life",
        "content_type": "guide",
        "summary": "How to identify high-yield exam topics using past papers, active recall, and strategic prioritization when time is running out.",
        "read_time_minutes": 5,
        "tags": ["Academic Life", "Exam Preparation", "Time Management", "Study Techniques"],
        "is_featured": True,
        "content": """### The Problem & College Context
Midterm and end-term examination schedules frequently pack 4 to 5 dense engineering or university papers into a 6-day window. When faced with 500+ lecture slides per subject, students often panic, attempt to read everything line-by-line, and succumb to cognitive fatigue by 2:00 AM. Trying to master everything equally leads to mastering nothing thoroughly.

### Practical Action Steps
1. **Analyze Past 5-Year Question Papers (PYQs):** 70% of exam questions in university curricula originate from the same 20% core conceptual clusters. Before reading unit 1, cross-reference the last 5 years' papers and list the recurring question themes.
2. **Implement Blank-Sheet Active Recall:** Passive highlighting gives an illusion of competence. Read a core derivation or algorithm, close your laptop, and write the key steps on a blank sheet of paper from memory.
3. **Execute Three 90-Minute Focus Blocks:** Do not linger in the library for 10 unfocused hours. Schedule three distinct 90-minute Pomodoro sprints (Morning: High Complexity Math/Algo; Afternoon: Theory/Definitions; Evening: Problem Sets).
4. **Enforce a Hard Midnight Cutoff:** Cognitive neuroimaging proves that sleep deprivation impairs memory retrieval by up to 40%. Stop studying by midnight so your brain can consolidate synaptic connections into long-term memory.

### 2-Minute Micro-Activity
Grab a blank piece of paper right now. Divide it into three columns:
- **Column A (Must Master - 60% of marks):** Top 3 recurring exam topics.
- **Column B (Should Know - 30% of marks):** Moderate likelihood concepts.
- **Column C (Skip or Skim - 10% of marks):** Low-yield, high-effort outliers.
Commit to finishing Column A before touching anything else.

### Realistic College Life Example
A 3rd-year engineering student in the hostel has both Operating Systems and Computer Networks exams scheduled 24 hours apart in SAC-I. Instead of panicking over 18 syllabus chapters, she filters for the top 5 recurring questions (Process Synchronization, Paging, TCP/IP handshake, Distance Vector routing) and completes active recall drills on them, securing 75% of the syllabus in 4 hours.

### Quick Takeaway Mental Anchor
*"Retrieval builds memory; passive reading only builds familiarity."*

### Related Tools & Source References
- **Related Interactive Tools:** Study Planner, Pomodoro Focus Timer, Exam Countdown Planner.
- **Academic Sources:** Dunlosky et al. (2013), *Improving Students' Learning With Effective Learning Techniques*; Stanford Learning Lab."""
    },
    {
        "title": "Defeating Chronic Academic Procrastination & Blank Screen Paralysis",
        "category": "Academic Life",
        "content_type": "article",
        "summary": "Proven cognitive protocols to lower activation energy, overcome the fear of imperfect drafts, and start major assignments.",
        "read_time_minutes": 4,
        "tags": ["Academic Life", "Procrastination", "Concentration", "Assignment Planning"],
        "is_featured": False,
        "content": """### The Problem & College Context
Procrastination is rarely about laziness; it is almost always an emotional regulation issue driven by the fear of imperfect execution. When faced with a 20-page lab report, capstone proposal, or tricky coding project, the brain treats the assignment as a threat and flees to low-friction dopamine hits (reels, gaming, snacking).

### Practical Action Steps
1. **The 5-Minute Permission Rule:** Tell yourself: "I only have to work on this code or essay for exactly 5 minutes. If I still want to stop after 5 minutes, I have full permission to walk away." In 80% of cases, breaking the activation barrier keeps you going.
2. **Lower Activation Friction to Zero:** Open the IDE or Word document, write your name, title, and three placeholder comments. Do not attempt to write brilliant prose or optimized code initially.
3. **Separate Drafting From Editing:** When writing code or reports, turn off autocorrect or linter warnings during initial brainstorming. Produce a 'messy first draft' without self-censorship.
4. **Relocate to High-Accountability Environments:** Study in the campus library or quiet reading room where the ambient social proof of other students working inhibits frivolous phone checking.

### 2-Minute Micro-Activity
Open the document or code file you have been postponing the longest. Type 3 rough, unpolished bullet points stating what the final submission should contain. Do not edit them.

### Realistic College Life Example
A student has delayed starting their semester database mini-project for 2 weeks because they felt they didn't know how to architect the schema perfectly. By applying the 5-minute rule, they simply wrote the `CREATE TABLE` statements for two basic entities. The psychological friction vanished, and they finished the entire schema within 45 minutes.

### Quick Takeaway Mental Anchor
*"Action precedes motivation. You do not need to feel like starting in order to start."*

### Related Tools & Source References
- **Related Interactive Tools:** Pomodoro Focus Timer, Study Planner.
- **Academic Sources:** Dr. Tim Pychyl, Procrastination Research Group (Carleton University); Dr. Piers Steel, *The Procrastination Equation*."""
    },

    # 2. Placement & Career
    {
        "title": "Tackling Placement Rejection & Imposter Syndrome in On-Campus Drives",
        "category": "Placement & Career",
        "content_type": "guide",
        "summary": "How to decouple your identity from corporate shortlists, handle peer comparisons, and maintain resilience throughout recruitment drives.",
        "read_time_minutes": 6,
        "tags": ["Placement & Career", "Placement Anxiety", "Rejection Handling", "Imposter Syndrome"],
        "is_featured": True,
        "content": """### The Problem & College Context
Campus placement season is one of the most psychologically taxing periods of higher education. High-visibility WhatsApp notifications, batchmate LinkedIn updates, and sudden rejections after multiple rounds of technical assessments trigger intense imposter syndrome, self-doubt, and panic.

### Practical Action Steps
1. **Decouple Assessment Outcomes From Personal Worth:** A company shortlist is not a verdict on your intellect or lifelong capability. It is a noisy data point influenced by company hiring headcounts, resume keyword algorithms, and interviewer subjectivity.
2. **Enforce the 24-Hour Emotional Processing Rule:** Give yourself 24 hours to feel disappointed or vent to a close friend. After 24 hours, shift from emotion to objective retrospection: Which DSA topic or behavioral question created friction? Refactor that specific skill.
3. **Focus on Process Metrics Over Outcome Metrics:** You cannot control whether an interviewer gives an offer today. You can completely control whether you solved 2 LeetCode problems, practiced 1 mock interview, and slept 7.5 hours.
4. **Mute High-Stress Peer Channels:** Temporarily mute batchmate celebration threads or competitive groups during heavy drive weeks if they trigger obsessive downward comparisons.

### 2-Minute Micro-Activity
Write down three non-academic, non-resume challenges you successfully navigated during your college life (e.g., adapting to hostel life, learning to budget, handling difficult professors). Remind yourself of your adaptability.

### Realistic College Life Example
A student clears three rounds of tests for a marquee recruitment drive but gets eliminated in the managerial HR interview. Feeling devastated while classmates celebrate in the hostel corridor, he implements the 24-hour rule, identifies that his project architecture explanation lacked clarity, practices the STAR framework using the Placement Tracker, and secures an offer with another company two weeks later.

### Quick Takeaway Mental Anchor
*"Rejection is redirection towards environments that match your authentic strengths."*

### Related Tools & Source References
- **Related Interactive Tools:** Placement Preparation Tracker, Mood Journaling Prompts.
- **Academic Sources:** Dr. Carol Dweck (Mindset & Resilience Research); American Psychological Association (APA)."""
    },
    {
        "title": "Technical Interview Anxiety: Mastering Whiteboard & Live Coding Rounds",
        "category": "Placement & Career",
        "content_type": "article",
        "summary": "Overcome mind-blanks, communicate effectively with interviewers, and tackle unexpected coding problems with composure.",
        "read_time_minutes": 5,
        "tags": ["Placement & Career", "Interview Preparation", "Career Uncertainty", "Job-Search Burnout"],
        "is_featured": False,
        "content": """### The Problem & College Context
During live coding rounds or whiteboard interviews, anxiety triggers the sympathetic nervous system, draining blood flow from the prefrontal cortex. This causes students to freeze, experience 'mind blanks' on familiar algorithms, and jump straight into buggy code without thinking through constraints.

### Practical Action Steps
1. **Verbalize Your Mental Stream Immediately:** The moment the question is posted, start talking: "Let me restate the problem to make sure I understand the constraints and edge cases." Speaking activates language centers and halts panic spirals.
2. **Clarify Inputs, Outputs, and Scale:** Always ask 2 clarifying questions: "Can the array contain negative numbers?" "What is the upper bound on N?" This demonstrates engineering maturity and buys valuable thinking time.
3. **Write the Brute-Force Solution First:** Never stress about writing an optimal O(N) solution in minute one. State the brute force O(N^2) approach, calculate its complexity, and explain where the bottleneck lies.
4. **Treat the Interviewer as a Teammate:** Interviewers want to see how you collaborate. When stuck, state your hypothesis clearly: "I am considering a two-pointer approach, but I am evaluating whether sorting the array first violates time limits."

### 2-Minute Micro-Activity
Pick a simple coding problem (e.g., Valid Palindrome or Two Sum). Stand up and explain the solution out loud for 2 minutes to your room as if you were teaching a beginner, without writing code.

### Realistic College Life Example
During an online interview with a tech company, a student is asked a tricky binary search variation and feels their mind go blank. Instead of typing silently, they pause, take a deep belly breath, and say: "I am observing that the array is rotated. Let me identify which half is strictly sorted." The interviewer nods, provides a gentle nudge, and the student successfully solves the problem.

### Quick Takeaway Mental Anchor
*"Interviewers do not look for code dispensers; they look for engineers who communicate through ambiguity."*

### Related Tools & Source References
- **Related Interactive Tools:** Placement Preparation Tracker, Pomodoro Focus Timer.
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
        "content": """### The Problem & College Context
Acute anxiety often strikes right before oral vivas, project presentations, or when opening grade portals. The body releases cortisol and adrenaline, causing shallow breathing, rapid heartbeats, trembling hands, and catastrophic looping thoughts ("I'm going to fail, everyone will see").

### Practical Action Steps
1. **5 Things You Can SEE:** Look around your immediate environment. Name 5 specific items: the wood grain on the desk, a blue notebook, dust motes in the window light, a ceiling fan blade, a water bottle cap.
2. **4 Things You Can TOUCH:** Feel 4 physical textures: your feet pressed into the floor, the rough cotton of your jeans, the cool edge of your phone, the smoothness of your pen.
3. **3 Things You Can HEAR:** Listen beyond the room. Notice 3 distinct sounds: the distant hum of traffic outside the hostel, keyboard keys clicking, a bird chirping.
4. **2 Things You Can SMELL:** Inhale through your nose. Notice the faint scent of coffee, paper, or fresh air.
5. **1 Thing You Can TASTE:** Notice the lingering taste of mint, water, or simply bring awareness to your tongue resting in your mouth.

### 2-Minute Micro-Activity
Stop right now. Rest both feet flat on the floor, unclench your jaw, drop your shoulders away from your ears, and name three green or blue objects in your room.

### Realistic College Life Example
A 2nd-year student waiting in line outside the SAC-I seminar hall for an external viva feels her heart pounding violently and palms sweating. She executes the 5-4-3-2-1 scan, focusing on the tile pattern on the floor and the texture of her ID card lanyard. Her heart rate slows from 125 bpm to normal, allowing her to answer questions clearly.

### Quick Takeaway Mental Anchor
*"Your senses are your anchors: anxiety lives in the future, but your senses live in the present."*

### Related Tools & Source References
- **Related Interactive Tools:** Interactive Breathing & Grounding Exercises, Mood Journaling Prompts.
- **Academic Sources:** National Institute of Mental Health (NIMH); Tele-MANAS (Ministry of Health & Family Welfare, Govt of India)."""
    },
    {
        "title": "Untangling Cognitive Distortions: Halting the 'I am Going to Fail' Spiral",
        "category": "Mental & Emotional Wellbeing",
        "content_type": "article",
        "summary": "Identify common thinking traps like catastrophizing, black-and-white thinking, and mind-reading, and replace them with cognitive balance.",
        "read_time_minutes": 5,
        "tags": ["Mental & Emotional Wellbeing", "Overthinking", "Confidence", "Motivation"],
        "is_featured": False,
        "content": """### The Problem & College Context
Under chronic academic pressure, the brain develops cognitive distortions—faulty thinking patterns that warp reality. A 5/10 on one quiz gets magnified into "I will lose my GPA, fail campus placements, and ruin my future." Recognising these traps is the first step toward emotional resilience.

### Practical Action Steps
1. **Spot All-or-Nothing Thinking:** Replace "If I don't get an A, I am completely useless" with "A B+ is still a strong result that reflects real effort."
2. **Examine the Courtroom Evidence:** Put your catastrophic thought on trial. What verifiable facts prove your fear? What facts contradict it? You will find that catastrophic thoughts almost never hold up under cross-examination.
3. **Decatastrophize: What is the Most Likely Scenario?** Ask yourself: What is the worst-case scenario? What is the best-case scenario? What is the realistic, 80% likely outcome?
4. **Use Compassionate Third-Person Reframing:** If your closest hostel friend came to you with this exact mistake, what would you say to them? You would never insult them the way your inner critic insults you.

### 2-Minute Micro-Activity
Write down the single most stressful thought you have had today. Below it, write one balanced, fact-based sentence that counters it without toxic positivity.

### Realistic College Life Example
After receiving a lower-than-expected grade on a midterm test, a student begins catastrophizing that their professor dislikes them and they won't graduate. Writing down the evidence, they realize this test was only worth 10% of the course grade and that 3 high-weight assignments remain, completely restoring their motivation.

### Quick Takeaway Mental Anchor
*"Thoughts are mental hypotheses, not proven courtroom facts."*

### Related Tools & Source References
- **Related Interactive Tools:** Mood Journaling Prompts, Goal Planner.
- **Academic Sources:** Dr. David D. Burns, *Feeling Good: The New Mood Therapy*; Beck Institute for Cognitive Behavior Therapy."""
    },

    # 4. Sleep & Physical Health
    {
        "title": "The Circadian Reset for Night-Owl University Students",
        "category": "Sleep & Physical Health",
        "content_type": "guide",
        "summary": "A practical roadmap to repair erratic college sleep schedules, eliminate morning brain fog, and align with natural sleep architecture.",
        "read_time_minutes": 6,
        "tags": ["Sleep & Physical Health", "Sleep Routines", "Managing Fatigue", "Healthy Habits"],
        "is_featured": True,
        "content": """### The Problem & College Context
Late-night hostel culture, discord chats, and midnight study sprints routinely push sleep onset to 2:00–4:00 AM. When 8:30 AM lectures arrive, students experience chronic sleep debt, circadian desynchrony, and extreme cognitive fatigue. Weekend 'binge sleeping' only makes Monday mornings worse.

### Practical Action Steps
1. **Anchor Your Morning Wake Time First:** Do not try to force yourself to fall asleep at 10 PM if you normally sleep at 3 AM. Instead, wake up at the same hour every single morning (+/- 30 minutes). Your sleep drive will naturally build by bedtime.
2. **Get 10 Minutes of Morning Sunlight:** Viewing outdoor sunlight within 60 minutes of waking sets a 14-hour timer in the suprachiasmatic nucleus for evening melatonin production.
3. **Adopt the 10-3-2-1-0 Sleep Architecture:**
   - **10 hours before bed:** No more caffeine (coffee/energy drinks).
   - **3 hours before bed:** No heavy mess dinners or spicy snacks.
   - **2 hours before bed:** Stop intensive coding or problem-solving.
   - **1 hour before bed:** Turn off high-intensity blue light screens.
   - **0:** Hit snooze 0 times in the morning.
4. **Cool Down Your Sleep Environment:** Core body temperature must drop by 1 to 2 degrees Celsius to initiate deep sleep. Open the window or use a fan to keep the room cool.

### 2-Minute Micro-Activity
Set a recurring alarm on your phone for 10:30 PM named: *"Digital Sunset: Close IDE & Dim Lights."*

### Realistic College Life Example
A student constantly sleeping from 3:30 AM to 7:45 AM felt exhausted during morning programming labs. By anchoring his wake time at 7:30 AM every day and cutting off caffeine after 2:00 PM, his body began naturally feeling tired by 11:30 PM, restoring 8 hours of restorative deep sleep within one week.

### Quick Takeaway Mental Anchor
*"Consistency in wake-up time is the anchor that pulls sleep onset into alignment."*

### Related Tools & Source References
- **Related Interactive Tools:** Daily Habit Tracker, Pomodoro Focus Timer.
- **Academic Sources:** Dr. Matthew Walker, *Why We Sleep* (UC Berkeley Sleep Center); NHS Sleep and Tiredness Guidance."""
    },
    {
        "title": "Managing Hostel Fatigue, Hydration & Screen Exhaustion",
        "category": "Sleep & Physical Health",
        "content_type": "article",
        "summary": "Physical habits to combat sedentary desk fatigue, digital eye strain, and hostel dehydration for peak daily energy.",
        "read_time_minutes": 4,
        "tags": ["Sleep & Physical Health", "Screen-Time Management", "Exercise", "Hydration"],
        "is_featured": False,
        "content": """### The Problem & College Context
Sitting in a cramped hostel chair staring at backlit code editors for 8 hours without drinking water causes a specific kind of physical fatigue known as 'sedentary brain fog'. Students often confuse dehydration and eye strain with academic burnout.

### Practical Action Steps
1. **The 20-20-20 Rule for Digital Eye Strain:** Every 20 minutes of screen work, look at an object at least 20 feet away for 20 seconds. This relaxes the ciliary muscles in your eyes.
2. **The 2-Bottle Hydration Anchor:** Keep a 1-liter bottle at your study desk. Make a rule: you cannot leave for lunch until bottle 1 is empty, and you cannot sleep until bottle 2 is finished.
3. **Take a 15-Minute Sunlight Walk:** A brisk 15-minute walk around the campus sports complex or academic quad clears adenosine and boosts dopamine more effectively than an extra cup of instant coffee.
4. **Decompress the Hip Flexors & Thoracic Spine:** Every 90 minutes of studying, do 60 seconds of doorway chest openers and hip flexor lunges to undo the hunched desk posture.

### 2-Minute Micro-Activity
Stand up right now. Drink a full glass of water, look out a window into the far distance for 20 seconds, and roll your shoulders backward 10 times.

### Realistic College Life Example
A student spending entire weekends preparing for competitive coding contests noticed heavy afternoon headaches and lethargy. After instituting the 20-20-20 rule and keeping a 1-liter water bottle on his desk, his afternoon headaches disappeared and his focus endurance doubled.

### Quick Takeaway Mental Anchor
*"Your cognitive stamina is only as strong as your physical baseline."*

### Related Tools & Source References
- **Related Interactive Tools:** Daily Habit Tracker, Interactive Breathing & Grounding Exercises.
- **Academic Sources:** American Academy of Ophthalmology; Mayo Clinic Health System."""
    },

    # 5. Relationships & Social Life
    {
        "title": "Hostel Roommate Dynamics: Setting Boundaries Without Creating Drama",
        "category": "Relationships & Social Life",
        "content_type": "guide",
        "summary": "How to communicate assertively, resolve late-night noise disputes, and establish peaceful boundaries in shared student living spaces.",
        "read_time_minutes": 5,
        "tags": ["Relationships & Social Life", "Hostel Adjustment", "Boundaries", "Conflict Resolution"],
        "is_featured": True,
        "content": """### The Problem & College Context
Sharing a 12x14 foot hostel room with one or two roommates who have completely different sleep schedules, hygiene habits, and guest preferences can generate intense, silent friction. Many students suffer silently or explode in anger rather than communicating constructively.

### Practical Action Steps
1. **Use 'I-Statements' Instead of Accusatory 'You-Statements':** Say: "I have a tough 8 AM exam tomorrow and need to sleep by midnight, so I'd appreciate keeping the overhead lights off" instead of "You are always keeping the lights on and making noise."
2. **Propose Win-Win Logistics:** If your roommate is a late-night gamer or study enthusiast, invest in or agree on practical compromises: desk lamps with directional hoods, headphones mandatory after 11 PM, and quiet phone calls taken in the corridor.
3. **Address Issues Early While Emotional Temperature is Low:** Do not wait until you have accumulated 3 weeks of resentment. Mention small habits casually: "Hey, could we agree to take old food containers down to the mess trash every evening so the room stays fresh?"
4. **Know When to Seek Neutral Campus Mediation:** If basic sleep, safety, or academic boundaries are repeatedly violated despite respectful conversations, seek confidential advice from your floor senior, hostel warden, or campus counsellor.

### 2-Minute Micro-Activity
Think of one recurring friction point in your shared living space. Draft a calm, polite 2-sentence request using an 'I-statement' that you can share with your roommate today.

### Realistic College Life Example
Two roommates in a 2-seater hostel room were constantly clashing over late-night study lights. After a calm 5-minute conversation over tea, they agreed that the overhead light would be switched off at 11:30 PM and the student staying up would use a personal clip-on reading lamp and headphones. Both preserved their academic performance and their friendship.

### Quick Takeaway Mental Anchor
*"Clear, respectful boundaries are the kindest way to preserve long-term friendships."*

### Related Tools & Source References
- **Related Interactive Tools:** Mood Journaling Prompts, Goal Planner.
- **Academic Sources:** Dr. Marshall Rosenberg, *Nonviolent Communication*; Harvard Division of Student Life."""
    },
    {
        "title": "Navigating Homesickness & Building Your Authentic Campus Tribe",
        "category": "Relationships & Social Life",
        "content_type": "article",
        "summary": "Overcome campus loneliness, bridge cultural transitions, and create meaningful, low-pressure connections in university.",
        "read_time_minutes": 5,
        "tags": ["Relationships & Social Life", "Homesickness", "Friendships", "Peer Pressure"],
        "is_featured": False,
        "content": """### The Problem & College Context
Moving away from family to campus brings sudden independence accompanied by unfamiliar mess food, regional cultural differences, and an absence of familiar support systems. Seeing large, boisterous friend groups on campus can make students feel uniquely isolated and defective.

### Practical Action Steps
1. **Engage in Low-Pressure 'Parallel Play':** You do not need deep conversational eloquence to connect. Ask a classmate: "Hey, do you want to head to the central library and work on the lab assignment together?" Studying side-by-side provides low-stakes social nourishment.
2. **Join Niche Campus Clubs Over Generic Crowds:** Broad batch groups can feel overwhelming. Join 1 or 2 specialized clubs based on genuine interests (astronomy, debate, open-source coding, music, trekking) where shared passion removes awkward small talk.
3. **Structure Calls Home Strategically:** Calling home for 15 minutes at a set time (e.g., 8:00 PM every other day) provides comfort without keeping you mentally tethered to your bedroom back home.
4. **Remember the Transition Curve:** Research proves that weeks 3 through 8 of a new semester are the peak of transition distress. Adaptation takes between 6 to 12 weeks; feeling awkward initially is completely normal.

### 2-Minute Micro-Activity
Send a short WhatsApp message to one classmate you haven't spoken to recently: *"Hey, are you heading to the afternoon lecture? Want to grab a quick tea before it starts?"*

### Realistic College Life Example
A 1st-year student from another state felt intensely lonely during his first month, eating meals alone in the hostel mess. He attended a weekend workshop hosted by the college robotics club, volunteered to help solder a sensor circuit, and formed a close circle of 3 friends who now study and dine together daily.

### Quick Takeaway Mental Anchor
*"Belonging is built through repeated micro-moments of shared routine, not instant fairy-tale friendships."*

### Related Tools & Source References
- **Related Interactive Tools:** Mood Journaling Prompts, Daily Habit Tracker.
- **Academic Sources:** Journal of College Student Development; National Center for Higher Education."""
    },

    # 6. Productivity & Personal Growth
    {
        "title": "The Pomodoro Technique & Deep Work for Engineering Students",
        "category": "Productivity & Personal Growth",
        "content_type": "guide",
        "summary": "Master single-tasking, eliminate phone distractions, and achieve 3x output in half the study time with structured intervals.",
        "read_time_minutes": 5,
        "tags": ["Productivity & Personal Growth", "Discipline", "Daily Planning", "Time Management"],
        "is_featured": True,
        "content": """### The Problem & College Context
Constant smartphone notifications, group chat memes, and open browser tabs fragment student attention into tiny 90-second shards. When students attempt to study while multitasking, attention residue prevents the brain from entering 'Deep Work', turning a 2-hour assignment into an agonizing 6-hour slog.

### Practical Action Steps
1. **The Single-Tasking Contract:** Before starting your timer, choose exactly ONE unambiguous deliverable: "Solve question 3 and 4 of the tutorial sheet." Do not allow secondary tasks to sneak in.
2. **The Distraction Capture Sheet:** Keep a physical sticky note next to your keyboard. When a random intrusive thought occurs ("check placement portal", "look at shoes", "reply to friend"), write it on the sheet and return immediately to your task.
3. **Execute 25/5 or 50/10 Cycles:** Focus completely for 25 minutes, then take a strict 5-minute break. After 4 completed cycles, take a long 20-minute restorative walk.
4. **Protect the Break from Digital Dopamine:** In your 5-minute break, stand up, stretch, look out the window, or drink water. Do NOT open short-form video reels, which hijack attention and ruin focus for the next session.

### 2-Minute Micro-Activity
Pick up your phone right now. Turn on 'Do Not Disturb' or place the phone across the room face down for the next 25 minutes.

### Realistic College Life Example
A student spending 6 hours in the library was only producing 20 lines of code due to constant phone notifications. After adopting the Pomodoro timer, placing his phone inside his backpack, and using a distraction sheet, he finished his compiler design assignment in two 50-minute deep work blocks and had the entire evening free.

### Quick Takeaway Mental Anchor
*"Two hours of distraction-free deep focus outperforms eight hours of fragmented lingering."*

### Related Tools & Source References
- **Related Interactive Tools:** Pomodoro Focus Timer, Study Planner.
- **Academic Sources:** Cal Newport, *Deep Work: Rules for Focused Success in a Distracted World*; Francesco Cirillo, *The Pomodoro Technique*."""
    },
    {
        "title": "Goal Chunking: Turning Big Semester Ambitions into Daily Sprints",
        "category": "Productivity & Personal Growth",
        "content_type": "guide",
        "summary": "Transform overwhelming ambitions like landing a marquee placement or maintaining an 8.5 CGPA into frictionless daily micro-actions.",
        "read_time_minutes": 5,
        "tags": ["Productivity & Personal Growth", "Goal Setting", "Habit Building", "Self-Reflection"],
        "is_featured": False,
        "content": """### The Problem & College Context
Students frequently set massive, intimidating goals ("I will solve 300 LeetCode problems", "I will get a 9.0 GPA", "I will master Machine Learning"). Because the goal is so far away and colossal, the brain becomes paralyzed by the gap between today and the finish line, resulting in inaction.

### Practical Action Steps
1. **Decompose the Mountain into 14-Day Sprints:** Break a 6-month goal down into two-week milestones. If you want to solve 100 problems this semester, that is simply 8 problems a week, or 1 problem a day with a rest day.
2. **Focus on Lead Measures Over Lag Measures:** A lag measure is "Get placed at a top company." You cannot execute on a lag measure today. A lead measure is "Solve 1 DSA problem before 10 AM every morning." Focus 100% of your energy on the lead measure.
3. **The 2-Minute Rule for Habit Stacking:** Attach your new habit to an existing routine: "Right after I finish morning coffee, I will write 5 lines of code." Make the entry barrier under 2 minutes.
4. **Conduct a 10-Minute Sunday Retrospective:** Every Sunday evening, spend 10 minutes reviewing what worked, what slipped, and setting the top 3 micro-goals for the coming week.

### 2-Minute Micro-Activity
Choose your biggest ambition for this semester. Write down the single smallest physical action you can take in the next 15 minutes to advance that goal.

### Realistic College Life Example
A 3rd-year student felt overwhelmed by placement preparation and didn't know where to start. Using the Goal Planner, she broke down "Crack Placements" into 3 daily micro-steps: (1) 1 medium DSA problem, (2) 15 minutes of OS revision, (3) 1 behavioral question answered using the STAR framework. By sticking to this daily sprint, she solved 90 problems over the semester with zero panic.

### Quick Takeaway Mental Anchor
*"You do not rise to the level of your goals; you fall to the level of your daily systems."*

### Related Tools & Source References
- **Related Interactive Tools:** Goal Planner, Daily Habit Tracker, Placement Preparation Tracker.
- **Academic Sources:** James Clear, *Atomic Habits*; Stephen Covey & Chris McChesney, *The 4 Disciplines of Execution*."""
    }
]

def update_resources():
    db = SessionLocal()
    try:
        # Clear old resources or update existing ones
        existing = db.query(WellbeingResource).all()
        print(f"Found {len(existing)} existing resources.")
        
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
        print(f"Successfully seeded {count} comprehensive resources across all 6 categories!")
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
