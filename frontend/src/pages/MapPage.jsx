import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCategories } from '../services/rwanda.js';
import { useLanguage } from '../services/language.jsx';
import 'leaflet/dist/leaflet.css';

const redIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  className: 'filter hue-rotate-[330deg] saturate-200',
});
const greenIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  className: 'filter hue-rotate-[90deg]',
});

export default function MapPage() {
  const { t } = useLanguage();
  const categories = useCategories();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [category, setCategory] = useState('');

  useEffect(() => {
    api.get('/rwanda/map-items').then((res) => setItems(res.data)).catch(() => setItems([]));
  }, []);

  const filtered = (items || [])
    .filter((i) => filter === 'ALL' || i.status === filter)
    .filter((i) => !category || i.category === category);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-1">{t('map_title')}</h1>
      <p className="text-ink/60 mb-4">{t('map_sub')}</p>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {['ALL', 'LOST', 'FOUND'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === f ? (f === 'LOST' ? 'bg-clay text-cream' : f === 'FOUND' ? 'bg-hills text-cream' : 'bg-ink text-cream') : 'border border-ink/20 text-ink/60 hover:border-ink/40'
            }`}>
            {f === 'ALL' ? t('filter_all') : f === 'LOST' ? t('filter_lost') : t('filter_found')}
          </button>
        ))}
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="text-xs border border-ink/20 rounded-full px-3 py-1.5 bg-cream text-ink/60 ml-2">
          <option value="">{t('all_categories')}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {items === null ? (
        <div className="h-[600px] border border-ink/15 rounded-lg overflow-hidden animate-pulse bg-paper" />
      ) : (
        <div className="h-[600px] border border-ink/15 overflow-hidden">
          <MapContainer center={[-1.9403, 29.8739]} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filtered.map((item) => (
              <Marker key={item.id} position={[item.lat, item.lng]} icon={item.status === 'LOST' ? redIcon : greenIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.status} · {item.category} · {item.location}{item.landmark ? `, ${item.landmark}` : ''}</p>
                    <Link to={`/items/${item.id}`} className="text-xs text-green-700 underline">View details</Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}