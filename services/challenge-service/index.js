const express = require('express');
const cors = require('cors');
const { pool, authenticateJWT } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3003;

async function seedChallenges() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS challenges (
      id VARCHAR(50) PRIMARY KEY, title VARCHAR(150) NOT NULL, activity_type VARCHAR(50) NOT NULL,
      status VARCHAR(30) NOT NULL, start_date VARCHAR(20) NOT NULL, end_date VARCHAR(20) NOT NULL, participants_count INT DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS challenge_participants (
      challenge_id VARCHAR(50) NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      PRIMARY KEY (challenge_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS leaderboard (
      id VARCHAR(50) PRIMARY KEY, challenge_id VARCHAR(50) NOT NULL, team_name VARCHAR(100) NOT NULL,
      member_name VARCHAR(100) NOT NULL, points INT DEFAULT 0, streak INT DEFAULT 0, badge VARCHAR(80) DEFAULT 'Starter'
    );
    INSERT INTO challenges (id, title, activity_type, status, start_date, end_date, participants_count) VALUES
    ('chal-1', '10,000 Steps & Mobility Sprint', 'FITNESS', 'ACTIVE', '2026-11-01', '2026-11-30', 24),
    ('chal-2', 'Hydration & Desk Stretch Week', 'MOBILITY', 'ACTIVE', '2026-11-05', '2026-11-28', 18),
    ('chal-3', 'Mindful October Recharge', 'MINDFULNESS', 'COMPLETED', '2026-10-01', '2026-10-31', 32)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO leaderboard (id, challenge_id, team_name, member_name, points, streak, badge) VALUES
    ('lb-1', 'chal-1', 'Engineering-Alpha', 'Priya Sharma', 420, 4, 'Consistency Starter'),
    ('lb-2', 'chal-1', 'Cloud-SecOps', 'Aarav Patel', 390, 3, 'Early Bird'),
    ('lb-3', 'chal-1', 'Engineering-Alpha', 'Neha Gupta', 350, 2, 'Team Player'),
    ('lb-4', 'chal-1', 'Product-Design', 'Rohan Mehta', 310, 2, 'Starter')
    ON CONFLICT (id) DO NOTHING;
  `);
}

app.get('/health', (req, res) => res.json({ service: 'challenge-service', status: 'UP' }));

app.get('/api/challenges', authenticateJWT, async (req, res) => {
  const challenges = await pool.query(
    'SELECT id, title, activity_type as "activityType", status, start_date as "startDate", end_date as "endDate", participants_count as "participantsCount" FROM challenges ORDER BY id ASC'
  );
  const joinedRows = await pool.query(
    'SELECT challenge_id FROM challenge_participants WHERE user_id = $1',
    [req.user.userId]
  );
  const joinedSet = new Set(joinedRows.rows.map((r) => r.challenge_id));

  const enrichedChallenges = challenges.rows.map((c) => ({
    ...c,
    joined: joinedSet.has(c.id)
  }));

  const leaderboard = await pool.query(
    'SELECT id, challenge_id as "challengeId", team_name as "teamName", member_name as "memberName", points, streak, badge FROM leaderboard ORDER BY points DESC'
  );
  res.json({ challenges: enrichedChallenges, leaderboard: leaderboard.rows });
});

app.post('/api/challenges', authenticateJWT, async (req, res) => {
  const { title, activityType = 'FITNESS', startDate = '2026-11-01', endDate = '2026-11-30' } = req.body;
  const id = 'chal-' + Date.now();
  await pool.query(
    'INSERT INTO challenges (id, title, activity_type, status, start_date, end_date, participants_count) VALUES ($1,$2,$3,$4,$5,$6,1)',
    [id, title, activityType, 'ACTIVE', startDate, endDate]
  );
  res.status(201).json({ id, title, activityType, status: 'ACTIVE', startDate, endDate, participantsCount: 1 });
});

app.post('/api/challenges/:id/join', authenticateJWT, async (req, res) => {
  const insertRes = await pool.query(
    'INSERT INTO challenge_participants (challenge_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.params.id, req.user.userId]
  );
  if (insertRes.rowCount > 0) {
    await pool.query('UPDATE challenges SET participants_count = participants_count + 1 WHERE id = $1', [req.params.id]);
  }
  res.json({ message: 'Joined challenge successfully', challengeId: req.params.id, joined: true });
});

seedChallenges().then(() => app.listen(PORT, () => console.log(`[challenge-service] Running on ${PORT}`)));