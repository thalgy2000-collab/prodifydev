import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/** Tracks a page_view event on every route change and updates last_seen_at */
export const PageViewTracker = () => {
  const { track } = useAnalytics();
  const { user } = useAuth();
  const location = useLocation();
  const prev = useRef<string | null>(null);
  const lastTouch = useRef<number>(0);

  useEffect(() => {
    const path = location.pathname;
    if (path === prev.current) return;
    prev.current = path;
    track('page_view', { page: path });

    if (user && Date.now() - lastTouch.current > 5 * 60 * 1000) {
      lastTouch.current = Date.now();
      (supabase.rpc as any)('touch_last_seen').then(() => {});
    }
  }, [location.pathname, track, user]);

  return null;
};
