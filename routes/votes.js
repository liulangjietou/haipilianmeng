import { Router } from 'express';
import {
  upsertVote,
  deleteVote,
  getVotesByVoter,
  getAllVotes,
  findUserById,
  POSITIONS,
  STAR_LEVELS,
} from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/', authRequired, (req, res) => {
  const { candidateId, positionId, starLevel } = req.body;
  const voterId = req.user.id;

  if (!candidateId || !positionId || !starLevel) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (!POSITIONS.find((p) => p.id === positionId)) {
    return res.status(400).json({ error: '无效的位置' });
  }
  if (!STAR_LEVELS.includes(starLevel)) {
    return res.status(400).json({ error: '无效的星级' });
  }

  const candidate = findUserById(candidateId);
  if (!candidate || !candidate.active || candidate.role === 'admin') {
    return res.status(400).json({ error: '无效的被投票人' });
  }

  if (voterId === candidateId) {
    return res.status(400).json({ error: '不能给自己投票' });
  }

  const vote = upsertVote(voterId, candidateId, positionId, starLevel);
  res.json({ vote });
});

router.post('/batch', authRequired, (req, res) => {
  const { votes } = req.body;
  const voterId = req.user.id;

  if (!Array.isArray(votes) || votes.length === 0) {
    return res.status(400).json({ error: '请提供投票数据' });
  }

  const results = [];
  for (const v of votes) {
    if (!POSITIONS.find((p) => p.id === v.positionId)) continue;
    if (!STAR_LEVELS.includes(v.starLevel)) continue;
    const candidate = findUserById(v.candidateId);
    if (!candidate || !candidate.active || candidate.role === 'admin') continue;
    if (voterId === v.candidateId) continue;
    const vote = upsertVote(voterId, v.candidateId, v.positionId, v.starLevel);
    results.push(vote);
  }

  res.json({ votes: results });
});

router.get('/my', authRequired, (req, res) => {
  const votes = getVotesByVoter(req.user.id);
  const enriched = votes.map((v) => {
    const candidate = findUserById(v.candidateId);
    const position = POSITIONS.find((p) => p.id === v.positionId);
    return {
      ...v,
      candidateName: candidate?.name || '未知',
      positionName: position?.name || '未知',
    };
  });
  res.json({ votes: enriched });
});

router.delete('/:id', authRequired, (req, res) => {
  const voteId = parseInt(req.params.id);
  const allVotes = getAllVotes();
  const vote = allVotes.find((v) => v.id === voteId);

  if (!vote) return res.status(404).json({ error: '投票不存在' });
  if (vote.voterId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权删除此投票' });
  }

  deleteVote(voteId);
  res.json({ success: true });
});

export default router;
