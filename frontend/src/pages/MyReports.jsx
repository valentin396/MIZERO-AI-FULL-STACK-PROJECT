import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../services/auth.jsx';

export default function MyReports() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    api.get('/items').then((res) => setItems(res.data.filter((i) => i.user_id === user.id)));
  }, [user.id]);

  async function markRecovered(id) {
    setSaving(id);
    await api.patch(`/items/${id}`, { status: 'RECOVERED' });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'RECOVERED' } : i)));
    setSaving(null);
  }

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">My Reports</h1>
      <p className="text-ink/60 mb-8">Everything you've reported, and its current status.</p>

      {items.length === 0 ? (
        <p className="text-ink/50 text-sm">You haven't reported anything yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border border-ink/15 bg-cream p-4">
              <div className="w-16 h-16 flex-shrink-0 bg-paper rounded-lg overflow-hidden">
                {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/items/${item.id}`} className="font-medium hover:text-clay block truncate">{item.title}</Link>
                <p className="text-xs text-ink/50">{item.category} · {item.location}</p>
              </div>
              <span className="text-xs uppercase tracking-wide text-ink/50">{item.status}</span>
              {item.status !== 'RECOVERED' && (
                <button onClick={() => markRecovered(item.id)} disabled={saving === item.id}
                  className="text-xs px-3 py-1.5 border border-hills text-hills hover:bg-hills hover:text-cream transition-colors disabled:opacity-50">
                  {saving === item.id ? 'Saving…' : 'Mark recovered'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
