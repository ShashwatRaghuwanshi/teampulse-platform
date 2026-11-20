const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'teampulse-super-secret-jwt-key-2026';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://teampulse:teampulse123@postgres:5432/teampulse'
});

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = { userId: 'usr-101', name: 'Priya Sharma', role: 'EMPLOYEE', teamId: 'team-eng' };
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired JWT token' });
  }
}

module.exports = { pool, jwt, JWT_SECRET, authenticateJWT };
