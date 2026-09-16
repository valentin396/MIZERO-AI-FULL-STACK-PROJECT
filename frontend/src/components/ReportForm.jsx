import { useState } from 'react';
import api from '../services/api';
import { useDistricts, useCategories } from '../services/rwanda.js';
import { useLanguage } from '../services/language.jsx';

export default function ReportForm({ status }) {
  const { t } = useLanguage();
  const districts = useDistricts();
  const categories = useCategories();

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let image_url, image_hash;
      if (file) {
        const form = new FormData();
        form.append('file', file);
        const res = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        image_url = res.data.url;
        image_hash = res.data.hash;
      }

      const res = await api.post('/items', {
        status, category: category || categories[0], title, description, color,
        location: location || districts[0]?.name,
        event_date: date, event_time: time || null,
        image_url, image_hash,
      });
      setDone(res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="border border-ink/15 bg-cream p-6 text-center">
        <p className="font-medium text-hills mb-2">✓</p>
        <a href={`/items/${done}`} className="text-sm text-clay hover:underline">View your report →</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-ink/15 bg-cream p-5 space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {status === 'LOST' ? '←' : '→'} {status === 'LOST' ? t('report_lost_item') : t('report_found_item')}
      </h2>

      <div>
        <label className="block text-xs text-ink/50 mb-1">{t('category_label')}</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-ink/20 px-3 py-2 bg-cream text-sm">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-ink/50 mb-1">{t('title_label')}</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={status === 'LOST' ? 'e.g. Samsung Galaxy S23' : 'e.g. Samsung Galaxy phone'}
          className="w-full border border-ink/20 px-3 py-2 bg-cream text-sm" />
      </div>
      <div>
        <label className="block text-xs text-ink/50 mb-1">{t('description_label')}</label>
        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Black Samsung Galaxy S23 phone."
          className="w-full border border-ink/20 px-3 py-2 bg-cream text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink/50 mb-1">{t('color_label')}</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black"
            className="w-full border border-ink/20 px-3 py-2 bg-cream text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1">{t('location_label')}</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border border-ink/20 px-3 py-2 bg-cream text-sm">
            {districts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink/50 mb-1">{t('date_label')}</label>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full border border-ink/20 px-3 py-2 bg-cream text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1">{t('time_label')}</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="w-full border border-ink/20 px-3 py-2 bg-cream text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-ink/50 mb-1">{t('upload_image')}</label>
        <div className="flex items-center gap-3">
          {preview ? (
            <img src={preview} alt="preview" className="w-16 h-16 object-cover border border-ink/15" />
          ) : (
            <div className="w-16 h-16 border border-dashed border-ink/20 flex items-center justify-center text-ink/30 text-xs">none</div>
          )}
          <label className="text-xs text-clay cursor-pointer hover:underline">
            {preview ? '+ Replace' : '+ Add photo'}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-clay-dark">{error}</p>}

      <button type="submit" disabled={submitting}
        className={`w-full text-cream py-2.5 rounded-lg font-medium uppercase text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-60 ${status === 'LOST' ? 'bg-clay' : 'bg-hills'}`}>
        {submitting ? '…' : t('submit_report')}
      </button>
    </form>
  );
}