import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';
import { useLanguage } from '../services/language.jsx';

export default function Signup() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">{t('signup_title')}</h1>
      <p className="text-ink/60 text-sm mb-6">{t('signup_sub')}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-ink/60 mb-1">{t('name_label')}</label>
          <input required value={form.name} onChange={update('name')} className="w-full border border-ink/20 px-3 py-2 bg-cream focus:outline-none focus:border-clay" />
        </div>
        <div>
          <label className="block text-sm text-ink/60 mb-1">{t('email_label')}</label>
          <input type="email" required value={form.email} onChange={update('email')} className="w-full border border-ink/20 px-3 py-2 bg-cream focus:outline-none focus:border-clay" />
        </div>
        <div>
          <label className="block text-sm text-ink/60 mb-1">{t('phone_label')}</label>
          <input required value={form.phone} onChange={update('phone')} placeholder="07XXXXXXXX" className="w-full border border-ink/20 px-3 py-2 bg-cream focus:outline-none focus:border-clay" />
        </div>
        <div>
          <label className="block text-sm text-ink/60 mb-1">{t('password_label')}</label>
          <input type="password" required minLength={8} value={form.password} onChange={update('password')} className="w-full border border-ink/20 px-3 py-2 bg-cream focus:outline-none focus:border-clay" />
          <p className="text-xs text-ink/40 mt-1">At least 8 characters.</p>
        </div>
        {error && <p className="text-sm text-clay-dark">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-clay text-cream py-2.5 rounded-lg font-medium hover:bg-clay-dark transition-colors disabled:opacity-60">
          {loading ? '…' : t('signup_btn')}
        </button>
      </form>
      <p className="text-sm text-ink/60 mt-6">
        {t('have_account')} <Link to="/login" className="text-clay hover:underline">{t('login_btn')}</Link>
      </p>
    </div>
  );
}