const express = require('express');
const cors = require('cors');
const { pool, authenticateJWT } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3007;

async function seedNotifications() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications_ddb (
      id VARCHAR(50) PRIMARY KEY, user_id VARCHAR(50) NOT NULL, message TEXT NOT NULL,
      category VARCHAR(40) NOT NULL, created_at VARCHAR(40) NOT NULL
    );
    INSERT INTO notifications_ddb (id, user_id, message, category, created_at) VALUES
    ('notif-1', 'usr-101', 'Badge Unlocked: Consistency Starter (4-Day Streak)!', 'MILESTONE', '2026-11-16T18:00:00Z'),
    ('notif-2', 'usr-101', 'New Smart Timing Recommendation available for Desk Mobility & Hydration Routine.', 'RECOMMENDATION', '2026-11-17T08:00:00Z')
    ON CONFLICT (id) DO NOTHING;
  `);
}

app.get('/health', (req, res) => res.json({ service: 'notification-service', status: 'UP' }));

app.get('/api/notifications', authenticateJWT, async (req, res) => {
  const notes = await pool.query(
    'SELECT id, message, category, created_at as "createdAt" FROM notifications_ddb WHERE user_id = $1 ORDER BY created_at DESC LIMIT 15',
    [req.user.userId]
  );
  res.json(notes.rows);
});

seedNotifications().then(() => app.listen(PORT, () => console.log(`[notification-service] Running on ${PORT}`)));
