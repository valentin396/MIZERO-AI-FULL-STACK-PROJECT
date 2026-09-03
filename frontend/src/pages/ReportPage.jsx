import { Link } from 'react-router-dom';
import ReportForm from '../components/ReportForm.jsx';

export default function ReportPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Report an item</h1>
          <p className="text-ink/60">Fill in whichever form applies — MIZERO checks it against everything else on file.</p>
        </div>
        <Link to="/dashboard/chat" className="text-sm text-clay hover:underline whitespace-nowrap ml-4">Prefer to chat instead? →</Link>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div id="lost"><ReportForm status="LOST" /></div>
        <div id="found"><ReportForm status="FOUND" /></div>
      </div>
    </div>
  );
}
