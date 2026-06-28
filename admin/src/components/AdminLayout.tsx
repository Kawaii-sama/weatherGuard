import { NavLink, useNavigate } from 'react-router-dom';
import { KawaiiSunMascot } from './KawaiiSunMascot';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  pendingCount?: number;
}

export function AdminLayout({ children, pendingCount = 0 }: AdminLayoutProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-display font-semibold text-sm px-4 py-2 rounded-full transition-colors ${
      isActive ? 'bg-ink text-white' : 'text-ink hover:bg-sakura/40'
    }`;

  return (
    <div className="min-h-screen bg-cloud">
      <header className="sticky top-0 z-10 bg-cloud/90 backdrop-blur border-b border-[#F1E4F0]">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KawaiiSunMascot mood={pendingCount > 0 ? 'sparkly' : 'sleepy'} size={44} />
            <div>
              <p className="font-display font-bold text-lg leading-tight">WeatherGuard Admin</p>
              <p className="text-xs text-ink-soft leading-tight">Invite-only weather alerts</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink to="/dashboard" className={linkClass}>
              Requests{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </NavLink>
            <NavLink to="/alerts" className={linkClass}>
              Alerts
            </NavLink>
            <button onClick={handleLogout} className="kawaii-btn-secondary !px-4 !py-2 text-sm">
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
