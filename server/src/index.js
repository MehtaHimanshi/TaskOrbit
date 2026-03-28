import express from 'express';
import cors from 'cors';
import { pingDb, pool } from './db.js';
import { syncToRelationalTables } from './syncToRelational.js';
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT ?? 4000);

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

/** Full kanban snapshot for the React app */
app.get('/api/state', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT payload FROM app_state WHERE id = 1');
    if (!rows.length) {
      return res.status(404).json({ error: 'no_snapshot' });
    }
    const payload = rows[0].payload;
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (!isAppStateShape(data)) {
      return res.status(500).json({ error: 'invalid_snapshot' });
    }
    if (!data.activities) data.activities = [];
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

app.put('/api/state', async (req, res) => {
  try {
    const body = req.body;
    if (!isAppStateShape(body)) {
      return res.status(400).json({ error: 'expected full AppState JSON' });
    }
    if (!body.activities) body.activities = [];
    await pool.query(
      'INSERT INTO app_state (id, payload) VALUES (1, ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)',
      [JSON.stringify(body)]
    );
    await syncToRelationalTables(pool, body);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

/** One-shot: fill boards/lists/cards from existing app_state (e.g. after upgrade) */
app.post('/api/sync/relational', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT payload FROM app_state WHERE id = 1');
    if (!rows.length) {
      return res.status(404).json({ error: 'no_snapshot' });
    }
    const payload = rows[0].payload;
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (!isAppStateShape(data)) {
      return res.status(500).json({ error: 'invalid_snapshot' });
    }
    if (!data.activities) data.activities = [];
    await syncToRelationalTables(pool, data);
    res.json({ ok: true, message: 'boards, lists, cards updated from app_state' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'taskorbit-api' });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await pingDb();
    res.json({ ok: true, mysql: 'connected' });
  } catch (e) {
    console.error(e);
    res.status(503).json({ ok: false, mysql: 'error', message: String(e.message) });
  }
});

/** Example: list boards (after you insert rows in MySQL) */
app.get('/api/boards', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, bg_type AS bgType, bg_value AS bgValue, created_at AS createdAt FROM boards ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
