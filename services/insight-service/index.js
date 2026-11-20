const express = require('express');
const cors = require('cors');
const { pool, authenticateJWT } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3005;

async function seedInsights() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_analytics_ddb (
      id VARCHAR(50) PRIMARY KEY, team_id VARCHAR(50) NOT NULL, date_label VARCHAR(30) NOT NULL,
      completion_rate INT NOT NULL, active_members INT NOT NULL, total_points INT NOT NULL
    );
    INSERT INTO team_analytics_ddb (id, team_id, date_label, completion_rate, active_members, total_points) VALUES
    ('ta-1', 'team-eng', 'Mon', 68, 14, 820),
    ('ta-2', 'team-eng', 'Tue', 74, 16, 940),
    ('ta-3', 'team-eng', 'Wed', 81, 18, 1120),
    ('ta-4', 'team-eng', 'Thu', 85, 19, 1290),
    ('ta-5', 'team-eng', 'Fri', 89, 21, 1480)
    ON CONFLICT (id) DO NOTHING;
  `);
}

app.get('/health', (req, res) => res.json({ service: 'insight-service', status: 'UP' }));

app.get('/api/insights/personal', authenticateJWT, async (req, res) => {
  const events = await pool.query('SELECT status FROM activity_events WHERE user_id = $1', [req.user.userId]);
  const total = events.rows.length || 1;
  const completed = events.rows.filter((e) => e.status === 'COMPLETED' || e.status === 'DONE').length;
  const missed = events.rows.filter((e) => e.status === 'MISSED').length;
  const lb = await pool.query('SELECT points, streak, badge FROM leaderboard WHERE member_name = $1 LIMIT 1', [req.user.name || 'Priya Sharma']);
  const stats = lb.rows[0] || { points: 420, streak: 4, badge: 'Consistency Starter' };

  res.json({
    completionRate: Math.round((completed / total) * 100),
    completedCount: completed,
    missedCount: missed,
    currentStreak: stats.streak,
    totalPoints: stats.points,
    activeBadge: stats.badge
  });
});

// Manager Privacy Boundary: Returns ONLY Aggregated Team Trends (Zero Personal Habit PII)
app.get('/api/insights/team/:teamId', authenticateJWT, async (req, res) => {
  const trends = await pool.query(
    'SELECT date_label as "label", completion_rate as "completionRate", active_members as "activeMembers", total_points as "totalPoints" FROM team_analytics_ddb WHERE team_id = $1 ORDER BY id ASC',
    [req.params.teamId]
  );
  res.json({
    teamId: req.params.teamId,
    privacyNotice: 'PII & Private Habits Redacted — Aggregated Team Metrics Only',
    trends: trends.rows
  });
});

seedInsights().then(() => app.listen(PORT, () => console.log(`[insight-service] Running on ${PORT}`)));
