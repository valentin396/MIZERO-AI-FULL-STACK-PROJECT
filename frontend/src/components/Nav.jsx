import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = user?.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <header className="border-b border-ink/10 bg-cream" style={{ borderRadius: 0 }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-semibold tracking-tight text-hills">MIZERO</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/" className="hover:text-clay">Home</Link>
            <Link to="/how-it-works" className="hover:text-clay">How it Works</Link>
            <Link to="/about" className="hover:text-clay">About</Link>
            <Link to="/contact" className="hover:text-clay">Contact</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/search" className="hidden lg:inline hover:text-clay">Browse</Link>
          <Link to="/map" className="hidden lg:inline hover:text-clay">Map</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-clay">Dashboard</Link>
              <Link to="/dashboard/notifications" className="text-lg hover:text-clay">🔔</Link>
              <span className="w-8 h-8 rounded-full bg-hills text-cream flex items-center justify-center text-xs font-semibold">
                {initial}
              </span>
              <button onClick={() => { logout(); navigate('/'); }} className="text-clay hover:underline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-clay">Login</Link>
              <Link to="/signup" className="bg-hills text-cream px-4 py-1.5 rounded-lg hover:bg-hills-light transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
