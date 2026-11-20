# STACK 2026 HACKATHON — COMPLETE PROJECT CONTEXT, EMPIRICAL DATASET & CONVERSATION LOG

> **Document Purpose:** Master knowledge transfer file for AI coding/writing assistants (Cursor, Claude, ChatGPT, v0, Bolt, etc.) and team members. Contains full competition rules, empirical survey statistics ($N=48$), philosophical/architectural framing, submitted preliminary abstract, semifinal strategy, cognitive design system tokens, master prompts, and a complete chronological log of all discussions and decisions.

---

## 1. COMPETITION & TEAM METADATA

* **Competition Name:** STACK 2026 (*Solution Technology Arena for Coding & Knowledge*)
* **Organizer:** Google Developer Group on Campus — Bandung Institute of Technology (GDGoC ITB)
* **Event Theme:** *"Agent of the Ocean: Vibing Beyond the Code"*
* **Selected Case:** **Case 1: Smarter Campus and Learning** (*"How might we help students learn, collaborate, and access campus opportunities more effectively?"*)
* **Official Language:** **100% English** for all written submissions (Abstract, Proposal), videos (narration/subtitles), UI prototypes, presentation decks, and pitching sessions.
* **Team Name:** `bug itu fitur`
* **Team Members & Roles:**
  1. **Al-Ghani Desta Setyawan (Ghani)** — Team Leader, Lead Synthesis, Proposal & Abstract Lead, Field Researcher (Universitas Muhammadiyah Kalimantan Timur / UMKT)
  2. **Andhika (Dhika)** — Systems & Backend Architecture, Alternative Audit, Field Researcher (Institut Teknologi Kalimantan / ITK)
  3. **Johann Ariel (Ariel)** — Frontend / UX Prototyping, Survey Data Processing, Field Researcher (Universitas Mulawarman / Unmul)
* **Current Competition Status (as of November 20, 2026):**
  * **Preliminary Round:** **PASSED / QUALIFIED FOR SEMIFINALS** (announced Nov 18, 2026).
  * **Current Stage:** **Semifinal Phase** (Deadline: **November 30, 2026, 23:59 WIB**).
  * **Semifinal Deliverables Required:**
    1. **Detailed Proposal (PDF):** Max 10 content pages (excluding Cover, References, and Signed Declaration of Originality). A4, 11–12 pt font, 1.15 spacing, 2.5 cm margins, English.
    2. **Explanatory Team Video:** Max 2 minutes (120 seconds), minimum 1080p resolution, clear audio, English narration/subtitles (planned via Discord + OBS screen share).
  * **Upcoming Milestones:**
    * Top 10 Finalist Announcement: **December 7, 2026**
    * Product Improvement Sprint: **December 7–16, 2026**
    * Final Day (Tentatively Offline in Bandung — Build Session + 10m Pitch/Demo + 10m Q&A): **December 16, 2026**

### Semifinal & Final Evaluation Rubrics (Official Handbook)
* **Semifinal Criteria:**
  * Problem Understanding: **25%** (Supporting evidence, user needs, analysis of alternatives)
  * Solution Design: **25%** (Core workflow, value, originality, case alignment)
  * Technical Feasibility: **20%** (Architecture, tech choices, data, achievable scope)
  * Execution and Validation: **20%** (Milestones, roles, early testing, risks, Final Day plan)
  * Communication: **10%** (Clear and consistent proposal and video accurately describing progress)
* **Final Day Criteria:**
  * Functionality and Reliability (30%), Problem Fit and Usefulness (20%), Technical Quality (15%), Usability and Accessibility (10%), Validation and Impact (10%), Final Day Execution (10%), Pitch and Technical Understanding (5%).
* **Strict Rules to Obey:**
  * Never represent planned features as completed functionality.
  * Clearly label simulated data, mockups, and unfinished features.
  * Disclose all **Material AI Assistance** (tools used and their roles) in the Proposal and Product `README.md`.
  * Retain **2–3 substantive development tasks** specifically for the Final Day Build Session (do not arrive with 100% finished code).
  * Attach the official **Signed Declaration of Originality** to the Proposal.

---

## 2. EMPIRICAL RESEARCH & STATISTICAL DATASET (`Kaltim Campus Service Survey`)

### A. Cross-Campus Qualitative Observations (3-Month Audit)
1. **UMKT (Ghani):** "War Kelas" (classroom shortages/clashes), erratic rescheduling creating 1–3 hour idle gaps, lecturers arriving 10+ mins late or cancelling last-minute despite promising Zoom sessions, 1-to-1 student absence permissions failing to reach lecturers (resulting in unfair "Alpa" marks), 20–30 student queues at academic admin desks (only 3 staff), and lack of peer study/project matching.
2. **ITK (Andhika):** Postponed/rescheduled courses disrupting study/rest schedules, skipped/rushed makeup materials, campus LMS routinely crashing (`down`) during peak hours (08:00, 13:00, 22:00–23:00 assignment deadlines), overcrowded parking forcing students onto gravel lots damaging tires/engines, and depleted classroom supplies (whiteboard markers/erasers) with no reporting channel.
3. **Unmul (Johann Ariel):** Class coordinators (*Komti/PJ Matkul*) forced to manually chat lecturers 1-on-1 to remind them of classes, sudden schedule changes colliding with other courses, parking scarcity, and unstructured lecture modules where students lack a clear syllabus roadmap.

### B. Quantitative Survey Breakdown ($N = 48$)
* **Total Respondents ($N$):** 48
* **Active University Students ($n_{\text{aktif}}$):** 46 ($95.83\%$; 2 non-active respondents excluded)
* **Campus Distribution ($N=48$):** UMKT (16 / 14 active), Unmul (15), ITK (9), Politeknik Negeri Samarinda / Polnes (2), Untag Samarinda (2), UNIKA Semarang (1), ITKES Wiyata Husada (1), STMIK (1), Other (1).
* **Semester Distribution ($n_{\text{aktif}}=46$):** Semester 1–2 (9), Semester 3–4 (27 / 58.70%), Semester 5–6 (9), Semester 7–8 (1).
* **Affected Students ($n_{\text{terdampak}}$):** **38 out of 46 active students ($82.61\%$)** experienced operational campus bottlenecks in the last 3 months (8 reported no issues).

#### Key Statistical Formulas & Findings ($n = 38$ Affected Cohort)
1. **Union of Core Schedule/Certainty Friction (Q4 Multi-Response):**
   * Lecturer attendance/class status uncertainty ($|A| = 26$, $68.42\%$, $SE = 0.0754$)
   * Sudden lecture schedule changes/clashes ($|B| = 24$, $63.16\%$, $SE = 0.0783$)
   * Intersection ($|A \cap B| = 18$) $\rightarrow$ Unique Union $|A \cup B| = 26 + 24 - 18 = \mathbf{32\text{ students}}$ (**$84.21\%$**, $SE = 0.0591$, $MoE_{95\%} = \pm 11.59\%$).
2. **Single Most Disruptive Issue (Q5) & Chi-Square Goodness-of-Fit:**
   * Uncertainty of lecturer attendance / class status: **14 ($36.84\%$)** — Unmul (8), UMKT (4), ITK (1), Polnes (1)
   * Campus website / LMS error or down: **8 ($21.05\%$)** — ITK (7), UMKT (1)
   * Sudden lecture schedule changes: **5 ($13.16\%$)** — Unmul (2), Untag (2), UNIKA (1)
   * Difficulty finding parking: **5 ($13.16\%$)** — UMKT (2), Unmul (2), ITK (1)
   * Other (dense/sudden org events): **4 ($10.53\%$)** — UMKT (3), Polnes (1)
   * Inaccessible/unstructured lecture modules: **2 ($5.26\%$)** — UMKT (1), Unmul (1)
   * **Combined Cluster #1 (Class Certainty + Sudden Rescheduling):** **19 / 38 ($50.00\%$)** across all campuses.
   * **Chi-Square Test ($k=6, f_e=6.333$):** $\chi^2 = \mathbf{13.684}$ ($df = 5, \mathbf{p = 0.0177 < 0.05}$), exceeding $\chi^2_{\text{crit}} = 11.070$, proving statistically significant concentration around lecturer/class uncertainty.
3. **Recurrence & Recency (Q6 & Q7):**
   * **89.47% (34/38)** experienced this repeatedly (2–3 times: 17; 4–6 times: 7; $\ge 7$ times: 10), weighted mean $\bar{F} = \mathbf{4.25\text{ incidents per 3 months}}$.
   * **63.16% (24/38)** experienced it within the **last 7 days**; **92.11% (35/38)** within the last month.
4. **Direct Losses (Q8) & Expected Wasted Time (Q9):**
   * Time wasted waiting or searching for info: **30 ($78.95\%$)**
   * **Wasted commute to campus (arrived only to find class cancelled): 20 ($52.63\%$)**
   * Delayed understanding of materials / blocked assignments: **15 ($39.47\%$)**
   * Disrupted / colliding personal or academic schedules: **11 ($28.95\%$)**
   * Extra out-of-pocket costs (fuel, parking, printing): **10 ($26.32\%$)**
   * **Weighted Mean Wasted Time ($\bar{T}$):** **52.11 minutes per incident** ($s_T = 43.18$ mins, Median = $45.0$ mins); **55.26% (21/38)** lose $\ge 30$ minutes to $>2$ hours per incident.
5. **Current Workarounds (Q10) & Why They Fail (Q11):**
   * Workarounds: Monitoring WhatsApp class groups (23 / $60.53\%$), asking Komti/Sipen (16 / $42.11\%$), direct personal chat to lecturer (10 / $26.32\%$), passive resignation (10 / $26.32\%$).
   * Failure Root Causes: Slow or unanswered responses (20 / $52.63\%$), conflicting/ambiguous info among students (14 / $36.84\%$), temporary band-aid that keeps recurring (10 / $26.32\%$), lack of transparent system (10 / $26.32\%$).
6. **Verbatim Quotes (Q12):**
   * *Unmul:* "Dosen mengkonfirmasi tidak hadir saat saya sudah berada di kelas dengan teman-teman yang lain... Ketidakpastian memicu kemalasan saya, semua hal tentang ketidakpastian membuat saya emosi."
   * *Polnes:* "Dosen matkul yang sama ga masuk padahal malam sebelumnya sudah di-chat untuk mengkonfirmasi kelas, jawabnya 'iya', aslinya hilang dosennya gatau kemana, udah gitu dua minggu berturut-turut pula begitu."
   * *UNIKA:* "Dosen baru konfirmasi kalau kelas tidak jadi yang seharusnya kelas mulai jam 08.00 baru dikabarin jam 09.10."
   * *ITK:* "Website kampus tiba-tiba error... pendataan daftar hadir terkendala seperti mahasiswa hadir yang dianggap alpha."
7. **Willing Follow-Up Interviewees (Q13–Q14):**
   * Lutfi Roihannah (UMKT, Sem 1–2, LMS & Class Certainty) — `[redacted]`
   * Respondent Untag Samarinda (Sem 5–6, Sudden Reschedule & Clashes) — `[redacted]`
   * Respondent UMKT (Sem 1–2, Schedule Density) — `@apaajadechh34`

---

## 3. STRATEGIC PIVOT & PRODUCT ARCHITECTURE (`ClassPause`)

### Why We Pivoted Away from "Chat Bots / Polite Message Templates"
During internal team synthesis (Nov 1), Andhika questioned whether WhatsApp alone could solve this, and Ariel noted that a senior team (*kating* at Unmul) was building a "smart polite chat template" tool, pointing out that slow/ambiguous replies stem from lecturer mood/busyness.
* **Strategic Insight (Inspired by *Blueprint Neo Sabang* & Lee Soo-man's Ecosystem Thinking):**
  1. Polite chat templates fail because they still rely on free-text negotiation and high cognitive load (lecturers avoid replying when they don't know which replacement slot avoids conflicts for 40 students and which rooms are vacant).
  2. **ClassPause** eliminates free-text chatting entirely via a **Zero-Chat SLA Protocol**, **Algorithmic 3-Option Conflict-Free Slot Engine**, and **The Art of Campus Pause** (converting unavoidable dead-time and LMS outages into 15-minute offline-first micro-learning modules that auto-verify attendance).

### Submitted Preliminary Abstract (Exact Text — 441 Words)
* **Team name:** bug itu fitur
* **Project title:** ClassPause: Autonomous Class Coordination Protocol and Micro-Learning Continuity Hub
* **Selected case:** Case 1: Smarter Campus and Learning
* **Members:** Al-Ghani Desta Setyawan (Team Leader), Andhika, Johann Ariel
* **1. Problem:** Unplanned lecture cancellations, sudden schedule shifts, and communication delays leave university students stranded on campus with unproductive dead-time. Fragmented group chats and rigid academic portals fail to provide real-time updates, resulting in wasted commutes, disrupted schedules, and unaddressed learning gaps.
* **2. Intended Users:** The primary intended users are undergraduate class coordinators (*komti/sipen*) and active university students across higher education institutions in East Kalimantan who manage daily class operations.
* **3. Supporting Observations or Evidence:** A cross-campus empirical survey conducted across three East Kalimantan universities (UMKT, Unmul, and ITK; $N = 48$, $n = 38$ affected students) reveals that 50.0% of respondents identified class status uncertainty and sudden rescheduling as their most severe daily obstacle [1]. Furthermore, 84.2% experienced schedule unpredictability within the last three months, 52.6% endured wasted commutes due to unannounced class cancellations, and 55.3% lost 30 to over 120 minutes per incident [1]. Qualitative interviews confirmed that class leaders experience communication burnout, while students face unattended instructional gaps when sessions are dismissed [1].
* **4. Proposed Solution and Core User Flow:** We propose ClassPause, an automated class operations platform that converts schedule friction into structured productivity through a zero-chat SLA protocol. The core flow initiates two hours before lecture: the system triggers a lightweight confirmation request to the lecturer via instant messaging webhook. If confirmed, students receive a verified green departure signal. If the session is rescheduled, the system automatically suggests three conflict-free makeup time slots and available rooms calculated against student schedules. If unconfirmed by fifteen minutes past start time, ClassPause automatically transitions the class into Asynchronous Micro-Pause Mode, distributing fifteen-minute syllabus bite-sized modules and quizzes whose completion automatically verifies student attendance.
* **5. How It Differs from Existing Alternatives:** Unlike ad-hoc WhatsApp groups that suffer from message clutter and slow responses, and legacy academic information systems (SIAKAD/LMS) that remain static and frequently fail during peak traffic, ClassPause introduces an automated contractual SLA with conflict-free scheduling and offline-first micro-learning continuity.
* **6. Planned Technologies:** ClassPause is developed as a mobile-first Progressive Web Application (PWA) using Next.js and Tailwind CSS, backed by Node.js and PostgreSQL. Real-time updates and notifications utilize Redis and WebSocket protocols, while automated lecturer prompts interface via WhatsApp Business and Telegram Bot APIs.
* **7. Expected Benefit and Development Plan:** ClassPause directly benefits students and class coordinators by eliminating wasted transit and recovering an estimated average of 52 minutes of idle time per cancellation into verified micro-learning progress. Success is measured by commute-waste reduction rates, room-slot conflict resolution time, and micro-quiz completion percentages. The development plan comprises sprint milestones: backend scheduling and webhook integration by November 18, PWA prototype and micro-module rendering by November 30, and user acceptance testing across partner campus cohorts prior to Final Day on December 16, 2026. The primary technical risk involves instant messaging API rate limits, which will be mitigated by implementing a hybrid asynchronous queue fallback.

---

## 4. COGNITIVE DESIGN SYSTEM & MASTER PROTOTYPE PROMPT

### Psychological Design Foundations
1. **Pre-Attentive Processing:** Traffic-light status badges processed in $<250$ms (`#10B981` Emerald = Safe to Commute, `#F59E0B` Amber = Hold / SLA Countdown, `#EF4444` Crimson + `#4338CA` Indigo = Switched to Asynchronous Micro-Pause).
2. **Hick's Law & Cognitive Offloading:** Zero free-text inputs; lecturers and Komti choose strictly from 3–4 tactile decision cards.
3. **Zeigarnik Effect & Micro-Commitment:** 3-step segmented progress bar inside the 15-minute Micro-Pause module culminating in a timestamped *Verified Attendance Receipt*.
4. **Fitts's Law:** Bottom-anchored thumb-zone primary CTAs (`min-h-[48px]`).
5. **Typography & Palette:** Canvas `#F8FAFC`, Surface `#FFFFFF`, Border `#E2E8F0`, Navy `#0F172A`, Pause Indigo `#4338CA`; `Plus Jakarta Sans` (headings), `Inter` (body), `JetBrains Mono` with `tabular-nums` (live SLA timers).

### Ready-to-Use Master AI Prompt (Design System + 3-Role Interactive PWA Prototype)
*(Note: Use this exact prompt in v0.dev, Bolt.new, Lovable, or Cursor to generate the semifinal prototype first, before writing the Semifinal Proposal PDF and recording the 2-minute Discord video.)*

```text
Act as a Principal Product Designer (specializing in Cognitive Psychology & Behavioral UX) and Staff Full-Stack Engineer. Build a complete, interactive, mobile-first Progressive Web Application (PWA) and Living Design System prototype named "ClassPause" for the STACK 2026 Hackathon ("Case 1: Smarter Campus and Learning" by GDGoC ITB).

### 1. CORE PROBLEM & EMPIRICAL CONTEXT (TEAM: "bug itu fitur")
Cross-campus research across three East Kalimantan universities (UMKT, Unmul, ITK; N=48, n=38 affected students) shows that 84.21% of students suffer from unplanned lecture cancellations and sudden schedule shifts, losing an average of 52.11 minutes per incident, while 52.63% endure wasted campus commutes due to slow manual WhatsApp coordination and crashing LMS servers.
"ClassPause" replaces manual WhatsApp begging with an **Autonomous Zero-Chat SLA Protocol** and **Asynchronous Micro-Pause Mode**:
1. Automated H-2h lecturer confirmation card (zero typing, 1-tap decision).
2. Live "Commute Traffic-Light Radar" for students (Emerald = Safe to Commute, Amber = Hold / SLA Active, Crimson-Indigo = Switched to Micro-Pause).
3. Algorithmic 3-Option Conflict-Free Slot & Room Recommender for rescheduled lectures.
4. Deterministic SLA Auto-Fallback at H+15m: unconfirmed sessions automatically convert into a 15-minute offline-cached "Asynchronous Micro-Pause" bite-sized module + 3-question quiz that verifies attendance and prevents unfair "Alpa" marks.

### 2. COGNITIVE PSYCHOLOGY & DESIGN SYSTEM TOKENS
Apply these exact psychological patterns and design tokens across all components:
- **Pre-Attentive Processing (Traffic-Light Semantics):** Status is understood in <250ms via semantic color badges before reading text:
  - Canvas Background: `#F8FAFC` (Slate 50) | Surface Cards: `#FFFFFF` | Subtle Border: `#E2E8F0`
  - Brand Authority: Deep Midnight Navy `#0F172A` | Learning Accent: Pause Indigo `#4338CA`
  - GO / CONFIRMED: Text `#065F46`, Surface `#ECFDF5`, Border `#6EE7B7`, Pulse `#10B981`
  - HOLD / SLA COUNTDOWN: Text `#92400E`, Surface `#FFFBEB`, Border `#FCD34D`, Pulse `#F59E0B`
  - PAUSE / DO NOT COMMUTE: Text `#991B1B`, Surface `#FEF2F2`, Border `#FCA5A5`, Pulse `#EF4444`
- **Hick’s Law & Cognitive Offloading:** Eliminate free-text typing for lecturers and coordinators; present strictly 3–4 tactile decision cards/buttons.
- **Zeigarnik Effect & Micro-Commitment:** Use a 3-step segmented progress bar inside the 15-minute Micro-Pause module that rewards completion with a timestamped "Verified Attendance Receipt".
- **Fitts’s Law (Thumb-Zone Ergonomics):** Anchor all primary CTAs at the bottom of mobile viewports with `min-h-[48px]` touch targets.
- **Typography:** Plus Jakarta Sans (Headings), Inter (Body), and JetBrains Mono with `tabular-nums` for live ticking SLA timers.

### 3. TECH STACK & COMPLIANCE RULES
- Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Lucide React icons.
- Language: 100% clear, natural English across ALL UI labels, notifications, mock data, and documentation.
- Honesty & Disclosure: Include a subtle footer badge: *"ClassPause MVP Prototype v0.1 — STACK 2026 Semifinal Build (Simulated East Kalimantan Campus Dataset)"*.

### 4. REQUIRED APPLICATION VIEWS & INTERACTIVE FLOWS
#### Top Hackathon Demo & Design System Switcher Bar (Sticky Top)
Allow judges and testers to switch seamlessly between 4 tabs:
1. **[Student Radar]**
2. **[Komti / Coordinator]**
3. **[Lecturer 1-Tap Card]**
4. **[Design System & Psychology]**
Plus quick simulation triggers: **[Simulate H-2h Trigger]** | **[Simulate H+15m SLA Timeout]** | **[Reset Demo]**

#### Tab 1: Student View ("Live Commute Radar & Micro-Pause Hub")
- Header: "Hi, Raka — Informatics '26", Commute Protection Status, and Metric Pill ("156 mins dead-time recovered").
- **3 Live Class Cards:**
  - *Card 1 (GREEN - CONFIRMED):* "Algorithms & Data Structures (08:00–09:40, Room B-204)". Badge: "SAFE TO COMMUTE • Verified by Dr. Naufal at 06:15".
  - *Card 2 (AMBER - PENDING SLA):* "Digital Systems & Logic (10:00–11:40, Room A-102)". Live ticking `tabular-nums` countdown ("Auto-Pause SLA in 14m 22s"). Instruction: "HOLD COMMUTE — Awaiting lecturer 1-tap confirmation".
  - *Card 3 (RED/INDIGO - MICRO-PAUSE ACTIVE):* "Operating Systems (13:00–14:40)". Instruction: "DO NOT COMMUTE — Switched to Asynchronous Micro-Pause". Primary Thumb-Zone CTA: **"Start 15-Min Micro-Pause & Log Attendance"**.
- **Interactive Micro-Pause Drawer (Zeigarnik Stepper):** Opens a 3-step offline-ready module ("Step 1/3: Process Scheduling Summary" -> "Step 2/3: Key Diagram & Takeaways" -> "Step 3/3: 3-Question Quick Check"). Completing it generates a timestamped **"Attendance Verified via Micro-Pause"** receipt.
- **One-Door Leave/Sick Submission:** Quick bottom sheet to submit sick/dispensation proof synced directly to Komti & Lecturer dashboards.

#### Tab 2: Class Coordinator / Komti View ("Class Operations & Conflict-Free Slot Engine")
- Live KPI strip: Active Classes, Active SLA Timers, Pending Permissions.
- **Zero-Chat Conflict-Free Slot Recommender:** Displays 3 pre-computed makeup class options calculated against 40 students' KRS schedules and campus room availability:
  - *Option 1 (Optimal):* Thursday, 13:00–14:40 | Room Lab-301 | `0% Student Conflict • Room Vacant`
  - *Option 2 (Alternative):* Friday, 09:00–10:40 | Room B-105 | `95% Available (2 Org Conflicts)`
  - *Option 3 (Async):* Convert to Guided 15-Min Micro-Pause + Q&A Thread
  - Clicking **"Lock & Broadcast Slot"** updates Student Card 2 in real time with a toast notification.
- **One-Door Permission Queue:** 1-tap approve student sick notes so nobody gets marked "Alpa" due to chat delays.

#### Tab 3: Lecturer 1-Tap Magic Link (Simulated WhatsApp/Telegram Webhook Card)
- Zero-login mobile action card: *"Reminder: 'Digital Systems (Class A)' starts in 2 hours (10:00 AM, Room A-102). Tap once to update 40 students:"*
- 4 large tactile buttons (`min-h-[48px]`):
  1. **"Confirm On-Time (Room A-102)"** -> Updates Student Card 2 to GREEN.
  2. **"Delay 20 Mins / Shift Online"** -> Updates Student Card 2 with new ETA/Zoom badge.
  3. **"Request Reschedule (3 Conflict-Free Slots)"** -> Triggers the 3-card slot engine on Komti View.
  4. **"Convert to Micro-Pause (Async)"** -> Switches Student Card 2 to Micro-Pause Mode immediately.

#### Tab 4: Living Design System & Cognitive Psychology Showcase
- Interactive documentation page displaying: (1) The 4 Cognitive Psychology Pillars with rationale, (2) Interactive Color Token Swatches with click-to-copy hex codes, (3) Typography & Tabular Timer specimen, (4) Side-by-side Component Pattern Anatomy.

Generate clean, modular, bug-free TypeScript code with smooth state synchronization across all tabs.
```

---

## 5. COMPLETE CHRONOLOGICAL CONVERSATION & DECISION LOG

### Turn 1 — Initial Brainstorming & Cross-Campus Problem Mapping
* **User:** Shared `Problem Discovery Kit 2026 (1).docx` and individual 3-month pain points from Ghani (UMKT), Dhika (ITK), and Johann (Unmul). Asked whether to open a questionnaire to all students.
* **Assistant:** Recommended deploying a targeted short form + 9–12 qualitative interviews to capture cross-campus evidence. Clustered pain points across the 3 campuses and identified two top candidates: (1) Class schedule chaos, room clashes, & lecturer confirmation delays (all 3 campuses), and (2) LMS downtime & unstructured modules (ITK & Unmul).

### Turn 2 — Survey Dataset Upload & Statistical Analysis (`Kaltim Campus Service Survey.xlsx`)
* **User:** Uploaded `Kaltim Campus Service Survey.xlsx` ($N=48$).
* **Assistant:** Ran full statistical analysis: filtered $N=48 \rightarrow n_{\text{aktif}}=46 \rightarrow n_{\text{terdampak}}=38$. Proved that 84.2% (32/38) experienced class status uncertainty or sudden rescheduling, 50.0% (19/38) ranked it #1, 52.6% endured wasted commutes, and 55.3% lost 30–120+ mins per incident. Highlighted verbatim quotes and 3 willing interviewees.

### Turn 3 — Editorial Academic Statistical Report PDF
* **User:** Requested a detailed editorial PDF with statistical formulas, tables, and an initial English abstract draft.
* **Assistant:** Generated `stack2026_kaltim_survey_report.pdf` with sample screening formulas, $SE$, $CI_{95\%}$, weighted mean wasted time ($\bar{T}=52.11$ min), Chi-Square test ($\chi^2=13.684, p=0.0177$), alternative audit, scoring matrix, and a 458-word English abstract.

### Turn 4 — Multi-Page Academic Formatting Fix
* **User:** Pointed out page overflow/clipping and requested formal academic margins and layout.
* **Assistant:** Rebuilt `stack2026_kaltim_survey_report.pdf` into a multi-page academic paper (`20mm` margins, Times New Roman, booktabs tables, separated equation blocks).

### Turn 5 — Remaining Action Plan Breakdown
* **User:** Asked what steps remained before the Preliminary deadline.
* **Assistant:** Mapped remaining items against the 13-day kit timeline: verifying 5 registration items (Nov 5), conducting 9–12 interviews (Oct 31–Nov 4), completing Alternative Audit, locking solution synthesis (Nov 6), and finalizing the English abstract (Nov 7–10).

### Turn 6 — Solution Synthesis & Scoring Matrix
* **User:** Confirmed registration, interviews, and audit were handled, and requested materials for group discussion on solution synthesis (Step D).
* **Assistant:** Provided a weighted Scoring Matrix comparing Focused Class Ops (96.6%), Hybrid Class Ops + Offline Module Companion (94.9%), and Parking Tracker (67.2%), plus a 4-point decision checklist for the group chat.

### Turn 7 — Team Debate & *Blueprint Neo Sabang* Paradigm Shift
* **User:** Shared WhatsApp group debate where Andhika asked *"seharusnya WA aja udah bisa"* and Ariel noted a senior team (*kating* Unmul) was already building a "smart polite chat template" app, arguing slow replies are due to lecturer mood. Uploaded `Blueprint Neo Sabang.pdf` (93-page urban masterplan by The Innovators Studio) and asked to think like Lee Soo-man or the authors of the blueprint.
* **Assistant:** Reframed the product entirely using *Blueprint Neo Sabang* principles ("The Many Pauses", cognitive friction vs. mood, conflict of interest where everyone is right, and "The Last 500 Meters"). Replaced "WA chat templates" with **Zero-Chat SLA Protocol + 3-Option Conflict-Free Slot Engine + The Art of Campus Pause** (converting dead-time into offline-first 15-min micro-learning & pop-up study rooms).

### Turn 8 — *Blueprint Neo Kampus Kaltim* Masterplan PDF
* **User:** Requested a detailed visual PDF following the *Blueprint Neo Sabang* writing format.
* **Assistant:** Generated `blueprint_neo_kampus_kaltim.pdf` with warm parchment/bronze editorial styling and architectural SVG diagrams.

### Turn 9 — Expanding *Blueprint Neo Kampus Kaltim* to Full Masterplan Depth
* **User:** Requested a longer, deeper version matching the full structure of the reference book.
* **Assistant:** Expanded `blueprint_neo_kampus_kaltim.pdf` into a comprehensive 8-chapter masterplan including Prologue, Status Quo & Global Benchmarks (NUS/KAIST), 6-Pause Matrix, 3 System Transformations, 3-Scenario Economic/Time Recovery Math (206,915 hours & Rp6.13B/yr saved across 3 campuses), 50:50 Funding Scheme, Stakeholder Conflict Analysis, Circular Improvement Fund, and final English Abstract.

### Turn 10 — IG & WhatsApp Teaser Spoilers
* **User:** Requested enigmatic spoiler copy for Instagram Stories and WhatsApp to spark curiosity.
* **Assistant:** Provided 6 teaser copy options across 3 tones (Data-driven/Relatable, Blueprint Visionary, and Short/Punchy) plus visual tips.

### Turn 11 — Official Preliminary Abstract Submission Text
* **User:** Attempted image generation (rate-limited), then provided the official STACK 2026 Abstract template (`Identity Block` + 7 sections, 300–500 words) and requested the final submission text.
* **Assistant:** Delivered the exact 441-word English abstract under the project title **ClassPause: Autonomous Class Coordination Protocol and Micro-Learning Continuity Hub** (documented in Section 3 above).

### Turn 12 — Semifinal Qualification & Handbook Rules
* **User:** Announced that team `bug itu fitur` **advanced to the Semifinal Phase**, uploaded `Handbook STACK 2026.pdf`, and noted plans to record the semifinal video using Discord.
* **Assistant:** Analyzed the Semifinal rules (Nov 30 deadline, max 10-page English Proposal PDF + signed Declaration of Originality, max 2-min 1080p English video via Discord + OBS, and Semifinal rubric weights).

### Turn 13 — Prototype-First Strategy
* **User:** Asked whether to build the prototype first before writing the proposal.
* **Assistant:** Confirmed building the prototype first (Nov 20–25) is optimal so the video shows real working flows, the proposal documents real architecture and early usability tests (Nov 26), and 2–3 substantive tasks are intentionally reserved for Final Day (Dec 16).

### Turn 14 — Initial Prototype AI Prompt
* **User:** Requested an AI prompt to build a complete prototype aligned with the submitted abstract.
* **Assistant:** Provided an initial full-stack Next.js prototype prompt covering Student, Komti, and Lecturer views.

### Turn 15 — Cognitive Psychology Design System First
* **User:** Decided to build the Design System first incorporating psychological principles and behavioral UX patterns.
* **Assistant:** Defined the 4 cognitive psychology pillars (Pre-Attentive Processing, Hick's Law, Zeigarnik Effect, Fitts's Law), color tokens, typography scale, and component patterns.

### Turn 16 — Master AI Prompt (Living Design System + MVP Prototype)
* **User:** Requested the consolidated Master AI Prompt.
* **Assistant:** Delivered the complete Master AI Prompt combining the Living Design System & Cognitive Psychology showcase with the 3-role interactive ClassPause PWA prototype (documented in Section 4 above).

### Turn 17 — Full Knowledge Export (Current Turn)
* **User:** Requested all competition context, empirical data, and complete conversation logs in a downloadable `.md` file for other AI tools to assist in project development.
* **Assistant:** Generated this comprehensive Markdown file (`stack2026_classpause_full_context.md`).