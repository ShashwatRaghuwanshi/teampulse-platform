# TeamPulse: End-to-End User Walkthrough Scenario

This walkthrough demonstrates the complete lifecycle of a user inside TeamPulse, covering authentication, habit creation, activity tracking (`MISSED` / `COMPLETED`), streak & badge calculation, personalized timing recommendations, and Manager privacy boundaries.

---

## Scenario Persona
* **Employee User:** Priya Sharma (`priya@teampulse.com`, Role: `EMPLOYEE`, Team: `Engineering-Alpha`)
* **Manager User:** Rajesh Verma (`rajesh@teampulse.com`, Role: `MANAGER`, Team: `Engineering-Alpha`)

---

## Step-by-Step User Journey

### Step 1: User Registration & Login (`Identity Service`)
1. Priya opens the TeamPulse web application (`http://localhost:5173` locally or the S3/CloudFront URL in AWS).
2. She registers/signs in as an `EMPLOYEE` in team `Engineering-Alpha`.
3. **Behind the Scenes:** `POST /api/auth/login` validates her credentials against Amazon RDS and returns a signed JWT containing `{ userId: "usr-101", role: "EMPLOYEE", teamId: "team-eng" }`.
4. The SvelteKit layout reads her role using Svelte 5 Runes (`$state`) and displays the Employee navigation tabs: **Dashboard, Habits, Challenges, Analytics, and Recommendations** (hiding the Admin tab).

### Step 2: Joining a Team Challenge (`Challenge Service`)
1. Priya navigates to the **Challenges** route (`/challenges`).
2. She uses the reactive Svelte 5 search and filter controls (`Activity Type: FITNESS`, `Status: ACTIVE`) to find the **"10,000 Steps & Mobility Sprint"** challenge.
3. She clicks **"Join Challenge"**.
4. **Behind the Scenes:** `POST /api/challenges/chal-1/join` adds Priya to the challenge participants table in RDS, and the `<tp-leaderboard>` Web Component refreshes dynamically.

### Step 3: Creating a Personal Wellness Activity (`Habit Service`)
1. Priya navigates to the **Habits** route (`/habits`) and clicks **"+ New Habit"**.
2. She creates an activity:
   * **Title:** `Desk Mobility & Hydration Routine`
   * **Activity Type:** `MOBILITY`
   * **Visibility:** `PRIVATE` (only visible to Priya, hidden from teammates and managers)
   * **Scheduled Time:** `09:00` (9:00 AM daily)
3. **Behind the Scenes:** `POST /api/habits` saves the habit in RDS with `visibility = 'PRIVATE'`.

### Step 4: Marking Activities as Missed and Completed (`Event Tracking` + `EventBridge` + `Lambda`)
1. Over the week, Priya logs her activity status on the Habits page:
   * **Monday (09:00 AM):** She is busy in daily standup and clicks **"Mark Missed"**.
   * **Tuesday (09:00 AM):** She misses the morning slot again (**"Mark Missed"**), but logs a completion later that evening at **05:30 PM** (**"Mark Done / Completed"**).
   * **Wednesday & Thursday (05:30 PM):** She marks the activity **"Completed"** around 5:30 PM.
2. **Behind the Scenes:**
   * Each click sends `POST /api/events/activity` to the **Event Tracking Service**, saving the timestamped event in **Amazon RDS**.
   * An `ActivityLogged` event is published to **AWS EventBridge**.
   * **AWS Lambda** consumes the event, updates Priya's streak to `3 Days`, awards the **"Consistency Starter"** badge, increments `Engineering-Alpha`'s challenge score, and writes an anonymized daily team rollup to **Amazon DynamoDB**.

### Step 5: Viewing Personal & Manager Analytics (`Insight Service`)
1. Priya visits `/analytics`. She sees her `<tp-progress-ring>` at **75% completion**, her `<tp-progress-card>` displaying a **3-Day Streak**, and her personal `<tp-trend-chart>`.
2. Next, her manager **Rajesh (`MANAGER`)** logs in and visits `/analytics`.
3. **Privacy Enforcement Verified:** Rajesh sees the aggregated `<tp-trend-chart>` for `Engineering-Alpha` (showing overall team participation percentage and total team points from DynamoDB), but has **zero access** to Priya's private `"Desk Mobility & Hydration Routine"` habit or her personal missed logs.

### Step 6: Viewing & Accepting a Personalized Timing Recommendation (`Recommendation Service`)
1. Priya navigates to the **Recommendations** route (`/recommendations`).
2. Because she missed two `09:00 AM` logs but consistently completed activities around `05:30 PM`, the **Recommendation Microservice** displays a smart card:
   * **Insight:** *"You have missed 100% of activities scheduled at 09:00 AM, but completed 100% of activities logged between 05:00 PM and 06:00 PM."*
   * **Recommended Action:** *"Shift 'Desk Mobility & Hydration Routine' from 09:00 to 17:30."*
   * **Confidence Score:** `92%`
3. Priya clicks **"Accept Recommendation"**.
4. **Behind the Scenes:**
   * `POST /api/recommendations/rec-101/accept` marks the recommendation as `ACCEPTED` in DynamoDB.
   * The Recommendation Service calls the Habit Service (`PATCH /api/habits/hab-101`) to update `scheduledTime` from `09:00` to `17:30`.
   * The Notification Service logs a confirmation alert: *"Habit schedule updated to 17:30!"*
5. Priya returns to `/habits` and confirms her habit now shows **Scheduled: 17:30 (5:30 PM)**.