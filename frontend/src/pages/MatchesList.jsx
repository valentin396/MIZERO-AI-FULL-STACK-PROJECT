import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS_LABEL = { pending: 'Awaiting review', confirmed: 'Confirmed', rejected: 'Dismissed' };

export default function MatchesList() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    api.get('/matches').then((res) => setMatches(res.data));
  }, []);

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Matches</h1>
      <p className="text-ink/60 mb-8">Every AI-suggested match involving one of your reports.</p>

      {matches.length === 0 ? (
        <p className="text-ink/50 text-sm">No matches yet.</p>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Link key={m.id} to={`/matches/${m.id}`} className="flex items-center justify-between border border-ink/15 bg-cream p-4 hover:border-clay transition-colors">
              <div className="min-w-0">
                <p className="text-sm truncate">
                  <span className="font-medium">{m.lost_item.title}</span>
                  <span className="text-ink/30 mx-2">→</span>
                  <span className="font-medium">{m.found_item.title}</span>
                </p>
                <p className="text-xs text-ink/50 mt-1">{STATUS_LABEL[m.status]}</p>
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
