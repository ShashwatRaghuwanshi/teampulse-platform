const express = require('express');
const cors = require('cors');
const { pool, authenticateJWT } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3002;

async function seedHabits() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS habits (
      id VARCHAR(50) PRIMARY KEY, user_id VARCHAR(50) NOT NULL, title VARCHAR(150) NOT NULL,
      activity_type VARCHAR(50) NOT NULL, visibility VARCHAR(30) NOT NULL, scheduled_time VARCHAR(20) NOT NULL
    );
    INSERT INTO habits (id, user_id, title, activity_type, visibility, scheduled_time) VALUES
    ('hab-101', 'usr-101', 'Desk Mobility & Hydration Routine', 'MOBILITY', 'PRIVATE', '09:00'),
    ('hab-102', 'usr-101', 'Evening 5K Brisk Walk', 'FITNESS', 'TEAM', '17:30'),
    ('hab-103', 'usr-101', '10-Min Guided Mindfulness', 'MINDFULNESS', 'PRIVATE', '14:00')
    ON CONFLICT (id) DO NOTHING;
  `);
}

app.get('/health', (req, res) => res.json({ service: 'habit-service', status: 'UP' }));

app.get('/api/habits', authenticateJWT, async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id as "userId", title, activity_type as "activityType", visibility, scheduled_time as "scheduledTime"
     FROM habits WHERE user_id = $1 OR visibility = 'TEAM' ORDER BY id ASC`,
    [req.user.userId]
  );
  res.json(result.rows);
});

app.post('/api/habits', authenticateJWT, async (req, res) => {
  const { title, activityType = 'MOBILITY', visibility = 'PRIVATE', scheduledTime = '09:00' } = req.body;
  const id = 'hab-' + Date.now();
  await pool.query(
    'INSERT INTO habits (id, user_id, title, activity_type, visibility, scheduled_time) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, req.user.userId, title, activityType, visibility, scheduledTime]
  );
  res.status(201).json({ id, userId: req.user.userId, title, activityType, visibility, scheduledTime });
});

app.patch('/api/habits/:id', authenticateJWT, async (req, res) => {
  const { scheduledTime, visibility } = req.body;
  if (scheduledTime) await pool.query('UPDATE habits SET scheduled_time = $1 WHERE id = $2', [scheduledTime, req.params.id]);
  if (visibility) await pool.query('UPDATE habits SET visibility = $1 WHERE id = $2', [visibility, req.params.id]);
  const updated = await pool.query(
    'SELECT id, user_id as "userId", title, activity_type as "activityType", visibility, scheduled_time as "scheduledTime" FROM habits WHERE id = $1',
    [req.params.id]
  );
  res.json(updated.rows[0] || { id: req.params.id, scheduledTime });
});

seedHabits().then(() => app.listen(PORT, () => console.log(`[habit-service] Running on ${PORT}`)));
