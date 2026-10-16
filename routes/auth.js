import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByName, findUserById, createUser, changeUserName, MAX_NAME_CHANGES } from '../db.js';
import { JWT_SECRET, authRequired } from '../middleware/auth.js';

const router = Router();

const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z]{1,20}$/;
const PASS_REGEX = /^[^\s]{1,8}$/;

function buildUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    nickname: user.nickname || '',
    role: user.role,
    nameChangesLeft: Math.max(0, MAX_NAME_CHANGES - (user.nameChangeCount || 0)),
  };
}

router.post('/register', async (req, res) => {
  const { name, password, nickname } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: '请输入名字和密码' });
  }
  if (!NAME_REGEX.test(name)) {
    return res.status(400).json({ error: '名字只能包含汉字和大小写字母，长度1-20个字符' });
  }
  if (!PASS_REGEX.test(password)) {
    return res.status(400).json({ error: '密码长度1-8位，不能包含空格' });
  }

  const existing = findUserByName(name);
  if (existing) {
    return res.status(400).json({ error: '该名字已被使用' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = createUser(name, hash, 'user', nickname || '');

  const token = jwt.sign(
    { id: user.id, name: user.name, nickname: user.nickname, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: buildUserResponse(user),
  });
});

router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: '请输入名字和密码' });
  }

  const user = findUserByName(name);
  if (!user) {
    return res.status(400).json({ error: '用户不存在' });
  }
  if (!user.active) {
    return res.status(403).json({ error: '账号已被禁用' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: '密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, nickname: user.nickname, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: buildUserResponse(user),
  });
});

router.get('/me', authRequired, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user: buildUserResponse(user) });
});

router.put('/name', authRequired, (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: '请输入新名字' });
  }
  if (!NAME_REGEX.test(name)) {
    return res.status(400).json({ error: '名字只能包含汉字和大小写字母，长度1-20个字符' });
  }

  const result = changeUserName(req.user.id, name);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  const user = result.user;
  const token = jwt.sign(
    { id: user.id, name: user.name, nickname: user.nickname, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: buildUserResponse(user) });
});

export default router;
