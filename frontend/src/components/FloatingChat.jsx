import { useState } from 'react';
import { useAuth } from '../services/auth.jsx';
import ChatBot from './ChatBot.jsx';

export default function FloatingChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 z-50 border border-ink/15 bg-cream shadow-xl flex flex-col overflow-hidden" style={{ height: 480 }}>
          <div className="flex items-center justify-between px-4 py-3 bg-hills text-cream">
            <div>
              <p className="font-medium text-sm">MIZERO AI Assistant</p>
              <p className="text-xs flex items-center gap-1 opacity-90"><span className="w-1.5 h-1.5 rounded-full bg-cream inline-block" /> Online</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-cream/80 hover:text-cream text-lg leading-none">&times;</button>
          </div>
          <div className="flex-1 min-h-0"><ChatBot /></div>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-hills text-cream shadow-lg flex items-center justify-center text-2xl hover:bg-hills-light transition-colors">
        {open ? '×' : '💬'}
      </button>
    </>
  );
}
