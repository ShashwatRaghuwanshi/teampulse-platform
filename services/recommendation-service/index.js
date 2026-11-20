const express = require('express');
const cors = require('cors');
const { pool, authenticateJWT } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3006;

async function seedRecommendations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recommendations_ddb (
      id VARCHAR(50) PRIMARY KEY, user_id VARCHAR(50) NOT NULL, habit_id VARCHAR(50) NOT NULL,
      habit_title VARCHAR(150) NOT NULL, current_slot VARCHAR(20) NOT NULL, recommended_slot VARCHAR(20) NOT NULL,
      reason TEXT NOT NULL, confidence_score NUMERIC(4,2) NOT NULL, status VARCHAR(30) DEFAULT 'PENDING'
    );
    INSERT INTO recommendations_ddb (id, user_id, habit_id, habit_title, current_slot, recommended_slot, reason, confidence_score, status) VALUES
    ('rec-101', 'usr-101', 'hab-101', 'Desk Mobility & Hydration Routine', '09:00', '17:30',
     'You missed 100% of activities scheduled at 09:00 AM, but completed 100% of activities logged between 17:00 and 18:00.', 0.92, 'PENDING')
    ON CONFLICT (id) DO NOTHING;
  `);
}

app.get('/health', (req, res) => res.json({ service: 'recommendation-service', status: 'UP' }));

app.get('/api/recommendations', authenticateJWT, async (req, res) => {
  const recs = await pool.query(
    `SELECT id, user_id as "userId", habit_id as "habitId", habit_title as "habitTitle",
            current_slot as "currentSlot", recommended_slot as "recommendedSlot",
            reason, confidence_score as "confidenceScore", status
     FROM recommendations_ddb WHERE user_id = $1 ORDER BY id DESC`,
    [req.user.userId]
  );
  res.json(recs.rows);
});

app.post('/api/recommendations/:id/accept', authenticateJWT, async (req, res) => {
  const recResult = await pool.query('SELECT * FROM recommendations_ddb WHERE id = $1', [req.params.id]);
  const rec = recResult.rows[0];
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

  await pool.query("UPDATE recommendations_ddb SET status = 'ACCEPTED' WHERE id = $1", [req.params.id]);
  await pool.query('UPDATE habits SET scheduled_time = $1 WHERE id = $2', [rec.recommended_slot, rec.habit_id]);

  await pool.query(
    'INSERT INTO notifications_ddb (id, user_id, message, category, created_at) VALUES ($1,$2,$3,$4,$5)',
    [
      'notif-' + Date.now(), rec.user_id,
      `Timing recommendation accepted! '${rec.habit_title}' shifted from ${rec.current_slot} to ${rec.recommended_slot}.`,
      'SCHEDULE_UPDATE', new Date().toISOString()
    ]
  );

  res.json({
    message: 'Recommendation accepted and habit schedule updated',
    recommendationId: rec.id, habitId: rec.habit_id, newScheduledTime: rec.recommended_slot, status: 'ACCEPTED'
  });
});

seedRecommendations().then(() => app.listen(PORT, () => console.log(`[recommendation-service] Running on ${PORT}`)));
