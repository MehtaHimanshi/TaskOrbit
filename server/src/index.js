import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
dotenv.config();

import { pingDb, pool } from './db.js';
import { syncToRelationalTables } from './syncToRelational.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '4mb' }));

function isAppStateShape(body) {
  return (
    body &&
    typeof body === 'object' &&
    Array.isArray(body.boards) &&
    Array.isArray(body.lists) &&
    Array.isArray(body.cards) &&
    Array.isArray(body.labels) &&
    Array.isArray(body.users)
  );
}

/** ✅ FIXED: Full kanban snapshot */
app.get('/api/state', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT payload FROM app_state WHERE id = 1');

    if (!rows.length) {
      return res.json({
        boards: [],
        lists: [],
        cards: [],
        labels: [],
        users: [],
        activities: []
      });
    }

    let data = rows[0].payload;

    // simple safe parse
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    // fallback safety
    if (!data) {
      data = {
        boards: [],
        lists: [],
        cards: [],
        labels: [],
        users: [],
        activities: []
      };
    }

    res.json(data);

  } catch (e) {
    console.error("STATE ERROR:", e);

    // ALWAYS return safe data (no crash)
    res.json({
      boards: [],
      lists: [],
      cards: [],
      labels: [],
      users: [],
      activities: []
    });
  }
});
/** Save full state */
app.put('/api/state', async (req, res) => {
  try {
    const body = req.body;

    if (!isAppStateShape(body)) {
      return res.status(400).json({ error: 'expected full AppState JSON' });
    }

    if (!body.activities) body.activities = [];

    await pool.query(
  'INSERT INTO app_state (id, payload) VALUES (1, ?) ON DUPLICATE KEY UPDATE payload = ?',
  [JSON.stringify(body), JSON.stringify(body)]
);

    await syncToRelationalTables(pool, body);

    res.json({ ok: true });

  } catch (e) {
    console.error('PUT STATE ERROR:', e);
    res.status(500).json({ error: e.message || 'unknown_error' });
  }
});

/** Sync relational tables */
app.post('/api/sync/relational', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT payload FROM app_state WHERE id = 1');

    if (!rows.length) {
      return res.status(404).json({ error: 'no_snapshot' });
    }

    let data = rows[0].payload;

    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    if (!isAppStateShape(data)) {
      return res.status(500).json({ error: 'invalid_snapshot' });
    }

    if (!data.activities) data.activities = [];

    await syncToRelationalTables(pool, data);

    res.json({ ok: true, message: 'boards, lists, cards updated from app_state' });

  } catch (e) {
    console.error('SYNC ERROR:', e);
    res.status(500).json({ error: e.message || 'unknown_error' });
  }
});

/** Health */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'taskorbit-api' });
});

/** DB health */
app.get('/api/health/db', async (_req, res) => {
  try {
    await pingDb();
    res.json({ ok: true, mysql: 'connected' });
  } catch (e) {
    console.error('DB ERROR:', e);
    res.status(503).json({ ok: false, mysql: 'error', message: String(e.message) });
  }
});

/** Boards list */
app.get('/api/boards', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, bg_type AS bgType, bg_value AS bgValue, created_at AS createdAt FROM boards ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    console.error('BOARDS ERROR:', e);
    res.status(500).json({ error: e.message || 'unknown_error' });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});