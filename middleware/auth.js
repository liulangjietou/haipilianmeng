import jwt from 'jsonwebtoken';
import { findUserById } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'basketball-vote-secret-2026';

function currentUser(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: '请先登录' });
    return null;
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' });
    return null;
  }
  const user = findUserById(payload.id);
  if (!user) {
    res.status(401).json({ error: '用户不存在' });
    return null;
  }
  if (user.deleted) {
    res.status(403).json({ error: '账号已被删除，请联系管理员恢复' });
    return null;
  }
  if (!user.active) {
    res.status(403).json({ error: '账号已被禁用' });
    return null;
  }
  return user;
}

function authRequired(req, res, next) {
  const user = currentUser(req, res);
  if (!user) return;
  req.user = { id: user.id, name: user.name, nickname: user.nickname, role: user.role };
  next();
}

function adminRequired(req, res, next) {
  const user = currentUser(req, res);
  if (!user) return;
  if (user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
  req.user = { id: user.id, name: user.name, nickname: user.nickname, role: user.role };
  next();
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {}
  }
  next();
}

export { JWT_SECRET, authRequired, adminRequired, optionalAuth };
