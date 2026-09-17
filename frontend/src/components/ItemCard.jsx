import { Link } from 'react-router-dom';

const STATUS_STYLE = {
  LOST: 'bg-clay/10 text-clay',
  FOUND: 'bg-blueinfo/10 text-blueinfo',
  RECOVERED: 'bg-hills/10 text-hills',
  CLOSED: 'bg-ink/10 text-ink/40',
};

const CATEGORY_EMOJI = {
  Smartphone: '📱', Laptop: '💻', Tablet: '📱', Earphones: '🎧', Smartwatch: '⌚',
  'National ID': '🪪', Passport: '🛂', 'Driving License': '🪪', 'Student ID': '🪪', 'Bank Card': '💳',
  Backpack: '🎒', Wallet: '👛', Keys: '🔑', Clothes: '👕', Jewelry: '💍',
  Other: '📦',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export default function ItemCard({ item }) {
  const statusClass = STATUS_STYLE[item.status] || STATUS_STYLE.CLOSED;
  const emoji = CATEGORY_EMOJI[item.category] || '📦';

  return (
    <Link
      to={`/items/${item.id}`}
      className="group block border border-ink/15 bg-cream rounded-lg overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-clay"
    >
      <div className="w-full h-36 bg-paper overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">{emoji}</div>
        )}
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${statusClass}`}>
            {item.status}
          </span>
          <span className="text-xs text-ink/40">{timeAgo(item.event_date || item.created_at)}</span>
        </div>
        <h3 className="font-medium leading-snug mb-1 truncate">{item.title}</h3>
        <p className="text-sm text-ink/60 truncate">
          {item.location}{item.landmark ? `, ${item.landmark}` : ''}
        </p>
      </div>
    </Link>
  );
}
