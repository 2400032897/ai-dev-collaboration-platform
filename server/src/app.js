require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { syncDB } = require('./models');
const socketHandler = require('./socket/socket.handler');
const taskCtrl = require('./controllers/task.controller');

// ── Express app ───────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in controllers
app.set('io', io);
taskCtrl.setIO(io);

// Initialize socket handler
socketHandler(io);

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/workspaces', require('./routes/workspace.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/snippets', require('./routes/snippet.routes'));
app.use('/api/wiki', require('./routes/wiki.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/activity', require('./routes/activity.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

syncDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 DevCollab server running on http://localhost:${PORT}`);
    console.log(`🌍 Accepting requests from: ${process.env.CLIENT_URL}`);
  });
});
