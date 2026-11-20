const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 8080;

const routes = {
  '/api/auth': 'http://identity-service:3001',
  '/api/habits': 'http://habit-service:3002',
  '/api/challenges': 'http://challenge-service:3003',
  '/api/events': 'http://event-tracking-service:3004',
  '/api/insights': 'http://insight-service:3005',
  '/api/recommendations': 'http://recommendation-service:3006',
  '/api/notifications': 'http://notification-service:3007'
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', gateway: 'TeamPulse-ALB-Gateway', timestamp: new Date().toISOString() });
});

Object.entries(routes).forEach(([prefix, target]) => {
  app.use(prefix, createProxyMiddleware({ target, changeOrigin: true }));
});

app.listen(PORT, () => console.log(`[api-gateway] Routing traffic on port ${PORT}`));
