const express = require('express');
const cors = require('cors');
const { pool, authenticateJWT } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3004;
const LAMBDA_WORKER_URL = process.env.LAMBDA_WORKER_URL || 'http://lambda-workers:3008';

function daysAgoISO(days, timeStr) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const datePart = d.toISOString().slice(0, 10);
  return `${datePart}T${timeStr}Z`;
}

async function seedEvents() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_events (
      id VARCHAR(50) PRIMARY KEY, user_id VARCHAR(50) NOT NULL, team_id VARCHAR(50) NOT NULL,
      habit_id VARCHAR(50) NOT NULL, activity_type VARCHAR(50) NOT NULL, status VARCHAR(30) NOT NULL, logged_at VARCHAR(40) NOT NULL
    );
  `);

  // Clear old hardcoded seed rows and insert dynamic 3-day consecutive history right before today
  await pool.query(`DELETE FROM activity_events WHERE user_id = 'usr-101'`);
  await pool.query(
    `INSERT INTO activity_events (id, user_id, team_id, habit_id, activity_type, status, logged_at) VALUES
    ('evt-1', 'usr-101', 'team-eng', 'hab-101', 'MOBILITY', 'MISSED', $1),
    ('evt-2', 'usr-101', 'team-eng', 'hab-102', 'FITNESS', 'COMPLETED', $2),
    ('evt-3', 'usr-101', 'team-eng', 'hab-101', 'MOBILITY', 'MISSED', $3),
    ('evt-4', 'usr-101', 'team-eng', 'hab-102', 'FITNESS', 'COMPLETED', $4),
    ('evt-5', 'usr-101', 'team-eng', 'hab-101', 'MOBILITY', 'COMPLETED', $5)`,
    [
      daysAgoISO(3, '09:00:00'),
      daysAgoISO(3, '17:30:00'),
      daysAgoISO(2, '09:00:00'),
      daysAgoISO(2, '17:30:00'),
      daysAgoISO(1, '17:35:00')
    ]
  );
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