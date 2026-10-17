import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { pinyin } from 'pinyin-pro';

const POSITIONS = [
  { id: 1, number: 1, name: '控球后卫' },
  { id: 2, number: 2, name: '得分后卫' },
  { id: 3, number: 3, name: '小前锋' },
  { id: 4, number: 4, name: '大前锋' },
  { id: 5, number: 5, name: '中锋' },
];

const STAR_LEVELS = [1, 2, 3, 4, 5];

const MAX_NAME_CHANGES = 2;

const DB_FILE = process.env.DB_FILE || path.join(os.homedir(), '.basketball-vote.sqlite');
const LEGACY_SNAPSHOT = path.join(os.homedir(), '.basketball-vote-db.json');

const sqlite = new Database(DB_FILE);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    nameChangeCount INTEGER NOT NULL DEFAULT 0,
    deletedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voterId INTEGER NOT NULL,
    candidateId INTEGER NOT NULL,
    positionId INTEGER NOT NULL,
    starLevel INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

const userColumns = sqlite.prepare('PRAGMA table_info(users)').all();
if (!userColumns.some((c) => c.name === 'nameChangeCount')) {
  sqlite.exec('ALTER TABLE users ADD COLUMN nameChangeCount INTEGER NOT NULL DEFAULT 0');
}
if (!userColumns.some((c) => c.name === 'deletedAt')) {
  sqlite.exec('ALTER TABLE users ADD COLUMN deletedAt TEXT');
}

const stmts = {
  countUsers: sqlite.prepare('SELECT COUNT(*) AS n FROM users'),
  findUserByName: sqlite.prepare('SELECT * FROM users WHERE name = ?'),
  findUserById: sqlite.prepare('SELECT * FROM users WHERE id = ?'),
  insertUser: sqlite.prepare(
    'INSERT INTO users (id, name, nickname, password, role, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
  ),
  allUsers: sqlite.prepare('SELECT * FROM users'),
  softDeleteUser: sqlite.prepare('UPDATE users SET deletedAt = ? WHERE id = ?'),
  restoreUser: sqlite.prepare('UPDATE users SET deletedAt = NULL WHERE id = ?'),
  deletedUserIds: sqlite.prepare('SELECT id FROM users WHERE deletedAt IS NOT NULL'),
  findVote: sqlite.prepare(
    'SELECT * FROM votes WHERE voterId = ? AND candidateId = ? AND positionId = ?'
  ),
  findVoteById: sqlite.prepare('SELECT * FROM votes WHERE id = ?'),
  updateVote: sqlite.prepare('UPDATE votes SET starLevel = ?, updatedAt = ? WHERE id = ? RETURNING *'),
  insertVote: sqlite.prepare(
    'INSERT INTO votes (voterId, candidateId, positionId, starLevel, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
  ),
  deleteVote: sqlite.prepare('DELETE FROM votes WHERE id = ?'),
  votesByVoter: sqlite.prepare('SELECT * FROM votes WHERE voterId = ?'),
  allVotes: sqlite.prepare('SELECT * FROM votes'),
  countVotes: sqlite.prepare('SELECT COUNT(*) AS n FROM votes'),
  votesPage: sqlite.prepare('SELECT * FROM votes ORDER BY id DESC LIMIT ? OFFSET ?'),
  usersPage: sqlite.prepare(
    'SELECT * FROM users ORDER BY (deletedAt IS NOT NULL), id ASC LIMIT ? OFFSET ?'
  ),
  votesForCandidate: sqlite.prepare('SELECT * FROM votes WHERE candidateId = ?'),
  candidates: sqlite.prepare(
    "SELECT * FROM users WHERE active = 1 AND deletedAt IS NULL"
  ),
};

function mapUser(row) {
  if (!row) return row;
  return { ...row, active: row.active === 1, deleted: row.deletedAt != null };
}

function migrateLegacySnapshot() {
  if (!fs.existsSync(LEGACY_SNAPSHOT) || stmts.countUsers.get().n > 0) return;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(LEGACY_SNAPSHOT, 'utf8'));
  } catch {
    return;
  }
  const importAll = sqlite.transaction(() => {
    for (const u of data.users || []) {
      stmts.insertUser.run(
        u.id,
        u.name,
        u.nickname || '',
        u.password,
        u.role || 'user',
        u.active ? 1 : 0,
        u.createdAt
      );
    }
    for (const v of data.votes || []) {
      sqlite
        .prepare(
          'INSERT INTO votes (id, voterId, candidateId, positionId, starLevel, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .run(v.id, v.voterId, v.candidateId, v.positionId, v.starLevel, v.createdAt, v.updatedAt);
    }
  });
  importAll();
  fs.renameSync(LEGACY_SNAPSHOT, `${LEGACY_SNAPSHOT}.migrated`);
}

migrateLegacySnapshot();

function getSortKey(name) {
  if (/^[a-zA-Z]/.test(name)) {
    return name.toLowerCase();
  }
  const py = pinyin(name, { pattern: 'first', toneType: 'none', type: 'array' });
  return py.join('').toLowerCase();
}

async function seed() {
  if (stmts.countUsers.get().n === 0) {
    const hash = await bcrypt.hash('huangtian666', 10);
    stmts.insertUser.run(null, 'huangtian', '', hash, 'admin', 1, new Date().toISOString());
  }
}

function findUserByName(name) {
  return mapUser(stmts.findUserByName.get(name));
}

function findUserById(id) {
  return mapUser(stmts.findUserById.get(id));
}

function createUser(name, passwordHash, role = 'user', nickname = '') {
  const row = stmts.insertUser.get(
    null,
    name,
    nickname,
    passwordHash,
    role,
    1,
    new Date().toISOString()
  );
  return mapUser(row);
}

function getAllUsers() {
  return stmts.allUsers.all().map((row) => {
    const { password, ...u } = mapUser(row);
    return u;
  });
}

function getUsersPage(page = 1, pageSize = 20) {
  const total = stmts.countUsers.get().n;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const rows = stmts.usersPage.all(pageSize, (current - 1) * pageSize).map((row) => {
    const { password, ...u } = mapUser(row);
    return u;
  });
  return { rows, total, page: current, pageSize, totalPages };
}

function deleteUser(id) {
  return stmts.softDeleteUser.run(new Date().toISOString(), id).changes > 0;
}

function restoreUser(id) {
  return stmts.restoreUser.run(id).changes > 0;
}

const UPDATABLE_FIELDS = ['name', 'nickname', 'password', 'role', 'active'];

function updateUser(id, updates) {
  const fields = UPDATABLE_FIELDS.filter((f) => updates[f] !== undefined);
  if (fields.length === 0) return findUserById(id);
  const sets = fields.map((f) => `${f} = @${f}`).join(', ');
  const values = { id };
  for (const f of fields) {
    values[f] = f === 'active' ? (updates[f] ? 1 : 0) : updates[f];
  }
  sqlite.prepare(`UPDATE users SET ${sets} WHERE id = @id`).run(values);
  return findUserById(id);
}

function changeUserName(id, newName) {
  const user = findUserById(id);
  if (!user) return { error: '用户不存在' };
  if (user.deleted) return { error: '账号已被删除' };
  if (newName === user.name) return { error: '新名字与当前名字相同' };
  if (user.nameChangeCount >= MAX_NAME_CHANGES) return { error: '更改次数已用完' };
  if (findUserByName(newName)) return { error: '该名字已被使用' };
  sqlite
    .prepare('UPDATE users SET name = ?, nameChangeCount = nameChangeCount + 1 WHERE id = ?')
    .run(newName, id);
  return { user: findUserById(id) };
}

function upsertVote(voterId, candidateId, positionId, starLevel) {
  const now = new Date().toISOString();
  const existing = stmts.findVote.get(voterId, candidateId, positionId);
  if (existing) {
    return stmts.updateVote.get(starLevel, now, existing.id);
  }
  return stmts.insertVote.get(voterId, candidateId, positionId, starLevel, now, now);
}

function updateVote(id, fields = {}) {
  const vote = stmts.findVoteById.get(id);
  if (!vote) return null;
  const starLevel = STAR_LEVELS.includes(fields.starLevel) ? fields.starLevel : vote.starLevel;
  const positionId = POSITIONS.some((p) => p.id === fields.positionId)
    ? fields.positionId
    : vote.positionId;
  sqlite
    .prepare('UPDATE votes SET starLevel = ?, positionId = ?, updatedAt = ? WHERE id = ?')
    .run(starLevel, positionId, new Date().toISOString(), id);
  return stmts.findVoteById.get(id);
}

function deleteVote(id) {
  return stmts.deleteVote.run(id).changes > 0;
}

function getVotesByVoter(voterId) {
  return stmts.votesByVoter.all(voterId);
}

function getAllVotes() {
  return stmts.allVotes.all();
}

function getVotesPage(page = 1, pageSize = 20) {
  const total = stmts.countVotes.get().n;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const rows = stmts.votesPage.all(pageSize, (current - 1) * pageSize);
  return { rows, total, page: current, pageSize, totalPages };
}

function getVotesForCandidate(candidateId) {
  return stmts.votesForCandidate.all(candidateId);
}

function calculateResults() {
  const candidates = stmts.candidates.all().map(mapUser);
  const deletedIds = new Set(stmts.deletedUserIds.all().map((row) => row.id));
  const allVotes = stmts.allVotes.all().filter((v) => !deletedIds.has(v.voterId));
  const results = {};

  for (const candidate of candidates) {
    results[candidate.id] = {};
    for (const pos of POSITIONS) {
      const votes = allVotes.filter(
        (v) => v.candidateId === candidate.id && v.positionId === pos.id
      );
      const starCounts = {};
      for (const star of STAR_LEVELS) {
        starCounts[star] = votes.filter((v) => v.starLevel === star).length;
      }
      const totalVotes = votes.length;

      let finalStar = null;
      let maxCount = 0;
      for (let star = 5; star >= 1; star--) {
        if (starCounts[star] > maxCount) {
          maxCount = starCounts[star];
          finalStar = star;
        }
      }

      results[candidate.id][pos.id] = {
        starCounts,
        totalVotes,
        finalStar,
      };
    }
  }

  return { candidates, results };
}

function getDetailedResults() {
  const { candidates, results } = calculateResults();
  const rankings = {};

  for (const pos of POSITIONS) {
    const playerRankings = [];
    for (const candidate of candidates) {
      const data = results[candidate.id]?.[pos.id];
      if (data && data.finalStar !== null) {
        playerRankings.push({
          candidate: { id: candidate.id, name: candidate.name, nickname: candidate.nickname },
          finalStar: data.finalStar,
          starCounts: data.starCounts,
          totalVotes: data.totalVotes,
          sortKey: getSortKey(candidate.name),
        });
      }
    }
    playerRankings.sort((a, b) => {
      for (const star of [...STAR_LEVELS].reverse()) {
        const av = a.starCounts[star] || 0;
        const bv = b.starCounts[star] || 0;
        if (bv !== av) return bv - av;
      }
      return a.sortKey.localeCompare(b.sortKey);
    });
    rankings[pos.id] = playerRankings.map((p, i) => ({ rank: i + 1, ...p }));
  }
  return { positions: POSITIONS, rankings };
}

function getPlayerDetail(playerId) {
  const player = findUserById(playerId);
  if (!player || player.deleted) return null;

  const detail = { player: { id: player.id, name: player.name }, positions: {} };

  for (const pos of POSITIONS) {
    const votes = stmts.votesForCandidate.all(playerId).filter((v) => v.positionId === pos.id);
    const starCounts = {};
    for (const star of STAR_LEVELS) {
      starCounts[star] = votes.filter((v) => v.starLevel === star).length;
    }
    const totalVotes = votes.length;

    let finalStar = null;
    let maxCount = 0;
    for (let star = 5; star >= 1; star--) {
      if (starCounts[star] > maxCount) {
        maxCount = starCounts[star];
        finalStar = star;
      }
    }

    detail.positions[pos.id] = {
      position: pos,
      starCounts,
      totalVotes,
      finalStar,
    };
  }

  return detail;
}

export {
  POSITIONS,
  STAR_LEVELS,
  MAX_NAME_CHANGES,
  seed,
  findUserByName,
  findUserById,
  createUser,
  getAllUsers,
  getUsersPage,
  deleteUser,
  restoreUser,
  updateUser,
  changeUserName,
  upsertVote,
  updateVote,
  deleteVote,
  getVotesByVoter,
  getAllVotes,
  getVotesPage,
  getVotesForCandidate,
  calculateResults,
  getDetailedResults,
  getPlayerDetail,
  getSortKey,
};
