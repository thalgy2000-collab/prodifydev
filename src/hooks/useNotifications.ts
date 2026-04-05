import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); return; }
    setLoading(true);
    const { data } = await (supabase.from('notifications') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data.map((d: any) => ({
        id: d.id,
        title: d.title,
        message: d.message,
        type: d.type,
        read: d.read,
        actionUrl: d.action_url,
        metadata: d.metadata,
        createdAt: d.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    await (supabase.from('notifications') as any)
      .update({ read: true })
      .eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await (supabase.from('notifications') as any)
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [user]);

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead };
};
