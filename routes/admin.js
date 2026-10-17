import { Router } from 'express';
import {
  getAllVotes,
  getVotesPage,
  getAllUsers,
  getUsersPage,
  deleteUser,
  restoreUser,
  deleteVote,
  updateUser,
  updateVote,
  createUser,
  findUserById,
  findUserByName,
  POSITIONS,
} from '../db.js';
import { adminRequired } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/votes', adminRequired, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
  const { rows, total, totalPages } = getVotesPage(page, pageSize);
  const names = new Map(getAllUsers().map((u) => [u.id, u.name]));
  const enriched = rows.map((v) => ({
    ...v,
    voterName: names.get(v.voterId) || '未知',
    candidateName: names.get(v.candidateId) || '未知',
    positionName: POSITIONS.find((p) => p.id === v.positionId)?.name || '未知',
  }));
  res.json({
    votes: enriched,
    total,
    page: Math.min(Math.max(1, page), totalPages),
    pageSize,
    totalPages,
  });
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
  const vote = updateVote(id, { starLevel, positionId });
  if (!vote) return res.status(404).json({ error: '投票不存在' });
  res.json({ vote });
});

router.get('/users', adminRequired, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
  const { rows, total, totalPages } = getUsersPage(page, pageSize);
  res.json({
    users: rows,
    total,
    page: Math.min(Math.max(1, page), totalPages),
    pageSize,
    totalPages,
  });
});

router.delete('/users/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id);
  const user = findUserById(id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.role === 'admin') return res.status(400).json({ error: '不能删除管理员' });
  if (user.deleted) return res.status(400).json({ error: '该用户已被删除' });
  deleteUser(id);
  res.json({ success: true });
});

router.post('/users/:id/restore', adminRequired, (req, res) => {
  const id = parseInt(req.params.id);
  const user = findUserById(id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (!user.deleted) return res.status(400).json({ error: '该用户未被删除' });
  restoreUser(id);
  res.json({ success: true });
});

router.put('/users/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  const user = findUserById(id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.deleted) return res.status(400).json({ error: '请先恢复该用户' });

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
  const names = new Map(getAllUsers().map((u) => [u.id, u.name]));
  const data = {
    exportedAt: new Date().toISOString(),
    users: getAllUsers(),
    votes: votes.map((v) => ({
      voterName: names.get(v.voterId),
      candidateName: names.get(v.candidateId),
      positionName: POSITIONS.find((p) => p.id === v.positionId)?.name,
      starLevel: v.starLevel,
      createdAt: v.createdAt,
    })),
  };
  res.json(data);
});

export default router;
