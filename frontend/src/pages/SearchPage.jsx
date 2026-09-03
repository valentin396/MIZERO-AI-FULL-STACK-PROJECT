import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCategories } from '../services/rwanda.js';

export default function SearchPage() {
  const categories = useCategories();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (status) params.status = status;
    if (category) params.category = category;
    api.get('/items', { params }).then((res) => setItems(res.data)).finally(() => setLoading(false));
  }, [q, status, category]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-6">Browse reports</h1>
      <div className="flex flex-wrap gap-3 mb-8">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by keyword, brand, landmark…"
          className="flex-1 min-w-[220px] border border-ink/20 px-4 py-2 text-sm bg-cream focus:outline-none focus:border-clay" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-ink/20 px-3 py-2 text-sm bg-cream">
          <option value="">All statuses</option>
          <option value="LOST">Lost</option>
          <option value="FOUND">Found</option>
          <option value="RECOVERED">Recovered</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-ink/20 px-3 py-2 text-sm bg-cream">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {loading ? <p className="text-ink/50 text-sm">Searching…</p> : items.length === 0 ? (
        <p className="text-ink/50 text-sm">No reports match those filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link key={item.id} to={`/items/${item.id}`} className="block border border-ink/15 bg-cream px-5 py-4 hover:border-clay transition-colors">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium uppercase tracking-wide text-hills">{item.status}</span>
                <span className="text-ink/50">{item.category}</span>
              </div>
              <h3 className="text-lg font-medium leading-snug mb-1">{item.title}</h3>
              <p className="text-sm text-ink/60">{item.location}{item.landmark ? `, ${item.landmark}` : ''}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
