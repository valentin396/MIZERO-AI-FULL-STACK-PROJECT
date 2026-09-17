import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CATEGORY_EMOJI } from '../components/ItemCard.jsx';

export default function ItemDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/items/${id}`).then((res) => setData(res.data));
  }, [id]);

  if (!data) return <div className="max-w-3xl mx-auto px-6 py-12 text-ink/40">Loading…</div>;
  const { item, suggestions } = data;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="text-xs uppercase tracking-wide text-hills font-medium mb-2">{item.status}</p>
      <h1 className="text-3xl font-semibold mb-4">{item.title}</h1>
      <div className="w-full h-72 mb-6 border border-ink/15 bg-paper overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {CATEGORY_EMOJI[item.category] || '📦'}
          </div>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm mb-8 border border-ink/15 p-5 bg-cream">
        <div><dt className="text-ink/50">Category</dt><dd>{item.category}</dd></div>
        <div><dt className="text-ink/50">District</dt><dd>{item.location}</dd></div>
        {item.landmark && <div><dt className="text-ink/50">Sector / landmark</dt><dd>{item.landmark}</dd></div>}
        <div><dt className="text-ink/50">Date</dt><dd>{item.event_date}</dd></div>
        {item.color && <div><dt className="text-ink/50">Color</dt><dd>{item.color}</dd></div>}
        <div className="col-span-2"><dt className="text-ink/50">Description</dt><dd>{item.description}</dd></div>
      </dl>

      <h2 className="text-xl font-semibold mb-4">Possible matches</h2>
      {suggestions.length === 0 ? (
        <p className="text-ink/50 text-sm">No matches yet. MIZERO re-checks automatically whenever a new report comes in.</p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li key={s.item.id} className="border border-ink/15 bg-cream p-4">
              <div className="flex items-baseline justify-between mb-1">
                <Link to={`/items/${s.item.id}`} className="font-medium hover:text-clay">{s.item.title}</Link>
                <span className="text-xs text-ochre font-medium">{Math.round(s.score * 100)}% match</span>
              </div>
              <Link to={`/matches/${s.match_id}`} className="text-xs text-clay hover:underline">View full match breakdown →</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
