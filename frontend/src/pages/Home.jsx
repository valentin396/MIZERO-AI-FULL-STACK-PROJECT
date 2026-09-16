import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../services/language.jsx';
import HeroIllustration from '../components/HeroIllustration.jsx';
import RwandaPhotos from '../components/RwandaPhotos.jsx';
import PopularAreas from '../components/PopularAreas.jsx';

const STATUS_COLOR = { LOST: 'text-clay-dark', FOUND: 'text-blueinfo', RECOVERED: 'text-hills', CLOSED: 'text-ink/40' };

export default function Home() {
  const { t } = useLanguage();
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/items').then((res) => setRecent(res.data.slice(0, 6))).catch(() => {});
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
            <Link to="/report#lost" className="bg-ink text-cream px-6 py-3 rounded-lg font-medium text-sm tracking-wide hover:bg-ink/90 transition-colors">{t('hero_lost_btn')}</Link>
            <Link to="/report#found" className="border border-hills text-hills px-6 py-3 rounded-lg font-medium hover:bg-hills hover:text-cream transition-colors">{t('hero_found_btn')}</Link>
          </div>
        </div>
        <HeroIllustration />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="border border-ink/15 bg-cream p-5">
            <span className="w-9 h-9 rounded-full bg-hills/10 flex items-center justify-center text-lg mb-3">{f.icon}</span>
            <p className="font-medium mb-1">{f.title}</p>
            <p className="text-sm text-ink/60">{f.desc}</p>
          </div>
        ))}
      </section>

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
        {recent.length === 0 ? (
          <p className="text-ink/60">{t('nothing_reported')}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((item) => (
              <Link key={item.id} to={`/items/${item.id}`} className="block border border-ink/15 bg-cream px-5 py-4 hover:border-clay transition-colors">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`font-medium uppercase tracking-wide ${STATUS_COLOR[item.status]}`}>{item.status}</span>
                  <span className="text-ink/50">{item.category}</span>
                </div>
                <h3 className="text-lg font-medium leading-snug mb-1">{item.title}</h3>
                <p className="text-sm text-ink/60">{item.location}{item.landmark ? `, ${item.landmark}` : ''}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}