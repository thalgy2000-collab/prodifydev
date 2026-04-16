import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

/** Tracks a page_view event on every route change */
export const PageViewTracker = () => {
  const { track } = useAnalytics();
  const location = useLocation();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (path === prev.current) return;
    prev.current = path;
    track('page_view', { page: path });
  }, [location.pathname, track]);

  return null;
};
