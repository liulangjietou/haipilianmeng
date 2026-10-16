import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import StarRating from '../components/StarRating';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('votes');
  const [votes, setVotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, tab, page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'votes') {
        const { data } = await api.get('/admin/votes', { params: { page, pageSize } });
        setVotes(data.votes);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (data.page !== page) setPage(data.page);
      } else {
        const { data } = await api.get('/admin/users');
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVote = async (id) => {
    if (!confirm('确定删除此投票？')) return;
    try {
      await api.delete(`/admin/votes/${id}`);
      if (votes.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('确定删除此用户？相关投票也会被删除。')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUser = async (id, active) => {
    try {
      await api.put(`/admin/users/${id}`, { active: !active });
      setUsers(users.map((u) => (u.id === id ? { ...u, active: !active } : u)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await api.get('/admin/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `basketball-vote-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">管理后台</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
        >
          导出数据
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab('votes'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'votes'
              ? 'bg-court-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          投票明细
        </button>
        <button
          onClick={() => { setTab('users'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'users'
              ? 'bg-court-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          用户管理
        </button>
      </div>

      {loading && votes.length === 0 && tab === 'votes' ? (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      ) : tab === 'votes' ? (
        <div
          className={`bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden transition-opacity ${
            loading ? 'opacity-60' : ''
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left">投票人</th>
                  <th className="px-4 py-3 text-left">被投票人</th>
                  <th className="px-4 py-3 text-left">位置</th>
                  <th className="px-4 py-3 text-center">星级</th>
                  <th className="px-4 py-3 text-left">时间</th>
                  <th className="px-4 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {votes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      暂无投票记录
                    </td>
                  </tr>
                ) : (
                  votes.map((v) => (
                    <tr key={v.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                      <td className="px-4 py-3 text-white text-sm">{v.voterName}</td>
                      <td className="px-4 py-3 text-white text-sm">{v.candidateName}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{v.positionName}</td>
                      <td className="px-4 py-3 text-center">
                        <StarRating count={v.starLevel} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(v.updatedAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteVote(v.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-700/50">
            <span className="text-slate-400 text-sm">共 {total} 条投票记录</span>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-slate-300 text-sm focus:outline-none"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} 条/页</option>
                ))}
              </select>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-sm"
              >
                上一页
              </button>
              <span className="text-slate-400 text-sm">第 {page} / {totalPages} 页</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-sm"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">名字</th>
                  <th className="px-4 py-3 text-left">昵称</th>
                  <th className="px-4 py-3 text-left">角色</th>
                  <th className="px-4 py-3 text-left">状态</th>
                  <th className="px-4 py-3 text-left">注册时间</th>
                  <th className="px-4 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                    <td className="px-4 py-3 text-slate-400 text-sm">{u.id}</td>
                    <td className="px-4 py-3 text-white text-sm font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{u.nickname || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          u.role === 'admin'
                            ? 'bg-court-600/20 text-court-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {u.role === 'admin' ? '管理员' : '用户'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          u.active
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-red-600/20 text-red-400'
                        }`}
                      >
                        {u.active ? '正常' : '禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleUser(u.id, u.active)}
                            className="text-xs text-amber-400 hover:text-amber-300"
                          >
                            {u.active ? '禁用' : '启用'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
