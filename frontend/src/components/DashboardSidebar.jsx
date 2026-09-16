import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';
import { useLanguage } from '../services/language.jsx';

export default function DashboardSidebar({ notificationCount = 0 }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const LINKS = [
    { to: '/dashboard', label: t('side_dashboard'), icon: '▦' },
    { to: '/dashboard/reports', label: t('side_reports'), icon: '≡' },
    { to: '/dashboard/matches', label: t('side_matches'), icon: '⤦' },
    { to: '/dashboard/chat', label: t('side_chat'), icon: '💬' },
    { to: '/dashboard/notifications', label: t('side_notifications'), icon: '•' },
    { to: '/community', label: t('side_community'), icon: '◉' },
    { to: '/dashboard/profile', label: t('side_profile'), icon: '○' },
    { to: '/dashboard/settings', label: t('side_settings'), icon: '⚙' },
  ];

  return (
    <aside className="w-56 flex-shrink-0 border-r border-line bg-cream min-h-[calc(100vh-65px)] py-6 flex flex-col justify-between" style={{ borderRadius: 0 }}>
      <nav className="space-y-1 px-3">
        {LINKS.map((link) => {
          const active = pathname === link.to;
          return (
            <Link key={link.to} to={link.to}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                active ? 'bg-hills text-cream font-medium' : 'text-ink/70 hover:bg-paper'
              }`}>
              <span className="flex items-center gap-2">
                <span className="w-4 text-center">{link.icon}</span>
                {link.label}
              </span>
              {link.to === '/dashboard/notifications' && notificationCount > 0 && (
                <span className={`text-xs rounded-full px-1.5 ${active ? 'bg-cream text-hills' : 'bg-clay text-cream'}`}>
                  {notificationCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-3">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-ink/70 hover:bg-paper transition-colors"
        >
          <span className="w-4 text-center">→</span>
          {t('side_logout')}
        </button>
      </div>
    </aside>
  );
}