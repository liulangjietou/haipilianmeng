import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  rank: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path strokeLinecap="round" d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
    </svg>
  ),
  vote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 3a15 15 0 0 1 0 18M3.5 9h17M3.5 15h17" />
    </svg>
  ),
  me: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
    </svg>
  ),
};

export default function MobileTabBar() {
  const { user } = useAuth();

  const tabs = [
    { to: '/', label: '排行榜', icon: icons.rank, end: true },
    { to: '/vote', label: '投票', icon: icons.vote, auth: true },
    { to: '/my-votes', label: '我的', icon: icons.me, auth: true },
  ];
  if (user?.role === 'admin') tabs.push({ to: '/admin', label: '管理', icon: icons.admin });

  const visible = tabs.filter((t) => !t.auth || user);

  return (
    <nav className="tabbar-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-900/90 backdrop-blur-lg md:hidden">
      <div className="flex">
        {visible.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-court-400' : 'text-slate-500'
              }`
            }
          >
            {t.icon}
            <span>{t.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
