import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  lastSeenAt: string | null;
  isAdmin: boolean;
  isActive: boolean;
  productsCount: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  emoji: string;
  ownerId: string;
  ownerName: string | null;
  membersCount: number;
  tasksCount: number;
  createdAt: string;
}

export interface AdminEvent {
  id: string;
  eventName: string;
  userId: string | null;
  userEmail: string | null;
  page: string | null;
  properties: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminInvite {
  id: string;
  email: string;
  productId: string;
  productName: string | null;
  status: string;
  createdAt: string | null;
  expiresAt: string | null;
}

export interface AdminMetrics {
  totalUsers: number;
  totalProducts: number;
  activeUsers7d: number;
  totalEvents: number;
}

export function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics>({ totalUsers: 0, totalProducts: 0, activeUsers7d: 0, totalEvents: 0 });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, productsRes, membersRes, tasksRes, eventsRes, invitesRes] = await Promise.all([
        (supabase.from('profiles') as any).select('id, email, display_name, full_name, avatar_url, created_at, last_seen_at, is_admin, is_active'),
        supabase.from('products').select('id, name, emoji, owner_id, created_at').order('created_at', { ascending: false }),
        supabase.from('product_members').select('product_id, user_id'),
        supabase.from('backlog_tasks').select('product_id'),
        supabase.from('events').select('id, event_name, user_id, page, properties, created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('product_invites').select('id, email, product_id, status, created_at, expires_at').eq('status', 'pending').order('created_at', { ascending: false }),
      ]);

      const profiles = (profilesRes.data ?? []) as any[];
      const productsData = (productsRes.data ?? []) as any[];
      const members = (membersRes.data ?? []) as any[];
      const tasks = (tasksRes.data ?? []) as any[];
      const eventsData = (eventsRes.data ?? []) as any[];
      const invitesData = (invitesRes.data ?? []) as any[];

      const profilesById = new Map(profiles.map(p => [p.id, p]));

      // Products per user (as owner)
      const productsByOwner = new Map<string, number>();
      productsData.forEach(p => productsByOwner.set(p.owner_id, (productsByOwner.get(p.owner_id) ?? 0) + 1));

      // Members per product
      const membersByProduct = new Map<string, number>();
      members.forEach(m => membersByProduct.set(m.product_id, (membersByProduct.get(m.product_id) ?? 0) + 1));

      // Tasks per product
      const tasksByProduct = new Map<string, number>();
      tasks.forEach(t => tasksByProduct.set(t.product_id, (tasksByProduct.get(t.product_id) ?? 0) + 1));

      const mappedUsers: AdminUser[] = profiles.map(p => ({
        id: p.id,
        email: p.email,
        displayName: p.display_name,
        fullName: p.full_name,
        avatarUrl: p.avatar_url,
        createdAt: p.created_at,
        lastSeenAt: p.last_seen_at,
        isAdmin: !!p.is_admin,
        isActive: p.is_active !== false,
        productsCount: productsByOwner.get(p.id) ?? 0,
      }));

      const mappedProducts: AdminProduct[] = productsData.map(p => {
        const owner = profilesById.get(p.owner_id);
        return {
          id: p.id,
          name: p.name,
          emoji: p.emoji ?? '📦',
          ownerId: p.owner_id,
          ownerName: owner?.display_name ?? owner?.full_name ?? owner?.email ?? '—',
          membersCount: membersByProduct.get(p.id) ?? 0,
          tasksCount: tasksByProduct.get(p.id) ?? 0,
          createdAt: p.created_at,
        };
      });

      const mappedEvents: AdminEvent[] = eventsData.map(e => {
        const u = e.user_id ? profilesById.get(e.user_id) : null;
        return {
          id: e.id,
          eventName: e.event_name,
          userId: e.user_id,
          userEmail: u?.email ?? null,
          page: e.page,
          properties: e.properties,
          createdAt: e.created_at,
        };
      });

      const productsByIdMap = new Map(productsData.map(p => [p.id, p.name]));
      const mappedInvites: AdminInvite[] = invitesData.map(i => ({
        id: i.id,
        email: i.email,
        productId: i.product_id,
        productName: productsByIdMap.get(i.product_id) ?? null,
        status: i.status,
        createdAt: i.created_at,
        expiresAt: i.expires_at,
      }));

      // Active users in last 7 days (by event)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const activeIds = new Set<string>();
      eventsData.forEach(e => {
        if (e.user_id && e.created_at && new Date(e.created_at).getTime() >= sevenDaysAgo) {
          activeIds.add(e.user_id);
        }
      });

      // Total events count (separate query for accuracy)
      const { count: eventsCount } = await (supabase.from('events') as any).select('id', { count: 'exact', head: true });

      setUsers(mappedUsers);
      setProducts(mappedProducts);
      setEvents(mappedEvents);
      setInvites(mappedInvites);
      setMetrics({
        totalUsers: profiles.length,
        totalProducts: productsData.length,
        activeUsers7d: activeIds.size,
        totalEvents: eventsCount ?? eventsData.length,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleActive = async (userId: string, isActive: boolean) => {
    await (supabase.from('profiles') as any).update({ is_active: isActive }).eq('id', userId);
    await fetchAll();
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    await (supabase.from('profiles') as any).update({ is_admin: isAdmin }).eq('id', userId);
    await fetchAll();
  };

  const deleteProduct = async (productId: string) => {
    await supabase.from('products').delete().eq('id', productId);
    await fetchAll();
  };

  const cancelInvite = async (inviteId: string) => {
    await supabase.from('product_invites').delete().eq('id', inviteId);
    await fetchAll();
  };

  return { loading, metrics, users, products, events, invites, refetch: fetchAll, toggleActive, toggleAdmin, deleteProduct, cancelInvite };
}
