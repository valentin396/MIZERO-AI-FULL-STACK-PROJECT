import { useEffect, useState } from 'react';
import api from '../services/api';

const ADMIN_LINKS = ['Dashboard', 'Users', 'Items', 'Matches', 'Analytics'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/statistics'),
      api.get('/admin/reports-over-time'),
    ]).then(([s, t]) => { setStats(s.data); setTimeline(t.data); })
      .catch(() => setError('Admin access required — log in with the admin account (admin@mizero.rw / admin1234).'));
  }, []);

  if (error) return <div className="max-w-md mx-auto px-6 py-16 text-center text-ink/60">{error}</div>;
  if (!stats) return <div className="px-8 py-8 text-ink/40">Loading…</div>;

  const maxCount = Math.max(1, ...timeline.map((t) => t.count));
  const totalLocations = stats.top_locations.reduce((sum, l) => sum + l.count, 0) || 1;
  const donutColors = ['#16A34A', '#2563EB', '#D97706', '#DC2626', '#7C3AED'];

  return (
    <div className="min-h-screen bg-ink text-cream flex">
      <aside className="w-56 flex-shrink-0 border-r border-cream/10 py-6" style={{ borderRadius: 0 }}>
        <p className="px-6 mb-6 font-semibold">MIZERO Admin</p>
        <nav className="space-y-1 px-3">
          {ADMIN_LINKS.map((label, i) => (
            <div key={label} className={`px-3 py-2 text-sm rounded-lg ${i === 0 ? 'bg-hills text-cream font-medium' : 'text-cream/60'}`}>
              {label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 px-8 py-10">
        <h1 className="text-2xl font-semibold mb-8">Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
          <AdminStat value={stats.users} label="Users" />
          <AdminStat value={stats.lost_items} label="Lost Items" />
          <AdminStat value={stats.found_items} label="Found Items" />
          <AdminStat value={stats.matches} label="Matches" />
          <AdminStat value={stats.recovered} label="Recovered" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-cream/15 p-6" style={{ borderRadius: '0.75rem' }}>
            <h2 className="text-lg font-semibold mb-4">Reports Over Time</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-cream/40">No data yet.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {timeline.map((t) => (
                  <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-hills-light rounded-t" style={{ height: `${(t.count / maxCount) * 100}%`, minHeight: 4 }} />
                    <span className="text-[10px] text-cream/40">{t.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-cream/15 p-6" style={{ borderRadius: '0.75rem' }}>
            <h2 className="text-lg font-semibold mb-4">Top Locations</h2>
            <div className="space-y-2 mb-4">
              {stats.top_locations.map((l, i) => (
                <div key={l.location} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: donutColors[i % donutColors.length] }} />
                    {l.location}
                  </span>
                  <span className="text-hills-light font-medium">{l.count}</span>
                </div>
              ))}
            </div>
            <svg viewBox="0 0 42 42" className="w-24 h-24 mx-auto">
              {(() => {
                let offset = 0;
                return stats.top_locations.map((l, i) => {
                  const pct = (l.count / totalLocations) * 100;
                  const dash = `${pct} ${100 - pct}`;
                  const circle = (
                    <circle key={l.location} cx="21" cy="21" r="15.9" fill="transparent"
                      stroke={donutColors[i % donutColors.length]} strokeWidth="6"
                      strokeDasharray={dash} strokeDashoffset={-offset} />
                  );
                  offset += pct;
                  return circle;
                });
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStat({ value, label }) {
  return (
    <div className="border border-cream/15 p-4" style={{ borderRadius: '0.75rem' }}>
      <p className="text-2xl font-semibold text-hills-light">{value}</p>
      <p className="text-xs text-cream/50">{label}</p>
    </div>
  );
}
