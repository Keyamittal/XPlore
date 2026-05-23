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

  db.run(`CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    type TEXT,
    skill TEXT,
    description TEXT,
    tags TEXT,
    posted_by TEXT,
    initials TEXT,
    duration TEXT,
    bonus_xp INTEGER,
    accepted BOOLEAN DEFAULT 0,
    accepted_by TEXT DEFAULT NULL,
    accepted_by_email TEXT DEFAULT NULL,
    accepted_by_phone TEXT DEFAULT NULL,
    email TEXT,
    phone TEXT,
    user_id TEXT DEFAULT NULL
  )`);

  db.run(`ALTER TABLE skills ADD COLUMN accepted_by_email TEXT`, (err) => {
    // Safe fallback if column already exists
  });
  db.run(`ALTER TABLE skills ADD COLUMN accepted_by_phone TEXT`, (err) => {
    // Safe fallback if column already exists
  });

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    skill_id TEXT,
    skill_name TEXT,
    partner_name TEXT,
    date TEXT,
    time TEXT,
    venue TEXT,
    user_id TEXT
  )`);

  // Remove any fake preset skills to ensure 100% actual registered postings
  db.run("DELETE FROM skills WHERE user_id IS NULL", function(err) {
    if (err) console.error("Error clearing presets:", err.message);
    else console.log("🚀 SQLite DB: Cleared fake preset skills successfully!");
  });
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
    
    // Defensive parsing & healing of NaN values in database
    let totalXp = parseInt(row.xp);
    if (isNaN(totalXp) || totalXp === null) {
      totalXp = 0;
      db.run(`UPDATE users SET total_xp = 0, level = 1 WHERE id = ?`, [userId]);
    }
    
    const xpProgress = totalXp % 100;
    const computedLevel = Math.floor(totalXp / 100) + 1;
    const user = { ...row, level: computedLevel, xp: xpProgress, totalXP: totalXp, xpToNext: 100 };
    res.json({ user });
  });
});

// 2. Add XP (Level Up Logic)
app.post('/api/user/add-xp', (req, res) => {
  const { userId, amount } = req.body;
  
  const xpAmount = parseInt(amount) || 0;
  
  db.get(`SELECT total_xp, level, title FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'User not found' });
    
    let currentTotalXp = parseInt(row.total_xp);
    if (isNaN(currentTotalXp)) {
      currentTotalXp = 0;
    }
    
    let newTotalXp = currentTotalXp + xpAmount;
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

// 3. Get Leaderboard (All Registered Users)
app.get('/api/users/leaderboard', (req, res) => {
  db.all(
    `SELECT id, username, initials, level, title, total_xp as totalXP, streak FROM users ORDER BY total_xp DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const formatted = rows.map(r => {
        let xp = parseInt(r.totalXP);
        if (isNaN(xp)) xp = 0;
        let lv = parseInt(r.level);
        if (isNaN(lv)) lv = Math.floor(xp / 100) + 1;
        
        return {
          id: r.id,
          username: r.username,
          initials: r.initials || '??',
          level: lv,
          title: r.title || 'NOVICE',
          totalXP: xp,
          streak: r.streak || 1
        };
      });
      
      res.json({ users: formatted });
    }
  );
});

// -------------- SKILLS EXCHANGE ROUTES --------------

// 1. Get All Shared Skills
app.get('/api/skills', (req, res) => {
  db.all(`
    SELECT s.*, u.username as accepted_by_username 
    FROM skills s
    LEFT JOIN users u ON s.accepted_by = u.id
    ORDER BY s.rowid DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const formatted = rows.map(r => ({
      ...r,
      tags: r.tags ? r.tags.split(',').map(t => t.trim()) : [],
      accepted: !!r.accepted,
      postedBy: r.posted_by,
      bonusXp: r.bonus_xp,
      userId: r.user_id,
      acceptedBy: r.accepted_by,
      acceptedByUsername: r.accepted_by_username,
      acceptedByEmail: r.accepted_by_email,
      acceptedByPhone: r.accepted_by_phone
    }));
    res.json({ skills: formatted });
  });
});

// 2. Post a Skill (Store credentials dynamically)
app.post('/api/skills', (req, res) => {
  const { id, type, skill, description, tags, postedBy, initials, duration, bonusXp, email, phone, userId } = req.body;
  if (!id || !type || !skill || !description || !postedBy || !initials) {
    return res.status(400).json({ error: 'Missing required skill fields' });
  }

  const tagsStr = Array.isArray(tags) ? tags.join(', ') : tags || 'Custom';

  db.run(
    `INSERT INTO skills (id, type, skill, description, tags, posted_by, initials, duration, bonus_xp, email, phone, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, type, skill, description, tagsStr, postedBy, initials, duration || '1 hr', bonusXp || 15, email, phone, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true });
    }
  );
});

// 3. Accept a Skill Exchange (Match Secured)
app.post('/api/skills/accept', (req, res) => {
  const { id, userId, email, phone } = req.body;
  if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId' });

  db.run(
    `UPDATE skills SET accepted = 1, accepted_by = ?, accepted_by_email = ?, accepted_by_phone = ? WHERE id = ?`,
    [userId, email, phone, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// -------------- STUDY SESSIONS TIMELINE ROUTES --------------

// 1. Get Scheduled Sessions
app.get('/api/sessions/:userId', (req, res) => {
  const { userId } = req.params;
  db.all("SELECT id, skill_id as skillId, skill_name as skillName, partner_name as partnerName, date, time, venue FROM sessions WHERE user_id = ? ORDER BY rowid DESC", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ sessions: rows });
  });
});

// 2. Lock a Session
app.post('/api/sessions', (req, res) => {
  const { id, skillId, skillName, partnerName, date, time, venue, userId } = req.body;
  if (!id || !skillId || !skillName || !partnerName || !date || !time || !venue || !userId) {
    return res.status(400).json({ error: 'Missing session fields' });
  }

  db.run(
    `INSERT INTO sessions (id, skill_id, skill_name, partner_name, date, time, venue, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, skillId, skillName, partnerName, date, time, venue, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true });
    }
  );
});

// 3. Cancel a Session
app.delete('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM sessions WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 4. Delete a Skill Exchange Posting
app.delete('/api/skills/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM skills WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on http://localhost:${PORT}`));
