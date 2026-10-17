import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangeNameModal from './ChangeNameModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showNameModal, setShowNameModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayName = user ? user.nickname || user.name : '';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src="/logo.jpg"
              alt="球队logo"
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-court-500/50"
            />
            <span className="truncate bg-gradient-to-r from-court-300 to-court-500 bg-clip-text text-lg font-extrabold text-transparent">
              嗨皮联盟星级投票
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
            <Link to="/" className="transition-colors hover:text-white">排行榜</Link>
            {user && <Link to="/vote" className="transition-colors hover:text-white">投票</Link>}
            {user && <Link to="/my-votes" className="transition-colors hover:text-white">我的投票</Link>}
            {user?.role === 'admin' && (
              <Link to="/admin" className="font-medium text-court-400 transition-colors hover:text-court-300">
                管理后台
              </Link>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={() => setShowNameModal(true)}
                  className="text-xs text-court-400 transition-colors hover:text-court-300"
                >
                  改名
                </button>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-court-500/20 text-sm font-bold text-court-300">
                  {displayName.slice(0, 1)}
                </span>
                <span className="max-w-[5.5rem] truncate text-sm font-medium text-slate-200">
                  {displayName}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-300 transition-colors hover:text-white">
                  登录
                </Link>
                <Link to="/register" className="btn-primary px-3.5 py-1.5 text-sm">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      {showNameModal && <ChangeNameModal onClose={() => setShowNameModal(false)} />}
    </>
  );
}
