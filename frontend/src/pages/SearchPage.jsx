import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCategories } from '../services/rwanda.js';
import { useLanguage } from '../services/language.jsx';
import api from '../services/api';
import ItemCard from '../components/ItemCard.jsx';

export default function SearchPage() {
  const { t } = useLanguage();
  const categories = useCategories();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get('q') || '');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [items, setItems] = useState(null);
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
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  // Keeps filters in sync if the URL's query string changes while this page
  // is already mounted (e.g. clicking a category link from elsewhere without
  // a full navigation, or browser back/forward).
  useEffect(() => {
    setQ(searchParams.get('q') || '');
    setStatus(searchParams.get('status') || '');
    setCategory(searchParams.get('category') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const hasFilters = Boolean(q || status || category);

  function clearFilters() {
    setQ('');
    setStatus('');
    setCategory('');
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-6">{t('search_title')}</h1>
      <div className="flex flex-wrap gap-3 mb-8">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_placeholder')}
          className="flex-1 min-w-[220px] border border-ink/20 rounded-lg px-4 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-ink/20 rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay">
          <option value="">{t('all_statuses')}</option>
          <option value="LOST">{t('filter_lost')}</option>
          <option value="FOUND">{t('filter_found')}</option>
          <option value="RECOVERED">{t('stat_recovered')}</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-ink/20 rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay">
          <option value="">{t('all_categories')}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {loading || items === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse border border-ink/15 bg-cream rounded-lg overflow-hidden">
              <div className="w-full h-36 bg-paper" />
              <div className="px-4 py-3 space-y-2">
                <div className="h-3 w-16 bg-paper rounded" />
                <div className="h-4 w-3/4 bg-paper rounded" />
                <div className="h-3 w-1/2 bg-paper rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center text-center py-14 border border-dashed border-ink/15 rounded-lg">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-ink/60 mb-4">{t('no_results')}</p>
          {hasFilters && (
            <button onClick={clearFilters} className="border border-ink/20 px-5 py-2 rounded-lg text-sm font-medium hover:border-clay hover:text-clay transition-colors">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
