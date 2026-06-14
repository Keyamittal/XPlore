import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

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

  db.run(`ALTER TABLE users ADD COLUMN last_active_date TEXT DEFAULT NULL`, (err) => {
    // Safe fallback if column already exists
  });
  db.run(`ALTER TABLE users ADD COLUMN quests_completed_today INTEGER DEFAULT 0`, (err) => {
    // Safe fallback if column already exists
  });



  // Update join_date for existing users to 2026 if they were seeded with 2023
  db.run(`UPDATE users SET join_date = 'Jan 2026' WHERE join_date = 'Nov 2023'`);

  // Insert Mock User
  const insertMockUser = db.prepare(`INSERT OR IGNORE INTO users (id, username, password, full_name, initials, total_xp, level, streak, title, join_date, last_active_date, quests_completed_today) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const hashedAryanPassword = hashPassword('hackathon2026');
  insertMockUser.run('u1', 'AryanK', hashedAryanPassword, 'Aryan K', 'AK', 3450, 35, 12, 'NEON MASTER', 'Jan 2026', '2026-06-13', 0);
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

const JWT_SECRET = 'cozy-xplore-secret-key-2026';

function base64url(buf) {
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const part1 = base64url(Buffer.from(JSON.stringify(header)));
  const part2 = base64url(Buffer.from(JSON.stringify(payload)));
  const data = part1 + '.' + part2;
  const signature = base64url(
    crypto.createHmac('sha256', JWT_SECRET).update(data).digest()
  );
  return data + '.' + signature;
}

function verifyJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [part1, part2, signature] = parts;
    const data = part1 + '.' + part2;
    const expectedSignature = base64url(
      crypto.createHmac('sha256', JWT_SECRET).update(data).digest()
    );
    if (signature !== expectedSignature) return null;
    return JSON.parse(Buffer.from(part2, 'base64').toString());
  } catch (e) {
    return null;
  }
}

function hashPassword(password) {
  const salt = 'xplore-salt-2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function verifyPassword(password, storedPassword) {
  const hashed = hashPassword(password);
  if (hashed === storedPassword) return true;
  if (password === storedPassword) return true; // plain text fallback for pre-existing users
  return false;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  const decoded = verifyJwt(token);
  if (!decoded) return res.status(403).json({ error: 'Invalid or expired token' });

  req.user = decoded;
  next();
}

function checkAndUpdateStreak(userRow, callback) {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const lastActive = userRow.last_active_date;
  const completedToday = userRow.quests_completed_today;
  const currentStreak = userRow.streak || 1;
  const userId = userRow.id;

  if (!lastActive) {
    // Previous user logging in for the first time since the feature was deployed.
    // They missed their streak because they hadn't logged in recently!
    const oldStreak = currentStreak;
    const currentXP = userRow.total_xp || 0;
    const newTotalXP = Math.max(0, currentXP - 100);
    const newLevel = Math.floor(newTotalXP / 100) + 1;
    let newTitle = userRow.title || 'NOVICE';
    if (newLevel >= 10) newTitle = 'CYBER KNIGHT';
    if (newLevel >= 20) newTitle = 'NEON MASTER';

    db.run(
      `UPDATE users SET streak = 1, total_xp = ?, level = ?, title = ?, last_active_date = ?, quests_completed_today = 0 WHERE id = ?`,
      [newTotalXP, newLevel, newTitle, todayStr, userId],
      (err) => {
        if (err) console.error("Error resetting streak for previous user:", err.message);
        callback({
          ...userRow,
          streak: 1,
          total_xp: newTotalXP,
          level: newLevel,
          title: newTitle,
          last_active_date: todayStr,
          quests_completed_today: 0
        }, true, oldStreak);
      }
    );
    return;
  }

  if (lastActive === todayStr) {
    // Same day login/sync, nothing to do.
    callback(userRow, false, 0);
    return;
  }

  // Get yesterday's date string
  const yesterday = new Date(d);
  yesterday.setDate(d.getDate() - 1);
  const yYear = yesterday.getFullYear();
  const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

  if (lastActive === yesterdayStr) {
    if (completedToday === 1) {
      // User completed quests yesterday, streak is incremented!
      const newStreak = currentStreak + 1;
      db.run(
        `UPDATE users SET streak = ?, last_active_date = ?, quests_completed_today = 0 WHERE id = ?`,
        [newStreak, todayStr, userId],
        (err) => {
          if (err) console.error("Error updating last_active_date and streak:", err.message);
          callback({ ...userRow, streak: newStreak, last_active_date: todayStr, quests_completed_today: 0 }, false, 0);
        }
      );
    } else {
      // User was active yesterday but did NOT complete quests. Streak missed!
      const oldStreak = currentStreak;
      const currentXP = userRow.total_xp || 0;
      const newTotalXP = Math.max(0, currentXP - 100);
      const newLevel = Math.floor(newTotalXP / 100) + 1;
      let newTitle = userRow.title || 'NOVICE';
      if (newLevel >= 10) newTitle = 'CYBER KNIGHT';
      if (newLevel >= 20) newTitle = 'NEON MASTER';

      db.run(
        `UPDATE users SET streak = 1, total_xp = ?, level = ?, title = ?, last_active_date = ?, quests_completed_today = 0 WHERE id = ?`,
        [newTotalXP, newLevel, newTitle, todayStr, userId],
        (err) => {
          if (err) console.error("Error resetting streak:", err.message);
          callback({
            ...userRow,
            streak: 1,
            total_xp: newTotalXP,
            level: newLevel,
            title: newTitle,
            last_active_date: todayStr,
            quests_completed_today: 0
          }, true, oldStreak);
        }
      );
    }
  } else {
    // lastActive was older than yesterday. User missed yesterday entirely. Streak missed!
    const oldStreak = currentStreak;
    const currentXP = userRow.total_xp || 0;
    const newTotalXP = Math.max(0, currentXP - 100);
    const newLevel = Math.floor(newTotalXP / 100) + 1;
    let newTitle = userRow.title || 'NOVICE';
    if (newLevel >= 10) newTitle = 'CYBER KNIGHT';
    if (newLevel >= 20) newTitle = 'NEON MASTER';

    db.run(
      `UPDATE users SET streak = 1, total_xp = ?, level = ?, title = ?, last_active_date = ?, quests_completed_today = 0 WHERE id = ?`,
      [newTotalXP, newLevel, newTitle, todayStr, userId],
      (err) => {
        if (err) console.error("Error resetting streak:", err.message);
        callback({
          ...userRow,
          streak: 1,
          total_xp: newTotalXP,
          level: newLevel,
          title: newTitle,
          last_active_date: todayStr,
          quests_completed_today: 0
        }, true, oldStreak);
      }
    );
  }
}

// -------------- ROUTES --------------

// 1. Auth/Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  db.get(`SELECT id, username, password, full_name as fullName, initials, total_xp, level, streak, title, join_date as joinDate, last_active_date, quests_completed_today FROM users WHERE username = ? COLLATE NOCASE`, [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid username or password' });
    
    // Verify password
    if (!verifyPassword(password, row.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Auto upgrade password to hash if it was plaintext
    if (row.password === password) {
      const hashed = hashPassword(password);
      db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashed, row.id]);
    }

    checkAndUpdateStreak(row, (updatedUserRow, streakMissed, oldStreak) => {
      // Convert to frontend friendly structure
      const totalXp = updatedUserRow.total_xp || 0;
      const xpProgress = totalXp % 100;
      const computedLevel = Math.floor(totalXp / 100) + 1;
      const user = {
        id: updatedUserRow.id,
        username: updatedUserRow.username,
        fullName: updatedUserRow.fullName,
        initials: updatedUserRow.initials,
        level: computedLevel,
        xp: xpProgress,
        totalXP: totalXp,
        xpToNext: 100,
        streak: updatedUserRow.streak || 1,
        title: updatedUserRow.title || 'NOVICE',
        joinDate: updatedUserRow.joinDate
      };
      
      const token = signJwt({ userId: user.id, username: user.username });
      res.json({ user, token, streakMissed, oldStreak });
    });
  });
});

// 1.2 Auth/Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Missing fields. Username, password, and full name are required.' });
  }

  // Check for duplicate username
  db.get(`SELECT id FROM users WHERE username = ? COLLATE NOCASE`, [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(409).json({ error: 'Username already taken' });

    // Generate fields
    const id = `u_${Date.now()}`;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    const joinDate = `${months[d.getMonth()]} ${d.getFullYear()}`;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

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

    const hashedPassword = hashPassword(password);

    // Insert user
    db.run(
      `INSERT INTO users (id, username, password, full_name, initials, total_xp, level, streak, title, join_date, last_active_date, quests_completed_today) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, username, hashedPassword, fullName, initials, 0, 1, 1, 'NOVICE', joinDate, todayStr, 0],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const user = {
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
        };
        const token = signJwt({ userId: id, username });
        res.status(201).json({
          user,
          token
        });
      }
    );
  });
});


// 1.5 Auto-Sync Profile
app.post('/api/user/sync', authenticateToken, (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
  }

  db.get(`SELECT id, username, full_name as fullName, initials, total_xp, level, streak, title, join_date as joinDate, last_active_date, quests_completed_today FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    
    // Defensive parsing & healing of NaN values in database
    let totalXp = parseInt(row.total_xp);
    if (isNaN(totalXp) || totalXp === null) {
      totalXp = 0;
      db.run(`UPDATE users SET total_xp = 0, level = 1 WHERE id = ?`, [userId]);
    }
    
    checkAndUpdateStreak(row, (updatedUserRow, streakMissed, oldStreak) => {
      const updatedTotalXp = updatedUserRow.total_xp || 0;
      const xpProgress = updatedTotalXp % 100;
      const computedLevel = Math.floor(updatedTotalXp / 100) + 1;
      const user = {
        id: updatedUserRow.id,
        username: updatedUserRow.username,
        fullName: updatedUserRow.fullName,
        initials: updatedUserRow.initials,
        level: computedLevel,
        xp: xpProgress,
        totalXP: updatedTotalXp,
        xpToNext: 100,
        streak: updatedUserRow.streak || 1,
        title: updatedUserRow.title || 'NOVICE',
        joinDate: updatedUserRow.joinDate
      };
      res.json({ user, streakMissed, oldStreak });
    });
  });
});

// 2. Add XP (Level Up Logic)
app.post('/api/user/add-xp', authenticateToken, (req, res) => {
  const { userId, amount } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
  }
  
  const xpAmount = parseInt(amount) || 0;
  
  db.get(`SELECT total_xp, level, title FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'User not found' });
    
    let currentTotalXp = parseInt(row.total_xp);
    if (isNaN(currentTotalXp)) {
      currentTotalXp = 0;
    }
    
    let newTotalXp = currentTotalXp + xpAmount;
    if (newTotalXp < 0) newTotalXp = 0;
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

// 2.5 Update Streak
app.post('/api/user/update-streak', authenticateToken, (req, res) => {
  const { userId, streak } = req.body;
  if (!userId || streak === undefined) return res.status(400).json({ error: 'Missing userId or streak' });

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
  }

  const streakVal = parseInt(streak) || 1;
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  db.run(`UPDATE users SET streak = ?, last_active_date = ?, quests_completed_today = 0 WHERE id = ?`, [streakVal, todayStr, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, streak: streakVal });
  });
});

// 2.6 Complete Quests for Today
app.post('/api/user/complete-quests', authenticateToken, (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
  }

  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  db.run(
    `UPDATE users SET quests_completed_today = 1, last_active_date = ? WHERE id = ?`,
    [todayStr, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// 3. Get Leaderboard (All Registered Users)
app.get('/api/users/leaderboard', authenticateToken, (req, res) => {
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
app.get('/api/skills', authenticateToken, (req, res) => {
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
app.post('/api/skills', authenticateToken, (req, res) => {
  const { id, type, skill, description, tags, postedBy, initials, duration, bonusXp, email, phone, userId } = req.body;
  if (!id || !type || !skill || !description || !postedBy || !initials || !userId) {
    return res.status(400).json({ error: 'Missing required skill fields' });
  }

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
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
app.post('/api/skills/accept', authenticateToken, (req, res) => {
  const { id, userId, email, phone } = req.body;
  if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId' });

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
  }

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
app.get('/api/sessions/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
  }

  db.all("SELECT id, skill_id as skillId, skill_name as skillName, partner_name as partnerName, date, time, venue FROM sessions WHERE user_id = ? ORDER BY rowid DESC", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ sessions: rows });
  });
});

// 2. Lock a Session
app.post('/api/sessions', authenticateToken, (req, res) => {
  const { id, skillId, skillName, partnerName, date, time, venue, userId } = req.body;
  if (!id || !skillId || !skillName || !partnerName || !date || !time || !venue || !userId) {
    return res.status(400).json({ error: 'Missing session fields' });
  }

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
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
app.delete('/api/sessions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get("SELECT user_id FROM sessions WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Session not found' });
    if (row.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this session' });
    }

    db.run("DELETE FROM sessions WHERE id = ?", [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// 4. Delete a Skill Exchange Posting
app.delete('/api/skills/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get("SELECT user_id FROM skills WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Skill posting not found' });
    if (row.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this skill posting' });
    }

    db.run("DELETE FROM skills WHERE id = ?", [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on http://localhost:${PORT}`));
