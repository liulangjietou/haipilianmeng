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
        voteMap[`${v.candidateId}-${v.positionId}`] = v.starLevel;
      }
      setMyVotes(voteMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (candidateId, positionId, starLevel) => {
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

  const saveButton = (
    <button
      onClick={handleSave}
      disabled={saving}
      className={`btn-primary px-6 py-2.5 text-sm ${saved ? 'from-green-600 to-green-600' : ''}`}
    >
      {saving ? '保存中...' : saved ? '已保存 ✓' : '保存投票'}
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-extrabold text-white">投票</h1>
        <p className="mt-1 text-sm text-slate-400">为球员在不同位置上评定星级（1-5星，5星最高）</p>
      </div>

      <div className="card mb-4 flex items-center justify-between px-4 py-3">
        <span className="text-sm text-slate-300">
          已评 <span className="font-semibold text-court-400">{totalVotes}</span> 项
        </span>
        {saveButton}
      </div>

      <div className="space-y-3">
        {players.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-400">暂无可投票的球员</p>
          </div>
        ) : (
          players.map((player) => {
            const ratedCount = POSITIONS.filter((p) => myVotes[`${player.id}-${p.id}`]).length;
            const open = expanded === player.id;
            return (
              <div key={player.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpanded(open ? null : player.id)}
                  className="flex w-full items-center justify-between px-4 py-4 transition-colors active:bg-white/[0.05]"
                >
                  <span className="text-base font-semibold text-white">{player.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ratedCount === 5 ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {ratedCount}/5 已评
                    </span>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {open && (
                  <div className="space-y-1 border-t border-white/10 px-2 py-3">
                    {POSITIONS.map((pos) => {
                      const key = `${player.id}-${pos.id}`;
                      const currentStar = myVotes[key] || 0;
                      return (
                        <div key={pos.id} className="flex items-center justify-between rounded-xl px-2 py-1.5">
                          <span className="w-24 shrink-0 text-sm text-slate-300">
                            <span className="font-semibold text-court-400">{pos.id}号位</span>
                            <span className="ml-1 text-xs text-slate-500">{pos.name}</span>
                          </span>
                          <StarRating
                            count={currentStar}
                            size="lg"
                            interactive
                            onChange={(star) => handleStarClick(player.id, pos.id, star)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
