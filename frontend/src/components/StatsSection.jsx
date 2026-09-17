import { useEffect, useState } from 'react';
import api from '../services/api';

export default function StatsSection() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/rwanda/platform-stats')
      .then((res) => setStats(res.data))
      .catch(() => setError(true));
  }, []);

  if (!stats || error) return null;

  const items = [
    { value: stats.total_reports, label: 'Reports filed' },
    { value: stats.recovered_count, label: 'Items recovered' },
    { value: stats.active_districts, label: 'Districts active' },
  ];

  return (
    <section className="bg-paper border-y border-ink/10">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-3 gap-4 text-center">
        {items.map((it) => (
          <div key={it.label}>
            <p className="text-3xl md:text-4xl font-semibold text-hills">{it.value}</p>
            <p className="text-sm text-ink/60 mt-1">{it.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
