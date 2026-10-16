import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <img src="/logo.jpg" alt="球队logo" className="w-10 h-10 rounded-full object-cover border-2 border-court-500/50" />
          <span className="bg-gradient-to-r from-court-400 to-court-600 bg-clip-text text-transparent">
            嗨皮联盟星级投票
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-slate-300 hover:text-white transition-colors text-sm"
          >
            排行榜
          </Link>

          {user ? (
            <>
              <Link
                to="/vote"
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                投票
              </Link>
              <Link
                to="/my-votes"
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                我的投票
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-court-400 hover:text-court-300 transition-colors text-sm font-medium"
                >
                  管理后台
                </Link>
              )}
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-700">
                <span className="text-sm text-slate-400">
                  {user.nickname || user.name}
                  {user.role === 'admin' && (
                    <span className="ml-1 text-court-400 text-xs">管理员</span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  退出
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-sm bg-court-600 hover:bg-court-500 rounded-lg transition-colors"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
