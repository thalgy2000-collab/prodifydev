import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduleActivity } from '@/types/schedule';
import { toast } from 'sonner';

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink?: string;
  location?: string | null;
}

const GCAL_PREFIX = 'gcal:';

export const isGoogleEventId = (id: string) => id.startsWith(GCAL_PREFIX);

function toActivity(ev: GoogleCalendarEvent): ScheduleActivity {
  const start = new Date(ev.start);
  const end = ev.end ? new Date(ev.end) : null;
  const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return {
    id: GCAL_PREFIX + ev.id,
    title: '🗓 ' + ev.title,
    description: ev.description || (ev.htmlLink ? `Ver no Google: ${ev.htmlLink}` : ''),
    activityDate: date,
    startTime: ev.allDay ? undefined : fmt(start),
    endTime: ev.allDay || !end ? undefined : fmt(end),
    status: 'pending',
    createdAt: ev.start,
  };
}

export function useGoogleCalendar() {
  const { user, session } = useAuth();
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [events, setEvents] = useState<ScheduleActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) { setConnected(false); setEvents([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-events');
      if (error) throw error;
      if (data?.connected) {
        setConnected(true);
        setEmail(data.email || null);
        setEvents((data.events as GoogleCalendarEvent[]).map(toActivity));
      } else {
        setConnected(false);
        setEmail(null);
        setEvents([]);
      }
    } catch (e: any) {
      console.error('[gcal] fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Refresh on window focus (after returning from OAuth callback tab)
  useEffect(() => {
    const onFocus = () => fetchEvents();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchEvents]);

  const connect = useCallback(async () => {
    if (!session) {
      toast.error('Faça login novamente.');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { returnUrl: window.location.href },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
        toast.info('Autorize no Google e volte para esta aba.');
      }
    } catch (e: any) {
      toast.error('Falha ao iniciar conexão: ' + (e.message || 'erro'));
    }
  }, [session]);

  const disconnect = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('google-calendar-disconnect');
      if (error) throw error;
      setConnected(false);
      setEmail(null);
      setEvents([]);
      toast.success('Google Calendar desconectado.');
    } catch (e: any) {
      toast.error('Falha ao desconectar: ' + (e.message || 'erro'));
    }
  }, []);

  return { connected, email, events, loading, connect, disconnect, refresh: fetchEvents };
}
