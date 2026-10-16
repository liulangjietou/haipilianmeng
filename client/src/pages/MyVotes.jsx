import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import StarRating from '../components/StarRating';

export default function MyVotes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchVotes();
  }, [user]);

  const fetchVotes = async () => {
    try {
      const { data } = await api.get('/votes/my');
      setVotes(data.votes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (voteId) => {
    try {
      await api.delete(`/votes/${voteId}`);
      setVotes(votes.filter((v) => v.id !== voteId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  const grouped = {};
  for (const v of votes) {
    if (!grouped[v.candidateId]) {
      grouped[v.candidateId] = { name: v.candidateName, votes: [] };
    }
    grouped[v.candidateId].votes.push(v);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">我的投票</h1>
        <p className="text-slate-400 text-sm">查看和管理你的投票记录</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50">
          <p className="text-slate-400 mb-3">还没有投过票</p>
          <button
            onClick={() => navigate('/vote')}
            className="text-court-400 hover:text-court-300 text-sm"
          >
            去投票 →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([candidateId, { name, votes: vlist }]) => (
            <div
              key={candidateId}
              className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5"
            >
              <h3 className="text-white font-medium mb-3">{name}</h3>
              <div className="space-y-2">
                {vlist.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between bg-slate-900/30 rounded-lg px-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">
                        {v.positionName}
                      </span>
                      <StarRating count={v.starLevel} size="sm" />
                    </div>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
