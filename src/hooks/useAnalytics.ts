import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrackEventOptions {
  page?: string;
  properties?: Record<string, unknown>;
}

/** Fire-and-forget event tracking – never throws */
export const trackEvent = async (
  eventName: string,
  userId: string | undefined,
  options?: TrackEventOptions,
) => {
  if (!userId) return;
  try {
    await (supabase.from('events') as any).insert({
      event_name: eventName,
      user_id: userId,
      page: options?.page ?? null,
      properties: options?.properties ?? {},
    });
  } catch {
    // silently ignore – analytics should never break the app
  }
};

export const useAnalytics = () => {
  const { user } = useAuth();

  const track = useCallback(
    (eventName: string, options?: TrackEventOptions) => {
      trackEvent(eventName, user?.id, options);
    },
    [user],
  );

  return { track };
};
