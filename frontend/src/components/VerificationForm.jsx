import { useEffect, useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../services/language.jsx';

export default function VerificationForm({ matchId, onPassed }) {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/matches/${matchId}/verification`).then((res) => setQuestions(res.data.questions));
  }, [matchId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        answers: questions.map((q) => ({ id: q.id, answer: answers[q.id] || '' })),
      };
      const res = await api.post(`/matches/${matchId}/verification`, payload);
      setResult(res.data);
      if (res.data.passed && res.data.contact) onPassed(res.data.contact);
    } finally {
      setSubmitting(false);
    }
  }

  if (!questions) return <p className="text-sm text-ink/40">Loading…</p>;

  return (
    <div className="border border-ochre bg-ochre/5 p-5">
      <h2 className="text-lg font-semibold mb-1">{t('verify_gate_title')}</h2>
      <p className="text-sm text-ink/60 mb-4">{t('verify_gate_sub')}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {questions.map((q) => (
          <div key={q.id}>
            <label className="block text-xs text-ink/50 mb-1">{q.question}</label>
            <input
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              className="w-full border border-ink/20 px-3 py-2 bg-cream text-sm"
              disabled={submitting}
            />
          </div>
        ))}
        <button type="submit" disabled={submitting}
          className="w-full bg-hills text-cream py-2.5 rounded-lg font-medium uppercase text-sm tracking-wide hover:bg-hills-light transition-colors disabled:opacity-60">
          {submitting ? '…' : t('verify_submit_btn')}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-3 text-sm font-medium ${result.passed ? 'bg-hills/10 text-hills' : 'bg-clay/10 text-clay-dark'}`}>
          {result.passed ? t('verify_result_pass') : t('verify_result_fail')} — {result.correct}/{result.total}
        </div>
      )}
    </div>
  );
}
