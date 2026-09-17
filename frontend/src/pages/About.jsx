import { useLanguage } from '../services/language.jsx';
import BreakdownBar from '../components/BreakdownBar.jsx';

const SIGNALS = [
  { label: 'Text similarity', value: 0.30 },
  { label: 'Location', value: 0.25 },
  { label: 'Time', value: 0.20 },
  { label: 'Image similarity', value: 0.15 },
  { label: 'Category', value: 0.10 },
];

const STACK = [
  { label: 'Frontend', value: 'React + Vite + Tailwind CSS' },
  { label: 'Backend', value: 'FastAPI (Python)' },
  { label: 'Database', value: 'PostgreSQL via SQLAlchemy' },
  { label: 'Matching', value: 'TF-IDF, perceptual hashing, rule-based scoring' },
];

const ROADMAP = [
  'A real NLP-powered chatbot for guided reporting',
  'Object recognition on uploaded photos',
  'Ownership-verification questions before contact info is shared',
  'An admin dashboard with charts and moderation tools',
];

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-semibold mb-4">{t('about_title')}</h1>
      <p className="text-ink/70 leading-relaxed mb-4">
        MIZERO — Kinyarwanda for "zero," as in zero lost items left unclaimed — is a graduation
        project built as a conversational, AI-assisted lost-and-found platform for Rwanda.
      </p>
      <p className="text-ink/70 leading-relaxed mb-10">
        The matching engine is built from scratch — TF-IDF text similarity, perceptual image
        hashing, and date/category/location signals — so every suggested match can be explained
        in plain language, not just handed down as an opaque score.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">How matching is scored</h2>
        <div className="space-y-3">
          {SIGNALS.map((s) => (
            <BreakdownBar key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Built with</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {STACK.map((s) => (
            <div key={s.label} className="border border-ink/15 bg-cream rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-ink/40 mb-1">{s.label}</p>
              <p className="text-sm text-ink/80">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">What's next</h2>
        <ul className="space-y-2">
          {ROADMAP.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ink/70">
              <span className="text-hills mt-0.5">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
