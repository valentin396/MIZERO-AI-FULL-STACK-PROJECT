import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../services/language.jsx';
import HeroIllustration from '../components/HeroIllustration.jsx';
import RwandaPhotos from '../components/RwandaPhotos.jsx';
import PopularAreas from '../components/PopularAreas.jsx';
import StatsSection from '../components/StatsSection.jsx';
import ItemCard from '../components/ItemCard.jsx';

export default function Home() {
  const { t } = useLanguage();
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    api.get('/items').then((res) => setRecent(res.data.slice(0, 6))).catch(() => setRecent([]));
  }, []);

  const FEATURES = [
    { icon: '🤖', title: t('feat_ai_title'), desc: t('feat_ai_desc') },
    { icon: '🌍', title: t('feat_multi_title'), desc: t('feat_multi_desc') },
    { icon: '🔒', title: t('feat_secure_title'), desc: t('feat_secure_desc') },
    { icon: '🇷🇼', title: t('feat_rwanda_title'), desc: t('feat_rwanda_desc') },
  ];

  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-14 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold leading-[1.1] mb-4">
            <span className="text-ink">{t('hero_line1')}</span><br />
            <span className="text-hills">{t('hero_line2')}</span>
          </h1>
          <p className="text-ink/70 max-w-md mb-2 leading-relaxed">{t('hero_sub')}</p>
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-8 underline">{t('hero_tag')}</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/report#lost" className="bg-ink text-cream px-6 py-3 rounded-lg font-medium text-sm tracking-wide hover:bg-ink/90 hover:shadow-md active:scale-[0.98] transition-all">{t('hero_lost_btn')}</Link>
            <Link to="/report#found" className="border border-hills text-hills px-6 py-3 rounded-lg font-medium hover:bg-hills hover:text-cream hover:shadow-md active:scale-[0.98] transition-all">{t('hero_found_btn')}</Link>
          </div>
        </div>
        <div className="animate-float">
          <HeroIllustration />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="border border-ink/15 bg-cream rounded-lg p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <span className="w-9 h-9 rounded-full bg-hills/10 flex items-center justify-center text-lg mb-3">{f.icon}</span>
            <p className="font-medium mb-1">{f.title}</p>
            <p className="text-sm text-ink/60">{f.desc}</p>
          </div>
        ))}
      </section>

      <StatsSection />

      <div className="border-t border-line" />
      <RwandaPhotos />

      <div className="border-t border-line" />
      <PopularAreas />

      <div className="border-t border-line" />

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-semibold">{t('recent_reports_title')}</h2>
          <Link to="/search" className="text-sm text-clay hover:underline">{t('browse_all')}</Link>
        </div>
        {recent === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
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
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center text-center py-14 border border-dashed border-ink/15 rounded-lg">
            <span className="text-4xl mb-3">🗂️</span>
            <p className="text-ink/60 mb-4">{t('nothing_reported')}</p>
            <Link to="/report" className="bg-hills text-cream px-5 py-2 rounded-lg text-sm font-medium hover:bg-hills-light hover:shadow-md active:scale-[0.98] transition-all">
              {t('hero_lost_btn')}
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
