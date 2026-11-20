const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3008;

app.get('/health', (req, res) => res.json({ service: 'lambda-workers', status: 'UP' }));

// Compute true consecutive calendar-day streak from completed activity logs
async function computeTrueStreak(userId) {
  const res = await pool.query(
    `SELECT DISTINCT SUBSTRING(logged_at, 1, 10) AS day_str
     FROM activity_events
     WHERE user_id = $1 AND status IN ('COMPLETED', 'DONE')
     ORDER BY day_str DESC`,
    [userId]
  );

  const days = res.rows.map((r) => r.day_str);
  if (days.length === 0) return 0;

  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    const curr = new Date(days[i] + 'T00:00:00Z');
    const prev = new Date(days[i + 1] + 'T00:00:00Z');
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// AWS EventBridge Consumer -> Updates Streaks, Badges, DynamoDB Team Rollups & Recommendations
app.post('/eventbridge/webhook', async (req, res) => {
  const { detail } = req.body;
  console.log('[AWS-Lambda-Worker] Processing EventBridge event:', JSON.stringify(detail));

  if (detail.status === 'COMPLETED' || detail.status === 'DONE') {
    const trueStreak = await computeTrueStreak(detail.userId || 'usr-101');

    // Count distinct completed habits today to prevent duplicate point farming on the same habit/day
    const todayStr = (detail.loggedAt || new Date().toISOString()).slice(0, 10);
    const dupCheck = await pool.query(
      `SELECT COUNT(*) AS cnt FROM activity_events
       WHERE user_id = $1 AND habit_id = $2 AND status IN ('COMPLETED', 'DONE')
       AND SUBSTRING(logged_at, 1, 10) = $3`,
      [detail.userId || 'usr-101', detail.habitId, todayStr]
    );
    const isFirstCompletionTodayForHabit = parseInt(dupCheck.rows[0].cnt, 10) <= 1;
    const pointsToAdd = isFirstCompletionTodayForHabit ? 50 : 0;

    await pool.query(
      `UPDATE leaderboard
       SET points = points + $1,
           streak = $2,
           badge = CASE WHEN $2 >= 5 THEN 'Streak Champion' ELSE 'Consistency Starter' END
       WHERE member_name = $3`,
      [pointsToAdd, trueStreak, detail.userName || 'Priya Sharma']
    );

    if (pointsToAdd > 0) {
      await pool.query(
        `UPDATE team_analytics_ddb SET total_points = total_points + 50, completion_rate = LEAST(100, completion_rate + 2)
         WHERE id = 'ta-5'`
      );
    }
  } else if (detail.status === 'MISSED') {
    const habitRes = await pool.query('SELECT * FROM habits WHERE id = $1', [detail.habitId]);
    const habit = habitRes.rows[0];
    if (habit) {
      const recId = 'rec-auto-' + detail.habitId;
      await pool.query(
        `INSERT INTO recommendations_ddb (id, user_id, habit_id, habit_title, current_slot, recommended_slot, reason, confidence_score, status)
         VALUES ($1, $2, $3, $4, $5, '17:30', $6, 0.94, 'PENDING')
         ON CONFLICT (id) DO UPDATE SET status = 'PENDING'`,
        [
          recId, detail.userId, habit.id, habit.title, habit.scheduled_time,
          `Detected missed activity at ${habit.scheduled_time}. Your completion rate is 94% higher between 17:00 and 18:00.`
        ]
      );
    }
  }
  res.json({ processed: true });
});

app.listen(PORT, () => console.log(`[lambda-workers] EventBridge consumer listening on ${PORT}`));