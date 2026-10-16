import { Router } from 'express';
import {
  getAllVotes,
  getAllUsers,
  deleteUser,
  updateUser,
  createUser,
  findUserById,
  findUserByName,
  POSITIONS,
  STAR_LEVELS,
} from '../db.js';
import { adminRequired } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/votes', adminRequired, (req, res) => {
  const votes = getAllVotes();
  const enriched = votes.map((v) => {
    const voter = findUserById(v.voterId);
    const candidate = findUserById(v.candidateId);
    const position = POSITIONS.find((p) => p.id === v.positionId);
    return {
      ...v,
      voterName: voter?.name || '未知',
      candidateName: candidate?.name || '未知',
      positionName: position?.name || '未知',
    };
  });
  res.json({ votes: enriched });
});

router.delete('/votes/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id);
  const ok = deleteVote(id);
  if (!ok) return res.status(404).json({ error: '投票不存在' });
  res.json({ success: true });
});

router.put('/votes/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id);
  const { starLevel, positionId } = req.body;
  const votes = getAllVotes();
  const vote = votes.find((v) => v.id === id);
  if (!vote) return res.status(404).json({ error: '投票不存在' });
  if (starLevel && STAR_LEVELS.includes(starLevel)) vote.starLevel = starLevel;
  if (positionId && POSITIONS.find((p) => p.id === positionId)) vote.positionId = positionId;
  vote.updatedAt = new Date().toISOString();
  res.json({ vote });
});

router.get('/users', adminRequired, (req, res) => {
  const users = getAllUsers();
  res.json({ users });
});

router.delete('/users/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id);
  const user = findUserById(id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.role === 'admin') return res.status(400).json({ error: '不能删除管理员' });
  deleteUser(id);
  res.json({ success: true });
});

router.put('/users/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  const user = findUserById(id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const updates = {};
  if (req.body.active !== undefined) updates.active = req.body.active;
  if (req.body.role !== undefined) updates.role = req.body.role;
  if (req.body.password) {
    updates.password = await bcrypt.hash(req.body.password, 10);
  }

  const updated = updateUser(id, updates);
  const { password, ...safe } = updated;
  res.json({ user: safe });
});

router.post('/create-admin', adminRequired, async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const existing = findUserByName(name);
  if (existing) {
    return res.status(400).json({ error: '该用户名已存在' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = createUser(name, hash, 'admin');

  res.json({
    success: true,
    user: { id: user.id, name: user.name, role: user.role },
  });
});

router.get('/export', adminRequired, (req, res) => {
  const votes = getAllVotes();
  const users = getAllUsers();
  const data = {
    exportedAt: new Date().toISOString(),
    users,
    votes: votes.map((v) => {
      const voter = findUserById(v.voterId);
      const candidate = findUserById(v.candidateId);
      const position = POSITIONS.find((p) => p.id === v.positionId);
      return {
        voterName: voter?.name,
        candidateName: candidate?.name,
        positionName: position?.name,
        starLevel: v.starLevel,
        createdAt: v.createdAt,
      };
    }),
  };
  res.json(data);
});

export default router;
