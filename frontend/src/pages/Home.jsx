import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../services/language.jsx';
import Reveal from '../components/Reveal.jsx';
import { NAV_HEIGHT } from '../components/Nav.jsx';
import RwandaPhotos from '../components/RwandaPhotos.jsx';
import PopularAreas from '../components/PopularAreas.jsx';
import StatsSection from '../components/StatsSection.jsx';
import ItemCard from '../components/ItemCard.jsx';

import heroMain from '../assets/images/mizero_homepage_image_assets_crops/hero-main.jpg';
import catPhone from '../assets/images/mizero_homepage_image_assets_crops/category-phone.jpg';
import catWallet from '../assets/images/mizero_homepage_image_assets_crops/category-wallet.jpg';
import catBackpack from '../assets/images/mizero_homepage_image_assets_crops/category-backpack..jpg';
import catKeys from '../assets/images/mizero_homepage_image_assets_crops/category-keys.jpg';
import catJacket from '../assets/images/mizero_homepage_image_assets_crops/category-jacket.jpg';
import locationKigali from '../assets/images/mizero_homepage_image_assets_crops/location-kigali.png';

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [recent, setRecent] = useState(null);
  const [heroQuery, setHeroQuery] = useState('');

  useEffect(() => {
    api.get('/items').then((res) => setRecent(res.data.slice(0, 6))).catch(() => setRecent([]));
  }, []);

  function handleHeroSearch(e) {
    e.preventDefault();
    const query = heroQuery.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  const CATEGORY_TILES = [
    { image: catPhone, title: t('cat_phones_title'), desc: t('cat_phones_desc'), href: '/search?category=Smartphone', linkLabel: t('view_items') },
    { image: catWallet, title: t('cat_wallets_title'), desc: t('cat_wallets_desc'), href: '/search?category=Wallet', linkLabel: t('view_items') },
    { image: catBackpack, title: t('cat_bags_title'), desc: t('cat_bags_desc'), href: '/search?category=Backpack', linkLabel: t('view_items') },
    { image: catKeys, title: t('cat_keys_title'), desc: t('cat_keys_desc'), href: '/search?category=Keys', linkLabel: t('view_items') },
    { image: catJacket, title: t('cat_clothing_title'), desc: t('cat_clothing_desc'), href: '/search?category=Clothes', linkLabel: t('view_items') },
    { image: locationKigali, title: t('cat_locations_title'), desc: t('cat_locations_desc'), href: '/map', linkLabel: t('view_locations') },
  ];

  const STEPS = [
    { n: 1, icon: <StepIconReport />, title: t('home_step1_title'), desc: t('home_step1_desc') },
    { n: 2, icon: <StepIconSearch />, title: t('home_step2_title'), desc: t('home_step2_desc') },
    { n: 3, icon: <StepIconContact />, title: t('home_step3_title'), desc: t('home_step3_desc') },
    { n: 4, icon: <StepIconReunite />, title: t('home_step4_title'), desc: t('home_step4_desc') },
  ];

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden" style={{ marginTop: -NAV_HEIGHT }}>
        <div className="absolute inset-0">
          <img
            src={heroMain}
            alt=""
            className="w-full h-full object-cover object-[68%_center]"
          />
          {/* Legibility scrim: strong on the left where text sits, fading
              toward the subject on the right so the photo stays visible
              and uncovered. */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-white/10 md:via-white/60 md:to-transparent" />
          {/* Extra band at the very top so the transparent nav stays legible
              regardless of what's behind it (sky/mountains here). */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent" />
        </div>

        {/* Floating accents — separate animated elements over the flat
            photo, since the icon cards baked into hero-main.jpg can't move
            on their own. */}
        <span className="hidden sm:block absolute top-24 right-[18%] w-3 h-3 rounded-full bg-hills ring-4 ring-hills/30 animate-pin-pulse" />
        <div className="hidden sm:flex absolute bottom-[30%] right-[6%] items-center gap-1.5 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-ink animate-bob">
          <CheckBadgeIcon /> Verified Match
        </div>
        <div className="hidden md:block absolute bottom-8 left-[8%] w-44 h-44 rounded-full bg-hills/25 blur-3xl animate-glow-ring" />

        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-24 md:pt-36 md:pb-36">
          <div className="max-w-xl">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 bg-white shadow-sm px-3 py-1.5 rounded-full text-xs font-medium text-ink mb-6">
                <HeartIcon /> {t('hero_pill')}
              </span>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.08] mb-4">
                <span className="text-ink">{t('hero_line1')}</span><br />
                <span className="text-hills">{t('hero_line2')}</span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="text-ink/70 max-w-md mb-3 leading-relaxed">{t('hero_sub')}</p>
            </Reveal>

            <Reveal delay={300}>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-8 inline-block border-b-2 border-hills pb-1">
                {t('hero_tag')}
              </p>
            </Reveal>

            <Reveal delay={400}>
              <form onSubmit={handleHeroSearch} className="flex mb-8 max-w-md">
                <input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder={t('hero_search_placeholder')}
                  className="flex-1 min-w-0 px-4 py-3 rounded-l-lg border border-ink/15 border-r-0 bg-white text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-hills/40 focus:border-hills transition-shadow"
                />
                <button
                  type="submit"
                  aria-label={t('hero_search_btn')}
                  className="bg-hills hover:bg-hills-light text-white px-5 rounded-r-lg flex items-center justify-center transition-colors active:scale-95"
                >
                  <ArrowIcon />
                </button>
              </form>
            </Reveal>

            <Reveal delay={500}>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink/70">
                <span className="flex items-center gap-1.5"><ShieldIcon /> {t('trust_safe')}</span>
                <span className="flex items-center gap-1.5"><BoltIcon /> {t('trust_fast')}</span>
                <span className="flex items-center gap-1.5"><UsersIcon /> {t('trust_community')}</span>
              </div>
            </Reveal>
          </div>
        </div>

        <p className="hidden md:block absolute bottom-6 right-8 italic text-white/90 text-lg drop-shadow-sm" style={{ fontFamily: 'Georgia, serif' }}>
          {t('hero_caption')}
        </p>
      </section>

      {/* ===== Category grid (overlaps the hero bottom edge) ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 md:-mt-14 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-ink/5 px-5 sm:px-8 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {CATEGORY_TILES.map((tile, i) => (
            <Reveal key={tile.title} delay={i * 80}>
              <Link to={tile.href} className="group block">
                <div className="rounded-xl overflow-hidden h-28 sm:h-32 mb-3 bg-paper transition-shadow group-hover:shadow-lg">
                  <img
                    src={tile.image}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="transition-transform duration-200 group-hover:-translate-y-1">
                  <p className="font-semibold text-sm sm:text-base text-ink mb-0.5">{tile.title}</p>
                  <p className="text-xs sm:text-sm text-ink/55 mb-1.5 leading-snug">{tile.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-hills">
                    {tile.linkLabel}
                    <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="relative overflow-hidden mt-16 md:mt-24">
        <div
          className="hidden md:block absolute -bottom-10 -right-10 w-[520px] h-[520px] bg-no-repeat bg-contain bg-bottom-right opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: `url(${locationKigali})` }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-4 grid lg:grid-cols-5 gap-12 items-start">
          <Reveal as="div" className="lg:col-span-2">
            <p className="text-hills font-semibold text-sm mb-3">{t('home_how_label')}</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink leading-tight mb-4">{t('home_how_title')}</h2>
            <p className="text-ink/65 leading-relaxed mb-6 max-w-sm">{t('home_how_desc')}</p>
            <Link
              to="/report"
              className="inline-block bg-hills text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-hills-light hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              {t('home_how_cta')}
            </Link>
          </Reveal>

          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-8">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 150}>
                <div>
                  <div
                    className="w-11 h-11 rounded-full bg-hills text-white flex items-center justify-center font-bold mb-3 animate-pop-bounce"
                    style={{ '--pop-delay': `${i * 150}ms` }}
                  >
                    {step.n}
                  </div>
                  <div className="text-hills mb-2">{step.icon}</div>
                  <p className="font-semibold text-ink mb-1">{step.title}</p>
                  <p className="text-sm text-ink/60 leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Reveal as="div" className="mt-16"><StatsSection /></Reveal>

      <div className="border-t border-line" />
      <Reveal as="div"><RwandaPhotos /></Reveal>

      <div className="border-t border-line" />
      <Reveal as="div"><PopularAreas /></Reveal>

      <div className="border-t border-line" />

      <section className="max-w-6xl mx-auto px-6 py-12">
        <Reveal>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-semibold">{t('recent_reports_title')}</h2>
            <Link to="/search" className="text-sm text-clay hover:underline">{t('browse_all')}</Link>
          </div>
        </Reveal>
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
            <Link to="/report#lost" className="bg-hills text-cream px-5 py-2 rounded-lg text-sm font-medium hover:bg-hills-light hover:shadow-md active:scale-[0.98] transition-all">
              {t('hero_lost_btn')}
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((item, i) => (
              <Reveal key={item.id} delay={(i % 3) * 80}>
                <ItemCard item={item} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#DC2626"><path d="M12 21s-6.7-4.35-9.3-8.1C.8 10 1.4 6.4 4.4 4.8c2.3-1.2 4.8-.4 6.1 1.4l1.5 2 1.5-2c1.3-1.8 3.8-2.6 6.1-1.4 3 1.6 3.6 5.2 1.7 8.1C18.7 16.65 12 21 12 21z"/></svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" /><polyline points="13 5 20 12 13 19" />
    </svg>
  );
}
function CheckBadgeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><polyline points="8 12.5 11 15.5 16 9.5" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3z" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#16A34A"><path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z"/></svg>
  );
}
function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function StepIconReport() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" /><rect x="5" y="4" width="14" height="18" rx="2" />
      <line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  );
}
function StepIconSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6.5" /><line x1="20" y1="20" x2="15.3" y2="15.3" />
      <path d="M10.5 8v5M8 10.5h5" strokeWidth="1.4" />
    </svg>
  );
}
function StepIconContact() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function StepIconReunite() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6.7-4.35-9.3-8.1C.8 10 1.4 6.4 4.4 4.8c2.3-1.2 4.8-.4 6.1 1.4l1.5 2 1.5-2c1.3-1.8 3.8-2.6 6.1-1.4 3 1.6 3.6 5.2 1.7 8.1C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}
