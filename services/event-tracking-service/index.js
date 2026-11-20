const express = require('express');
const cors = require('cors');
const { pool, authenticateJWT } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3004;
const LAMBDA_WORKER_URL = process.env.LAMBDA_WORKER_URL || 'http://lambda-workers:3008';

async function seedEvents() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_events (
      id VARCHAR(50) PRIMARY KEY, user_id VARCHAR(50) NOT NULL, team_id VARCHAR(50) NOT NULL,
      habit_id VARCHAR(50) NOT NULL, activity_type VARCHAR(50) NOT NULL, status VARCHAR(30) NOT NULL, logged_at VARCHAR(40) NOT NULL
    );
    DELETE FROM activity_events WHERE id IN ('evt-1', 'evt-2', 'evt-3', 'evt-4', 'evt-5');
    INSERT INTO activity_events (id, user_id, team_id, habit_id, activity_type, status, logged_at) VALUES
    ('evt-1', 'usr-101', 'team-eng', 'hab-101', 'MOBILITY', 'MISSED', '2026-11-17T09:00:00Z'),
    ('evt-2', 'usr-101', 'team-eng', 'hab-102', 'FITNESS', 'COMPLETED', '2026-11-17T17:30:00Z'),
    ('evt-3', 'usr-101', 'team-eng', 'hab-101', 'MOBILITY', 'MISSED', '2026-11-18T09:00:00Z'),
    ('evt-4', 'usr-101', 'team-eng', 'hab-102', 'FITNESS', 'COMPLETED', '2026-11-18T17:30:00Z'),
    ('evt-5', 'usr-101', 'team-eng', 'hab-101', 'MOBILITY', 'COMPLETED', '2026-11-19T17:35:00Z')
    ON CONFLICT (id) DO NOTHING;
  `);
}

app.get('/health', (req, res) => res.json({ service: 'event-tracking-service', status: 'UP' }));

app.get('/api/events/activity', authenticateJWT, async (req, res) => {
  const logs = await pool.query(
    'SELECT id, habit_id as "habitId", activity_type as "activityType", status, logged_at as "loggedAt" FROM activity_events WHERE user_id = $1 ORDER BY logged_at DESC',
    [req.user.userId]
  );
  res.json(logs.rows);
});

app.post('/api/events/activity', authenticateJWT, async (req, res) => {
  const { habitId, activityType = 'MOBILITY', status = 'COMPLETED', loggedAt } = req.body;
  const id = 'evt-' + Date.now();
  const timestamp = loggedAt || new Date().toISOString();

  await pool.query(
    'INSERT INTO activity_events (id, user_id, team_id, habit_id, activity_type, status, logged_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, req.user.userId, req.user.teamId || 'team-eng', habitId, activityType, status, timestamp]
  );

  const eventPayload = {
    source: 'teampulse.event-tracking',
    detailType: 'ActivityLogged',
    detail: { id, userId: req.user.userId, userName: req.user.name, teamId: req.user.teamId || 'team-eng', habitId, activityType, status, loggedAt: timestamp }
  };

  fetch(`${LAMBDA_WORKER_URL}/eventbridge/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventPayload)
  }).catch((err) => console.error('EventBridge dispatch warning:', err.message));

  res.status(201).json({ eventId: id, status, loggedAt: timestamp, publishedToEventBridge: true });
});

seedEvents().then(() => app.listen(PORT, () => console.log(`[event-tracking-service] Running on ${PORT}`)));