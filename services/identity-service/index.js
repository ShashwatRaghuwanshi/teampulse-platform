const express = require('express');
const cors = require('cors');
const { pool, jwt, JWT_SECRET } = require('./db');

const app = express();
app.use(cors(), express.json());
const PORT = process.env.PORT || 3001;

async function seedIdentity() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL, role VARCHAR(30) NOT NULL, team_id VARCHAR(50) NOT NULL
    );
    INSERT INTO users (id, name, email, password, role, team_id) VALUES
    ('usr-101', 'Priya Sharma', 'priya@teampulse.com', 'Password123!', 'EMPLOYEE', 'team-eng'),
    ('usr-102', 'Rajesh Verma', 'rajesh@teampulse.com', 'Password123!', 'MANAGER', 'team-eng'),
    ('usr-103', 'Vikram Admin', 'admin@teampulse.com', 'Password123!', 'ADMIN', 'team-eng')
    ON CONFLICT (id) DO NOTHING;
  `);
}

app.get('/health', (req, res) => res.json({ service: 'identity-service', status: 'UP' }));

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role = 'EMPLOYEE', teamId = 'team-eng' } = req.body;
  const id = 'usr-' + Date.now();
  await pool.query(
    'INSERT INTO users (id, name, email, password, role, team_id) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING',
    [id, name, email, password, role, teamId]
  );
  const token = jwt.sign({ userId: id, name, email, role, teamId }, JWT_SECRET, { expiresIn: '12h' });
  res.status(201).json({ token, user: { id, name, email, role, teamId } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user || user.password !== password) {
    console.error(JSON.stringify({ event: 'AUTH_FAILED', email, timestamp: new Date().toISOString() }));
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { userId: user.id, name: user.name, email: user.email, role: user.role, teamId: user.team_id },
    JWT_SECRET, { expiresIn: '12h' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.team_id } });
});

seedIdentity().then(() => app.listen(PORT, () => console.log(`[identity-service] Running on ${PORT}`)));
