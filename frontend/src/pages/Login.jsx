import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';
import { useLanguage } from '../services/language.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate(location.state?.from || '/dashboard');
    } catch {
      setError('Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-6">{t('login_title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-ink/60 mb-1">{t('email_label')}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-ink/20 px-3 py-2 bg-cream focus:outline-none focus:border-clay" />
        </div>
        <div>
          <label className="block text-sm text-ink/60 mb-1">{t('password_label')}</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-ink/20 px-3 py-2 bg-cream focus:outline-none focus:border-clay" />
        </div>
        {error && <p className="text-sm text-clay-dark">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-hills text-cream py-2.5 rounded-lg font-medium hover:bg-hills-light transition-colors disabled:opacity-60">
          {loading ? '…' : t('login_btn')}
        </button>
      </form>
      <p className="text-sm text-ink/60 mt-6">
        {t('no_account')} <Link to="/signup" className="text-clay hover:underline">{t('signup_btn')}</Link>
      </p>
      <p className="text-xs text-ink/40 mt-8">Demo login: demo@mizero.rw / demo1234</p>
    </div>
  );
}