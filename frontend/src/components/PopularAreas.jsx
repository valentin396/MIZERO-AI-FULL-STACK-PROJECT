import { useEffect, useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../services/language.jsx';

export default function PopularAreas() {
  const { t } = useLanguage();
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    api.get('/rwanda/popular-areas').then((res) => setAreas(res.data)).catch(() => {});
  }, []);

  if (areas.length === 0) return null;

  const max = Math.max(...areas.map((a) => a.count));

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-xl font-semibold mb-1">{t('popular_areas_title')}</h2>
      <p className="text-ink/60 text-sm mb-6">{t('popular_areas_sub')}</p>
      <div className="space-y-2">
        {areas.map((a) => (
          <div key={a.location} className="flex items-center gap-4">
            <span className="w-28 text-sm flex-shrink-0">{a.location}</span>
            <div className="flex-1 h-2 bg-paper rounded-full overflow-hidden">
              <div className="h-full bg-hills rounded-full" style={{ width: `${(a.count / max) * 100}%` }} />
            </div>
            <span className="w-8 text-sm text-ink/60 text-right flex-shrink-0">{a.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}