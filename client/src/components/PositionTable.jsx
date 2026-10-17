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
      <div className="card p-6">
        <h3 className="mb-3 text-lg font-bold text-court-400">
          {positionId}号位 · {POSITION_NAMES[positionId]}
        </h3>
        <p className="text-sm text-slate-500">暂无评级数据</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/10 bg-gradient-to-r from-court-600/25 to-transparent px-4 py-3">
        <h3 className="text-base font-bold text-court-300">
          {positionId}号位 · {POSITION_NAMES[positionId]} · 共 {rankings.length} 人
        </h3>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-slate-400 text-sm border-b border-white/10">
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
              <tr key={player.candidate.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                <td className="px-4 py-3"><RankBadge rank={player.rank} /></td>
                <td className="px-4 py-3">
                  <Link to={`/player/${player.candidate.id}`} className="font-medium text-white transition-colors hover:text-court-400">
                    {player.candidate.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-center"><StarRating count={player.finalStar} size="sm" /></td>
                {[5, 4, 3, 2, 1].map((star) => (
                  <td key={star} className="px-4 py-3 text-center text-sm text-slate-300">
                    {player.starCounts[star] || 0}
                  </td>
                ))}
                <td className="px-4 py-3 text-center"><span className="text-sm font-medium text-slate-300">{player.totalVotes}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-white/5">
        {rankings.map((player) => (
          <Link
            key={player.candidate.id}
            to={`/player/${player.candidate.id}`}
            className="block px-4 py-3 transition-colors active:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <RankBadge rank={player.rank} />
                <span className="truncate text-base font-semibold text-white">{player.candidate.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StarRating count={player.finalStar} size="sm" />
                <span className="text-xs text-slate-400">{player.totalVotes}票</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 pl-9 text-[11px] text-slate-500">
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
  const style =
    rank === 1
      ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow shadow-amber-500/30'
      : rank === 2
        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800'
        : rank === 3
          ? 'bg-gradient-to-br from-orange-300 to-orange-600 text-orange-950'
          : 'bg-white/10 text-slate-300';
  return (
    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${style}`}>
      {rank}
    </span>
  );
}
