import { useLanguage } from '../services/language.jsx';

export default function Contact() {
  const { t } = useLanguage();
  return (
    <div className="max-w-md mx-auto px-6 py-14">
      <h1 className="text-3xl font-semibold mb-2">{t('contact_title')}</h1>
      <p className="text-ink/60 mb-8">
        This is a graduation project demo — for a real deployment, this page
        would route to support staff or a district coordinator.
      </p>
      <div className="border border-ink/15 bg-cream p-5 text-sm space-y-2">
        <p><span className="text-ink/50">Project:</span> MIZERO</p>
        <p><span className="text-ink/50">Type:</span> Graduation project — AI-powered lost &amp; found platform</p>
        <p><span className="text-ink/50">Focus:</span> Rwanda, all 30 districts</p>
      </div>
    </div>
  );
}