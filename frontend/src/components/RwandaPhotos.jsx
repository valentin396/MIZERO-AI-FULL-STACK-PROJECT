import { useState } from 'react';
import { useLanguage } from '../services/language.jsx';

const CANDIDATES = [
  { file: 'kigali.jpg', caption: 'Kigali' },
  { file: 'nyabugogo.jpg', caption: 'Nyabugogo' },
  { file: 'market.jpg', caption: 'Local market' },
  { file: 'community-1.jpg', caption: 'Community' },
  { file: 'community-2.jpg', caption: 'Community' },
  { file: 'community-3.jpg', caption: 'Community' },
];

export default function RwandaPhotos() {
  const { t } = useLanguage();
  const [failed, setFailed] = useState({});

  const visible = CANDIDATES.filter((c) => !failed[c.file]);
  if (visible.length === 0) return null;

  return (
    <section className="border-t border-line">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold mb-1">{t('rwanda_photos_title')}</h2>
        <p className="text-ink/60 text-sm mb-6">{t('rwanda_photos_sub')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {visible.map((p) => (
          <div key={p.file} className="relative h-40 md:h-56">
            <img
              src={`/images/community/${p.file}`}
              alt={p.caption}
              className="w-full h-full object-cover"
              onError={() => setFailed((f) => ({ ...f, [p.file]: true }))}
            />
            <span className="absolute bottom-2 left-2 text-xs text-cream bg-ink/60 px-2 py-0.5">
              {p.caption}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}