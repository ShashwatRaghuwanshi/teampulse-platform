const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3008;

app.get('/health', (req, res) => res.json({ service: 'lambda-workers', status: 'UP' }));

// AWS EventBridge Consumer -> Updates Streaks, Badges, DynamoDB Team Rollups & Recommendations
app.post('/eventbridge/webhook', async (req, res) => {
  const { detail } = req.body;
  console.log('[AWS-Lambda-Worker] Processing EventBridge event:', JSON.stringify(detail));

  if (detail.status === 'COMPLETED' || detail.status === 'DONE') {
    await pool.query(
      `UPDATE leaderboard SET points = points + 50, streak = streak + 1,
       badge = CASE WHEN streak + 1 >= 5 THEN 'Streak Champion' ELSE 'Consistency Starter' END
       WHERE member_name = $1`,
      [detail.userName || 'Priya Sharma']
    );
    await pool.query(
      `UPDATE team_analytics_ddb SET total_points = total_points + 50, completion_rate = LEAST(100, completion_rate + 2)
       WHERE id = 'ta-5'`
    );
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
