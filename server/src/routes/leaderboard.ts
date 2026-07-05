import { Router } from 'express';
import { db } from '../db/client.js';

export const leaderboardRouter = Router();

leaderboardRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT u.username AS username, MAX(g.score) AS bestScore
       FROM game_results g
       JOIN users u ON u.id = g.user_id
       GROUP BY g.user_id
       ORDER BY bestScore DESC
       LIMIT 10`
    )
    .all();
  res.json({ leaderboard: rows });
});
