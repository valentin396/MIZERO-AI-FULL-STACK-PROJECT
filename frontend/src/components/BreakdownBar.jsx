export default function BreakdownBar({ label, value }) {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="w-40 text-ink/50">{label}</span>
        <span className="text-xs text-ink/30 italic">no photo to compare</span>
      </div>
    );
  }
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'bg-hills' : pct >= 50 ? 'bg-ochre' : 'bg-clay';
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 text-ink/60 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-paper rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-ink/70 font-medium">{pct}%</span>
    </div>
  );
}
