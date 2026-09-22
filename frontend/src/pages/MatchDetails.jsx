import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../services/auth.jsx';
import { useLanguage } from '../services/language.jsx';
import ConfidenceRing from '../components/ConfidenceRing.jsx';
import BreakdownBar from '../components/BreakdownBar.jsx';
import VerificationForm from '../components/VerificationForm.jsx';

export default function MatchDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [match, setMatch] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh();
  }, [id]);

  function refresh() {
    return api.get(`/matches/${id}`).then((res) => setMatch(res.data));
  }

  if (!match) return <div className="max-w-3xl mx-auto px-6 py-12 text-ink/40">Loading…</div>;

  const isOwner = user && (match.lost_item.user_id === user.id || match.found_item.user_id === user.id);
  const isClaimant = user && match.lost_item.user_id === user.id;

  async function act(status) {
    setSaving(true);
    await api.patch(`/matches/${id}`, { status });
    await refresh();
    setSaving(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="text-xs uppercase tracking-wide text-ink/40 font-medium mb-1">Match Details</p>
      <p className="text-hills font-medium mb-4">Potential Match Found! 🎉</p>
      <h1 className="text-2xl font-semibold mb-8">{match.lost_item.title}</h1>

      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-6 items-center mb-10">
        <ItemMini label="Lost Item" item={match.lost_item} />
        <div className="flex justify-center"><ConfidenceRing percent={Math.round(match.final_score * 100)} /></div>
        <ItemMini label="Found Item" item={match.found_item} />
      </div>

      <div className="border border-ink/15 bg-cream p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Why MIZERO thinks this is a match</h2>
        <div className="space-y-3">
          <BreakdownBar label="Text Similarity" value={match.breakdown.text} />
          <BreakdownBar label="Location Similarity" value={match.breakdown.location} />
          <BreakdownBar label="Time Similarity" value={match.breakdown.time} />
          <BreakdownBar label="Image Similarity" value={match.breakdown.image} />
          <BreakdownBar label="Category Similarity" value={match.breakdown.category} />
        </div>
      </div>

      {isOwner ? (
        <div className="border border-ink/15 bg-cream p-6">
          <h2 className="text-lg font-semibold mb-1">What's Next?</h2>
          <p className="text-sm text-ink/60 mb-4">This is a potential match — verify with the person who reported the other item.</p>
          {match.status === 'rejected' ? (
            <p className="text-sm text-ink/50">You marked this as not a match.</p>
          ) : match.status === 'confirmed' && match.contact ? (
            <div className="border border-hills bg-hills/5 p-4">
              <p className="text-sm font-medium text-hills mb-1">{t('contact_details_title')}</p>
              <p className="text-sm">{match.contact.name}</p>
              {match.contact.phone && <p className="text-sm">{match.contact.phone}</p>}
              {match.contact.email && <p className="text-sm">{match.contact.email}</p>}
            </div>
          ) : match.status === 'confirmed' && match.verification?.required && isClaimant ? (
            <VerificationForm matchId={id} onPassed={() => refresh()} />
          ) : match.status === 'confirmed' && match.verification?.required ? (
            <div className="border border-ink/15 bg-paper p-4">
              <p className="text-sm font-medium mb-1">{t('verify_waiting_title')}</p>
              <p className="text-sm text-ink/60 mb-2">{t('verify_waiting_sub')}</p>
              <p className="text-xs text-ink/50">{match.verification.correct}/{match.verification.total}</p>
            </div>
          ) : match.status === 'confirmed' ? (
            <p className="text-sm text-ink/50">Loading contact details…</p>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => act('confirmed')} disabled={saving}
                className="flex-1 bg-hills text-cream py-2.5 rounded-lg font-medium uppercase text-sm tracking-wide hover:bg-hills-light transition-colors disabled:opacity-60">
                {saving ? 'Working…' : 'Contact Finder'}
              </button>
              <button onClick={() => act('rejected')} disabled={saving}
                className="flex-1 border border-clay text-clay py-2.5 rounded-lg font-medium uppercase text-sm tracking-wide hover:bg-clay hover:text-cream transition-colors disabled:opacity-60">
                Not My Item
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink/50">
          <Link to="/login" className="text-clay hover:underline">Log in</Link> with the account that filed one of these reports to act on this match.
        </p>
      )}
    </div>
  );
}

function ItemMini({ label, item }) {
  return (
    <div className="border border-ink/15 bg-cream p-4">
      <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">{label}</p>
      {item.image_url && <div className="w-full h-28 mb-3 bg-paper overflow-hidden"><img src={item.image_url} alt="" className="w-full h-full object-cover" /></div>}
      <Link to={`/items/${item.id}`} className="font-medium hover:text-clay block truncate">{item.title}</Link>
      <p className="text-xs text-ink/50 mt-1">{item.location}{item.landmark ? `, ${item.landmark}` : ''}</p>
    </div>
  );
}
