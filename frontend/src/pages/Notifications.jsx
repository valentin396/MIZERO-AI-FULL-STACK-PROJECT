import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Notifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/notifications').then((res) => setItems(res.data));
  }, []);

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Notifications</h1>
      <p className="text-ink/60 mb-8">Updates about your reports and matches.</p>

      {items.length === 0 ? (
        <p className="text-ink/50 text-sm">You're all caught up.</p>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 border border-ink/15 bg-cream p-4 ${n.read_status ? 'opacity-60' : ''}`}>
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read_status ? 'bg-ink/20' : 'bg-clay'}`} />
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-ink/60">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
