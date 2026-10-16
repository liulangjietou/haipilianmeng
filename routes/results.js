import { Router } from 'express';
import { getDetailedResults, getPlayerDetail, calculateResults, POSITIONS } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, (req, res) => {
  const data = getDetailedResults();
  res.json(data);
});

router.get('/players', optionalAuth, (req, res) => {
  const { candidates } = calculateResults();
  const players = candidates.map((c) => ({ id: c.id, name: c.name }));
  res.json({ players });
});

router.get('/player/:id', optionalAuth, (req, res) => {
  const playerId = parseInt(req.params.id);
  const detail = getPlayerDetail(playerId);
  if (!detail) return res.status(404).json({ error: '球员不存在' });
  res.json(detail);
});

export default router;
