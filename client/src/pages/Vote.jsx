import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import StarRating from '../components/StarRating';

const POSITIONS = [
  { id: 1, name: '控球后卫' },
  { id: 2, name: '得分后卫' },
  { id: 3, name: '小前锋' },
  { id: 4, name: '大前锋' },
  { id: 5, name: '中锋' },
];

export default function Vote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [myVotes, setMyVotes] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [playersRes, votesRes] = await Promise.all([
        api.get('/results/players'),
        api.get('/votes/my'),
      ]);
      setPlayers(playersRes.data.players.filter((p) => p.id !== user.id));

      const voteMap = {};
      for (const v of votesRes.data.votes) {
        const key = `${v.candidateId}-${v.positionId}`;
        voteMap[key] = v.starLevel;
      }
      setMyVotes(voteMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = async (candidateId, positionId, starLevel) => {
    const key = `${candidateId}-${positionId}`;
    const newVotes = { ...myVotes };

    if (newVotes[key] === starLevel) {
      delete newVotes[key];
    } else {
      newVotes[key] = starLevel;
    }
    setMyVotes(newVotes);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const votes = Object.entries(myVotes).map(([key, starLevel]) => {
        const [candidateId, positionId] = key.split('-').map(Number);
        return { candidateId, positionId, starLevel };
      });
      await api.post('/votes/batch', { votes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  const totalVotes = Object.keys(myVotes).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">投票</h1>
        <p className="text-slate-400 text-sm">
          为球员在不同位置上评定星级（1-5星，5星最高）
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400">
          已评 <span className="text-court-400 font-medium">{totalVotes}</span> 项
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-court-600 hover:bg-court-500 text-white disabled:opacity-50'
          }`}
        >
          {saving ? '保存中...' : saved ? '已保存 ✓' : '保存投票'}
        </button>
      </div>

      <div className="space-y-2">
        {players.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50">
            <p className="text-slate-400">暂无可投票的球员</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === player.id ? null : player.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
              >
                <span className="text-white font-medium">{player.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {POSITIONS.filter((p) => myVotes[`${player.id}-${p.id}`]).length}/5 已评
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expanded === player.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expanded === player.id && (
                <div className="px-5 pb-4 space-y-3 border-t border-slate-700/30 pt-3">
                  {POSITIONS.map((pos) => {
                    const key = `${player.id}-${pos.id}`;
                    const currentStar = myVotes[key] || 0;
                    return (
                      <div key={pos.id} className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 w-20">
                          {pos.id}号位
                          <span className="text-slate-500 text-xs ml-1">{pos.name}</span>
                        </span>
                        <StarRating
                          count={currentStar}
                          interactive
                          onChange={(star) => handleStarClick(player.id, pos.id, star)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
