import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';
import { useLanguage } from '../services/language.jsx';

const LANGS = [
  ['en', '🇬🇧', 'English'],
  ['rw', '🇷🇼', 'Kinyarwanda'],
  ['fr', '🇫🇷', 'Français'],
];

const NAV_HEIGHT = 80; // px — kept in sync with App.jsx's <main> top padding

export default function Nav() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langMenuRef = useRef(null);
  const initial = user?.name?.trim()?.[0]?.toUpperCase() || '?';

  const isHome = location.pathname === '/';
  const transparent = isHome && !scrolled;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) setLangOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  const linkColor = transparent ? 'text-white/90 hover:text-white' : 'text-ink hover:text-clay';
  const iconColor = transparent ? 'text-white' : 'text-ink';
  const currentLang = LANGS.find(([code]) => code === lang) || LANGS[0];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        transparent ? 'bg-transparent' : 'bg-white shadow-sm border-b border-ink/10'
      }`}
      style={{ height: NAV_HEIGHT }}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between gap-6">
        {/* Brand */}
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 shrink-0">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className={transparent ? 'text-white' : 'text-hills'}>
            <path
              d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.5 7.5 12.5 7.5 12.5s7.5-7 7.5-12.5C19.5 5.36 16.14 2 12 2z"
              fill="currentColor"
            />
            <circle cx="12" cy="9.5" r="2.75" fill={transparent ? '#0f172a' : 'white'} />
          </svg>
          <div className="leading-tight">
            <p className={`text-lg font-bold tracking-tight ${transparent ? 'text-white' : 'text-ink'}`}>MIZERO</p>
            <p className={`text-[10px] font-medium ${transparent ? 'text-white/75' : 'text-ink/45'}`}>{t('brand_tagline')}</p>
          </div>
        </Link>

        {/* Center nav */}
        <nav className={`hidden md:flex items-center gap-7 text-sm font-medium ${linkColor} transition-colors`}>
          <Link to="/" className="transition-colors">{t('nav_home')}</Link>
          <Link to="/how-it-works" className="transition-colors">{t('nav_how')}</Link>
          <Link to="/about" className="transition-colors">{t('nav_about')}</Link>
          <Link to="/contact" className="transition-colors">{t('nav_contact')}</Link>
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              className={`flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-full transition-colors ${
                transparent ? 'text-white/90 hover:bg-white/10' : 'text-ink hover:bg-paper'
              }`}
            >
              <span>🇷🇼</span>
              <span className="hidden lg:inline">Rwanda</span>
              <svg width="10" height="10" viewBox="0 0 12 8" fill="none" className={langOpen ? 'rotate-180 transition-transform' : 'transition-transform'}>
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-ink/10 rounded-lg shadow-lg py-1 text-sm">
                {LANGS.map(([code, flag, label]) => (
                  <button
                    key={code}
                    onClick={() => { setLang(code); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-paper transition-colors ${lang === code ? 'text-hills font-medium' : 'text-ink'}`}
                  >
                    <span>{flag}</span>{label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              <Link to="/dashboard/notifications" aria-label={t('side_notifications')} className={`${iconColor} hover:text-clay transition-colors`}>
                <BellIcon />
              </Link>
              <Link to="/dashboard/profile" className="w-9 h-9 rounded-full bg-hills text-cream flex items-center justify-center text-xs font-semibold shrink-0">
                {initial}
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="bg-hills text-cream px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hills-light transition-colors"
              >
                {t('nav_logout')}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-hills text-cream px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hills-light transition-colors whitespace-nowrap"
            >
              {t('nav_login')} / {t('nav_signup')}
            </Link>
          )}
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className={`md:hidden text-2xl w-9 h-9 flex items-center justify-center ${iconColor}`}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-ink/10 px-6 py-4 flex flex-col gap-4 text-sm bg-white shadow-lg">
          <nav className="flex flex-col gap-3 text-ink">
            <Link to="/" onClick={closeMenu} className="hover:text-clay">{t('nav_home')}</Link>
            <Link to="/how-it-works" onClick={closeMenu} className="hover:text-clay">{t('nav_how')}</Link>
            <Link to="/about" onClick={closeMenu} className="hover:text-clay">{t('nav_about')}</Link>
            <Link to="/contact" onClick={closeMenu} className="hover:text-clay">{t('nav_contact')}</Link>
            <Link to="/search" onClick={closeMenu} className="hover:text-clay">{t('nav_browse')}</Link>
            <Link to="/map" onClick={closeMenu} className="hover:text-clay">{t('nav_map')}</Link>
            {user && (
              <>
                <Link to="/dashboard" onClick={closeMenu} className="hover:text-clay">{t('nav_dashboard')}</Link>
                <Link to="/dashboard/notifications" onClick={closeMenu} className="hover:text-clay">🔔 {t('side_notifications')}</Link>
              </>
            )}
          </nav>

          <div className="flex gap-2">
            {LANGS.map(([code, flag]) => (
              <button key={code} onClick={() => setLang(code)}
                className={`text-xs w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  lang === code ? 'bg-hills/15 ring-1 ring-hills' : 'opacity-50 hover:opacity-100'
                }`}>
                {flag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-ink/10">
            {user ? (
              <>
                <span className="w-8 h-8 rounded-full bg-hills text-cream flex items-center justify-center text-xs font-semibold">
                  {initial}
                </span>
                <button onClick={() => { logout(); navigate('/'); closeMenu(); }} className="text-clay hover:underline">
                  {t('nav_logout')}
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMenu} className="bg-hills text-cream px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hills-light transition-colors">
                {t('nav_login')} / {t('nav_signup')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export { NAV_HEIGHT };
