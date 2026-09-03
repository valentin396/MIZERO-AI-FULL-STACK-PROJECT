const STEPS = [
  { title: '1. Report in under two minutes', desc: 'Answer a short chat or fill a form — real Rwandan districts, not free typing.' },
  { title: '2. MIZERO checks it against everything on file', desc: 'Five independent signals: text, category, district, date, and visual similarity.' },
  { title: '3. See exactly why a match was suggested', desc: 'No black box — every match shows a confidence breakdown by signal.' },
  { title: '4. Confirm and reconnect', desc: '"Contact Finder" reveals the other party\'s details once confirmed.' },
];

export default function HowItWorks() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-semibold mb-2">How it works</h1>
      <p className="text-ink/60 mb-10">From reporting to reunited, in four steps.</p>
      <div className="space-y-6">
        {STEPS.map((s) => (
          <div key={s.title} className="border border-ink/15 bg-cream p-5">
            <p className="font-medium mb-1">{s.title}</p>
            <p className="text-sm text-ink/60">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
