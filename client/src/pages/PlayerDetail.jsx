import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import StarRating from '../components/StarRating';

export default function PlayerDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const { data } = await api.get(`/results/player/${id}`);
        setDetail(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">球员不存在</div>
      </div>
    );
  }

  const posNames = {
    1: '控球后卫',
    2: '得分后卫',
    3: '小前锋',
    4: '大前锋',
    5: '中锋',
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Link to="/" className="text-sm text-slate-400 hover:text-court-400 transition-colors">
          ← 返回排行榜
        </Link>
        <h1 className="text-3xl font-bold text-white mt-3">{detail.player.name}</h1>
        <p className="text-slate-400 text-sm mt-1">球员评级详情</p>
      </div>

      <div className="space-y-4">
        {[5, 4, 3, 2, 1].map((posId) => {
          const posData = detail.positions[posId];
          if (!posData || posData.totalVotes === 0) return null;

          return (
            <div
              key={posId}
              className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-medium">
                    {posId}号位 · {posNames[posId]}
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">共 {posData.totalVotes} 票</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400 mb-0.5">最终评级</div>
                  <StarRating count={posData.finalStar} size="md" />
                </div>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = posData.starCounts[star] || 0;
                  const pct = posData.totalVotes > 0 ? (count / posData.totalVotes) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-8">{star}★</span>
                      <div className="flex-1 h-5 bg-slate-900/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-court-600 to-court-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-12 text-right">
                        {count} 票
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.values(detail.positions).every((p) => p.totalVotes === 0) && (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50">
            <p className="text-slate-400">暂无评级数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
