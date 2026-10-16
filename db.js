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
    createdAt TEXT NOT NULL
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

const stmts = {
  countUsers: sqlite.prepare('SELECT COUNT(*) AS n FROM users'),
  findUserByName: sqlite.prepare('SELECT * FROM users WHERE name = ?'),
  findUserById: sqlite.prepare('SELECT * FROM users WHERE id = ?'),
  insertUser: sqlite.prepare(
    'INSERT INTO users (id, name, nickname, password, role, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
  ),
  allUsers: sqlite.prepare('SELECT * FROM users'),
  deleteUser: sqlite.prepare('DELETE FROM users WHERE id = ?'),
  deleteVotesOfUser: sqlite.prepare('DELETE FROM votes WHERE voterId = ? OR candidateId = ?'),
  findVote: sqlite.prepare(
    'SELECT * FROM votes WHERE voterId = ? AND candidateId = ? AND positionId = ?'
  ),
  updateVote: sqlite.prepare('UPDATE votes SET starLevel = ?, updatedAt = ? WHERE id = ? RETURNING *'),
  insertVote: sqlite.prepare(
    'INSERT INTO votes (voterId, candidateId, positionId, starLevel, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
  ),
  deleteVote: sqlite.prepare('DELETE FROM votes WHERE id = ?'),
  votesByVoter: sqlite.prepare('SELECT * FROM votes WHERE voterId = ?'),
  allVotes: sqlite.prepare('SELECT * FROM votes'),
  votesForCandidate: sqlite.prepare('SELECT * FROM votes WHERE candidateId = ?'),
  candidates: sqlite.prepare("SELECT * FROM users WHERE active = 1 AND role <> 'admin'"),
};

function mapUser(row) {
  if (!row) return row;
  return { ...row, active: row.active === 1 };
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
  return stmts.allUsers.all().map(({ password, ...u }) => ({ ...u, active: u.active === 1 }));
}

function deleteUser(id) {
  const tx = sqlite.transaction(() => {
    const votes = stmts.deleteVotesOfUser.run(id, id);
    const user = stmts.deleteUser.run(id);
    return user.changes > 0 || votes.changes > 0;
  });
  return tx();
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

function upsertVote(voterId, candidateId, positionId, starLevel) {
  const now = new Date().toISOString();
  const existing = stmts.findVote.get(voterId, candidateId, positionId);
  if (existing) {
    return stmts.updateVote.get(starLevel, now, existing.id);
  }
  return stmts.insertVote.get(voterId, candidateId, positionId, starLevel, now, now);
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

function getVotesForCandidate(candidateId) {
  return stmts.votesForCandidate.all(candidateId);
}

function calculateResults() {
  const candidates = stmts.candidates.all().map(mapUser);
  const allVotes = stmts.allVotes.all();
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
      if (b.finalStar !== a.finalStar) return b.finalStar - a.finalStar;
      return a.sortKey.localeCompare(b.sortKey);
    });
    rankings[pos.id] = playerRankings.map((p, i) => ({ rank: i + 1, ...p }));
  }
  return { positions: POSITIONS, rankings };
}

function getPlayerDetail(playerId) {
  const player = findUserById(playerId);
  if (!player) return null;

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
  seed,
  findUserByName,
  findUserById,
  createUser,
  getAllUsers,
  deleteUser,
  updateUser,
  upsertVote,
  deleteVote,
  getVotesByVoter,
  getAllVotes,
  getVotesForCandidate,
  calculateResults,
  getDetailedResults,
  getPlayerDetail,
  getSortKey,
};
