export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 420 380" className="w-full h-auto" role="img" aria-label="Illustration of a backpack, phone, keys, and sunglasses">
      <ellipse cx="210" cy="345" rx="150" ry="18" fill="#16241C" opacity="0.06" />
      <rect x="120" y="90" width="160" height="200" rx="28" fill="#16A34A" />
      <rect x="145" y="190" width="110" height="80" rx="18" fill="#118A3E" />
      <path d="M150 195 H250" stroke="#0E7A37" strokeWidth="3" strokeDasharray="4 5" strokeLinecap="round" />
      <rect x="135" y="70" width="130" height="50" rx="18" fill="#22C55E" />
      <path d="M150 110 C130 160, 130 250, 150 300" stroke="#0E7A37" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M250 110 C270 160, 270 250, 250 300" stroke="#0E7A37" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M180 72 C180 55, 220 55, 220 72" stroke="#0E7A37" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="200" cy="230" r="10" fill="#0E7A37" />
      <g transform="translate(70 190) rotate(-8)">
        <rect x="0" y="0" width="62" height="120" rx="10" fill="#16241C" />
        <rect x="6" y="10" width="50" height="90" rx="4" fill="#DCEFE3" />
        <circle cx="31" cy="108" r="4" fill="#3A4A41" />
      </g>
      <g transform="translate(255 220)">
        <circle cx="0" cy="0" r="10" fill="none" stroke="#D97706" strokeWidth="4" />
        <rect x="4" y="-3" width="26" height="6" rx="3" fill="#D97706" />
        <rect x="26" y="-6" width="4" height="6" fill="#D97706" />
        <rect x="34" y="-6" width="4" height="9" fill="#D97706" />
      </g>
      <g transform="translate(150 300)">
        <rect x="0" y="6" width="34" height="24" rx="12" fill="#16241C" />
        <rect x="46" y="6" width="34" height="24" rx="12" fill="#16241C" />
        <path d="M34 16 H46" stroke="#16241C" strokeWidth="5" />
        <path d="M0 12 C-14 6, -14 24, 0 24" stroke="#16241C" strokeWidth="5" fill="none" />
        <path d="M80 12 C94 6, 94 24, 80 24" stroke="#16241C" strokeWidth="5" fill="none" />
      </g>
      <g transform="translate(300 40)">
        <path d="M20 0 C31 0, 40 9, 40 20 C40 35, 20 55, 20 55 C20 55, 0 35, 0 20 C0 9, 9 0, 20 0 Z" fill="#D97706" />
        <circle cx="20" cy="20" r="8" fill="#FFF7EC" />
      </g>
    </svg>
  );
}
