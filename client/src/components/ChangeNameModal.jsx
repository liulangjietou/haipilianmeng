import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z]{1,20}$/;

export default function ChangeNameModal({ onClose }) {
  const { user, changeName } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [changedTo, setChangedTo] = useState(null);
  const left = user?.nameChangesLeft ?? 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!NAME_REGEX.test(name)) {
      setError('名字只能包含汉字和大小写字母，长度1-20个字符');
      return;
    }
    setLoading(true);
    try {
      const data = await changeName(name);
      setChangedTo(data.user.name);
    } catch (err) {
      setError(err.response?.data?.error || '改名失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-800 rounded-2xl border border-slate-700/60 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-1">修改名字</h3>
        <p className="text-xs text-slate-400 mb-4">
          只修改名字，昵称不变；最多可修改 2 次
        </p>

        <div className="bg-slate-900/50 rounded-lg px-4 py-3 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">当前名字</span>
            <span className="text-white font-medium">{user?.name}</span>
          </div>
          {user?.nickname && (
            <div className="flex justify-between mt-1.5">
              <span className="text-slate-400">昵称（不变）</span>
              <span className="text-slate-300">{user.nickname}</span>
            </div>
          )}
          <div className="flex justify-between mt-1.5">
            <span className="text-slate-400">剩余次数</span>
            <span className={left > 0 ? 'text-court-400 font-medium' : 'text-red-400 font-medium'}>
              {left > 0 ? `${left} 次` : '更改次数已用完'}
            </span>
          </div>
        </div>

        {changedTo ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">
              名字已修改为「{changedTo}」
            </div>
            <button
              onClick={onClose}
              className="w-full bg-court-600 hover:bg-court-500 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              知道了
            </button>
          </div>
        ) : left <= 0 ? (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              更改次数已用完
            </div>
            <button
              onClick={onClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              关闭
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">新名字</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-court-500 transition-colors"
                placeholder="汉字或字母，如：张三、ZhangSan"
                autoFocus
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-court-600 hover:bg-court-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {loading ? '提交中...' : '确认修改'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
