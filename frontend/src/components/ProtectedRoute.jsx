import { Navigate } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="max-w-6xl mx-auto px-6 py-12 text-ink/40">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
