import { useEffect, useState } from 'react';
import api from '../services/api';

const SHOW_DELAY_MS = 2500;
const MAX_WAIT_MS = 60000;

export default function BackendWakeUp({ children }) {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    let settled = false;

    const showTimer = setTimeout(() => {
      if (!settled) setShowOverlay(true);
    }, SHOW_DELAY_MS);

    const maxWaitTimer = setTimeout(() => {
      settled = true;
      setShowOverlay(false);
    }, MAX_WAIT_MS);

    api.get('/rwanda/categories')
      .catch(() => {})
      .finally(() => {
        settled = true;
        clearTimeout(showTimer);
        clearTimeout(maxWaitTimer);
        setShowOverlay(false);
      });

    return () => {
      clearTimeout(showTimer);
      clearTimeout(maxWaitTimer);
    };
  }, []);

  return (
    <>
      {children}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-hills/20 border-t-hills" />
          <div className="text-xl font-semibold tracking-tight text-hills">MIZERO</div>
          <p className="max-w-sm text-sm text-ink/70">
            Waking up the demo server — this can take up to a minute on the first visit.
          </p>
        </div>
      )}
    </>
  );
}
