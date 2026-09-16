import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';
import { useLanguage } from '../services/language.jsx';

const LANGS = [['en', '🇬🇧'], ['rw', '🇷🇼'], ['fr', '🇫🇷']];

export default function Nav() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const initial = user?.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <header className="border-b border-ink/10 bg-cream" style={{ borderRadius: 0 }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-semibold tracking-tight text-hills">MIZERO</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/" className="hover:text-clay">{t('nav_home')}</Link>
            <Link to="/how-it-works" className="hover:text-clay">{t('nav_how')}</Link>
            <Link to="/about" className="hover:text-clay">{t('nav_about')}</Link>
            <Link to="/contact" className="hover:text-clay">{t('nav_contact')}</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex gap-1 mr-1">
            {LANGS.map(([code, flag]) => (
              <button key={code} onClick={() => setLang(code)}
                className={`text-xs w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  lang === code ? 'bg-hills/15 ring-1 ring-hills' : 'opacity-50 hover:opacity-100'
                }`}>
                {flag}
              </button>
            ))}
          </div>
          <Link to="/search" className="hidden lg:inline hover:text-clay">{t('nav_browse')}</Link>
          <Link to="/map" className="hidden lg:inline hover:text-clay">{t('nav_map')}</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-clay">{t('nav_dashboard')}</Link>
              <Link to="/dashboard/notifications" className="text-lg hover:text-clay">🔔</Link>
              <span className="w-8 h-8 rounded-full bg-hills text-cream flex items-center justify-center text-xs font-semibold">
                {initial}
              </span>
              <button onClick={() => { logout(); navigate('/'); }} className="text-clay hover:underline">
                {t('nav_logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-clay">{t('nav_login')}</Link>
              <Link to="/signup" className="bg-hills text-cream px-4 py-1.5 rounded-lg hover:bg-hills-light transition-colors">
                {t('nav_signup')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}