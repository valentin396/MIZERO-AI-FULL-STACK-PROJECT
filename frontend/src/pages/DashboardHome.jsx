import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../services/auth.jsx';

const STATUS_COLOR = { LOST: 'text-clay-dark bg-clay/10', FOUND: 'text-blueinfo bg-blueinfo/10', RECOVERED: 'text-hills bg-hills/10', CLOSED: 'text-ink/40 bg-ink/5' };

export default function DashboardHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="px-8 py-8 text-ink/40">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Welcome back, {user?.name}! 👋</h1>
      <p className="text-ink/60 mb-8">Here's what's happening with your reports.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard value={data.lost_count} label="Lost Items" color="text-clay-dark" />
        <StatCard value={data.found_count} label="Found Items" color="text-blueinfo" />
        <StatCard value={data.match_count} label="Matches" color="text-hills" />
        <StatCard value={data.notification_count} label="Notifications" color="text-ochre" />
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Reports</h2>
        <Link to="/dashboard/reports" className="text-sm text-clay hover:underline">View all</Link>
      </div>
      {data.recent_reports.length === 0 ? (
        <p className="text-sm text-ink/50 mb-10">You haven't reported anything yet.</p>
      ) : (
        <div className="space-y-3 mb-10">
          {data.recent_reports.map((item) => (
            <Link key={item.id} to={`/items/${item.id}`} className="flex items-center gap-4 border border-ink/15 bg-cream p-4 hover:border-clay transition-colors">
              <div className="w-12 h-12 flex-shrink-0 bg-paper rounded-lg overflow-hidden">
                {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-xs text-ink/50">{item.status} · {item.location}{item.landmark ? `, ${item.landmark}` : ''}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[item.status]}`}>{item.status}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Matches</h2>
        <Link to="/dashboard/matches" className="text-sm text-clay hover:underline">View all</Link>
      </div>
      {data.recent_matches.length === 0 ? (
        <p className="text-sm text-ink/50">No matches yet.</p>
      ) : (
        <div className="space-y-3">
          {data.recent_matches.map((m) => (
            <Link key={m.id} to={`/matches/${m.id}`} className="flex items-center justify-between border border-ink/15 bg-cream p-4 hover:border-clay transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-paper overflow-hidden flex-shrink-0">
                  {m.lost_item.image_url && <img src={m.lost_item.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="truncate text-sm">{m.lost_item.title}</span>
                <span className="text-ink/30">→</span>
                <div className="w-9 h-9 rounded-lg bg-paper overflow-hidden flex-shrink-0">
                  {m.found_item.image_url && <img src={m.found_item.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="truncate text-sm">{m.found_item.title}</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-hills/10 text-hills font-medium flex-shrink-0 ml-3">
                {Math.round(m.final_score * 100)}% Match
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div className="border border-ink/15 bg-cream p-4">
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}
