import { Router } from 'express';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/requireAuth.js';

const VALID_RESULTS = new Set(['win', 'loss', 'tie']);

interface SummaryRow {
  bestScore: number | null;
  gamesPlayed: number;
}

function getSummary(userId: number): SummaryRow {
  return db
    .prepare(
      'SELECT MAX(score) AS bestScore, COUNT(*) AS gamesPlayed FROM game_results WHERE user_id = ?'
    )
    .get(userId) as SummaryRow;
}

export const meRouter = Router();

meRouter.get('/', requireAuth, (req, res) => {
  const summary = getSummary(req.userId!);
  res.json({
    user: { id: req.userId, username: req.username },
    bestScore: summary.bestScore,
    gamesPlayed: summary.gamesPlayed,
  });
});

export const scoresRouter = Router();
scoresRouter.use(requireAuth);

scoresRouter.post('/', (req, res) => {
  const { score, result, treasureFound, boxesOpened } = req.body ?? {};

  if (
    typeof score !== 'number' ||
    !Number.isFinite(score) ||
    typeof result !== 'string' ||
    !VALID_RESULTS.has(result) ||
    typeof treasureFound !== 'boolean' ||
    typeof boxesOpened !== 'number' ||
    boxesOpened < 1 ||
    boxesOpened > 3
  ) {
    res.status(400).json({ error: 'Invalid game result payload' });
    return;
  }

  db.prepare(
    'INSERT INTO game_results (user_id, score, result, treasure_found, boxes_opened) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, score, result, treasureFound ? 1 : 0, boxesOpened);

  const summary = getSummary(req.userId!);
  res.status(201).json({ bestScore: summary.bestScore, gamesPlayed: summary.gamesPlayed });
});

scoresRouter.get('/me', (req, res) => {
  const results = db
    .prepare(
      'SELECT score, result, treasure_found AS treasureFound, boxes_opened AS boxesOpened, created_at AS createdAt FROM game_results WHERE user_id = ? ORDER BY created_at DESC'
    )
    .all(req.userId);
  res.json({ results });
});
