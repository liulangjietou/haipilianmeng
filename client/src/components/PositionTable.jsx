import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const POSITION_NAMES = {
  1: '控球后卫',
  2: '得分后卫',
  3: '小前锋',
  4: '大前锋',
  5: '中锋',
};

export default function PositionTable({ positionId, rankings }) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-court-400 mb-3">
          {positionId}号位 · {POSITION_NAMES[positionId]}
        </h3>
        <p className="text-slate-500 text-sm">暂无评级数据</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-court-600/20 to-transparent border-b border-slate-700/50">
        <h3 className="text-base font-bold text-court-400">
          {positionId}号位 · {POSITION_NAMES[positionId]} · 共 {rankings.length} 人
        </h3>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-slate-400 text-sm border-b border-slate-700/50">
              <th className="px-4 py-3 text-left w-12">排名</th>
              <th className="px-4 py-3 text-left">球员</th>
              <th className="px-4 py-3 text-center">评级</th>
              <th className="px-4 py-3 text-center">5★</th>
              <th className="px-4 py-3 text-center">4★</th>
              <th className="px-4 py-3 text-center">3★</th>
              <th className="px-4 py-3 text-center">2★</th>
              <th className="px-4 py-3 text-center">1★</th>
              <th className="px-4 py-3 text-center">总票</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((player) => (
              <tr
                key={player.candidate.id}
                className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <RankBadge rank={player.rank} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/player/${player.candidate.id}`}
                    className="text-white hover:text-court-400 transition-colors font-medium"
                  >
                    {player.candidate.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-center">
                  <StarRating count={player.finalStar} size="sm" />
                </td>
                {[5, 4, 3, 2, 1].map((star) => (
                  <td key={star} className="px-4 py-3 text-center text-slate-300 text-sm">
                    {player.starCounts[star] || 0}
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  <span className="text-slate-400 text-sm font-medium">{player.totalVotes}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        {rankings.map((player) => (
          <Link
            key={player.candidate.id}
            to={`/player/${player.candidate.id}`}
            className="block px-4 py-3 border-b border-slate-700/30 active:bg-slate-700/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RankBadge rank={player.rank} />
                <span className="text-white font-medium text-base">{player.candidate.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <StarRating count={player.finalStar} size="sm" />
                <span className="text-xs text-slate-400">{player.totalVotes}票</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
              {[5, 4, 3, 2, 1].map((star) => (
                <span key={star}>
                  {star}★:{player.starCounts[star] || 0}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
        rank === 1
          ? 'bg-court-500 text-white'
          : rank === 2
            ? 'bg-slate-500 text-white'
            : rank === 3
              ? 'bg-amber-700 text-white'
              : 'bg-slate-700 text-slate-300'
      }`}
    >
      {rank}
    </span>
  );
}
