import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nameRegex = /^[\u4e00-\u9fa5a-zA-Z]{1,20}$/;
    if (!nameRegex.test(name)) {
      setError('名字只能包含汉字和大小写字母，长度1-20个字符');
      return;
    }

    if (password.length < 1 || password.length > 8) {
      setError('密码长度需为1-8位');
      return;
    }
    if (/\s/.test(password)) {
      setError('密码不能包含空格');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register(name, password, nickname);
      navigate('/vote');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card p-6 sm:p-8">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="球队logo" className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-court-500/50 mb-3" />
          <h1 className="text-2xl font-bold text-white">注册</h1>
          <p className="text-slate-400 text-sm mt-1">加入篮球群投票</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">名字（登录账号）</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="汉字或字母，如：张三、ZhangSan"
              required
            />
            <p className="text-xs text-slate-500 mt-1">只能包含汉字和大小写字母</p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">昵称（页面显示用）</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-court-500 transition-colors"
              placeholder="如：大魔王、三分神射手"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="1-8位，可含数字、字母、符号"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="再次输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          已有账号？
          <Link to="/login" className="text-court-400 hover:text-court-300 ml-1">
            去登录
          </Link>
        </div>
      </div>
    </div>
  );
}
