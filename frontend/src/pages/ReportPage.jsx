import { Link } from 'react-router-dom';
import ReportForm from '../components/ReportForm.jsx';
import { useLanguage } from '../services/language.jsx';

export default function ReportPage() {
  const { t } = useLanguage();
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2">{t('report_title')}</h1>
          <p className="text-ink/60">{t('report_sub')}</p>
        </div>
        <Link to="/dashboard/chat" className="text-sm text-clay hover:underline whitespace-nowrap ml-4">{t('prefer_chat')}</Link>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div id="lost"><ReportForm status="LOST" /></div>
        <div id="found"><ReportForm status="FOUND" /></div>
      </div>
    </div>
  );
}