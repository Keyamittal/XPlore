import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

// Initialize DB
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB Connection Error:', err.message);
  else console.log('Connected to SQLite DB.');
});

// Setup Schema & Seed
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    initials TEXT,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 1,
    title TEXT DEFAULT 'NOVICE',
    join_date TEXT
  )`);

  // Insert Mock User
  const insertMockUser = db.prepare(`INSERT OR IGNORE INTO users (id, username, password, full_name, initials, total_xp, level, streak, title, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertMockUser.run('u1', 'AryanK', 'hackathon2026', 'Aryan K', 'AK', 3450, 4, 12, 'CYBER RONIN', 'Nov 2023');
  insertMockUser.finalize();

  db.run(`CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    category TEXT,
    difficulty INTEGER,
    xp_reward INTEGER,
    completed BOOLEAN DEFAULT 0,
    user_id TEXT
  )`);

  // We could seed initial quests here, but for brevity, we'll let the frontend send default quests if empty.
});

const app = express();
app.use(cors());
app.use(express.json());

// -------------- ROUTES --------------

// 1. Auth/Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  db.get(`SELECT id, username, full_name as fullName, initials, total_xp as xp, level, streak, title, join_date as joinDate FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid username or password' });
    
    // Convert to frontend friendly structure
    const xpProgress = row.xp % 100;
    const computedLevel = Math.floor(row.xp / 100) + 1;
    const user = { ...row, level: computedLevel, xp: xpProgress, totalXP: row.xp, xpToNext: 100 };
    res.json({ user, token: 'mock-jwt-token' });
  });
});

// 1.2 Auth/Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Missing fields. Username, password, and full name are required.' });
  }

  // Check for duplicate username
  db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(409).json({ error: 'Username already taken' });

    // Generate fields
    const id = `u_${Date.now()}`;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    const joinDate = `${months[d.getMonth()]} ${d.getFullYear()}`;

    // Compute initials
    let initials = '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].substring(0, 2).toUpperCase();
    } else {
      initials = 'XX';
    }

    // Insert user
    db.run(
      `INSERT INTO users (id, username, password, full_name, initials, total_xp, level, streak, title, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, username, password, fullName, initials, 0, 1, 1, 'NOVICE', joinDate],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({
          user: {
            id,
            username,
            fullName,
            initials,
            xp: 0,
            level: 1,
            streak: 1,
            title: 'NOVICE',
            joinDate,
            totalXP: 0,
            xpToNext: 100
          },
          token: 'mock-jwt-token'
        });
      }
    );
  });
});


// 1.5 Auto-Sync Profile
app.post('/api/user/sync', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  db.get(`SELECT id, username, full_name as fullName, initials, total_xp as xp, level, streak, title, join_date as joinDate FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    
    // Convert to frontend friendly structure
    const xpProgress = row.xp % 100;
    const computedLevel = Math.floor(row.xp / 100) + 1;
    const user = { ...row, level: computedLevel, xp: xpProgress, totalXP: row.xp, xpToNext: 100 };
    res.json({ user });
  });
});

// 2. Add XP (Level Up Logic)
app.post('/api/user/add-xp', (req, res) => {
  const { userId, amount } = req.body;
  
  db.get(`SELECT total_xp, level, title FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'User not found' });
    
    let newTotalXp = row.total_xp + amount;
    let newLevel = Math.floor(newTotalXp / 100) + 1;
    let xpToNext = 100;
    let newXpProgress = newTotalXp % 100;

    // Recover if missing from previous bug
    let newTitle = row.title || 'CYBER RONIN';
    if (newLevel >= 10) newTitle = 'CYBER KNIGHT';
    if (newLevel >= 20) newTitle = 'NEON MASTER';

    db.run(`UPDATE users SET total_xp = ?, level = ?, title = ? WHERE id = ?`, [newTotalXp, newLevel, newTitle, userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, newXp: newXpProgress, totalXP: newTotalXp, newLevel, newTitle, xpToNext });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on http://localhost:${PORT}`));
