import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FrequentPage {
  page: string;
  count: number;
  label: string;
  icon: string;
  category: string;
}

const routeMap: Record<string, { label: string; icon: string; category: string }> = {
  '/backlog':             { label: 'Backlog',       icon: '📋', category: 'Delivery' },
  '/okrs':                { label: 'OKRs',          icon: '🎯', category: 'Planejamento' },
  '/sprints':             { label: 'Sprints',       icon: '⚡', category: 'Delivery' },
  '/roadmap':             { label: 'Roadmap',       icon: '🗺️', category: 'Planejamento' },
  '/rice':                { label: 'RICE',          icon: '📐', category: 'Priorização' },
  '/agenda':              { label: 'Agenda',        icon: '📅', category: 'Planejamento' },
  '/oportunidades':       { label: 'Oportunidades', icon: '🌳', category: 'Discovery' },
  '/analises':            { label: 'Análises',      icon: '📊', category: 'Análises' },
  '/concorrencia':        { label: 'Concorrência',  icon: '🏆', category: 'Discovery' },
  '/swot':                { label: 'SWOT',          icon: '📊', category: 'Discovery' },
  '/membros':             { label: 'Membros',       icon: '👥', category: 'Membros' },
  '/produto-agenda':      { label: 'Agenda',        icon: '📅', category: 'Planejamento' },
  '/discovery/pesquisas': { label: 'Pesquisas',     icon: '🔍', category: 'Discovery' },
  '/discovery/personas':  { label: 'Personas',      icon: '👤', category: 'Discovery' },
  '/discovery/hipoteses': { label: 'Hipóteses',     icon: '🧪', category: 'Discovery' },
  '/discovery/csd':       { label: 'Matriz CSD',    icon: '🧩', category: 'Discovery' },
  '/historico':           { label: 'Histórico',     icon: '📜', category: 'Delivery' },
};

const defaultPages: FrequentPage[] = [
  { page: '/backlog', count: 0, label: 'Backlog',  icon: '📋', category: 'Delivery' },
  { page: '/okrs',    count: 0, label: 'OKRs',     icon: '🎯', category: 'Planejamento' },
  { page: '/sprints', count: 0, label: 'Sprints',  icon: '⚡', category: 'Delivery' },
  { page: '/roadmap', count: 0, label: 'Roadmap',  icon: '🗺️', category: 'Planejamento' },
];

export function useFrequentPages(limit: number = 4) {
  const { user } = useAuth();
  const [pages, setPages] = useState<FrequentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    const fetchPages = async () => {
      if (!user) {
        setPages(defaultPages.slice(0, limit));
        setIsDefault(true);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: events, error } = await (supabase.from('events') as any)
          .select('page')
          .eq('user_id', user.id)
          .eq('event_name', 'page_view')
          .gte('created_at', thirtyDaysAgo)
          .not('page', 'is', null);

        if (error || !events || events.length === 0) {
          setPages(defaultPages.slice(0, limit));
          setIsDefault(true);
          setLoading(false);
          return;
        }

        // Count frequency per page, only for known routes
        const pageCounts: Record<string, number> = {};
        for (const e of events) {
          const page = e.page as string;
          if (routeMap[page]) {
            pageCounts[page] = (pageCounts[page] || 0) + 1;
          }
        }

        if (Object.keys(pageCounts).length === 0) {
          setPages(defaultPages.slice(0, limit));
          setIsDefault(true);
          setLoading(false);
          return;
        }

        // Sort by frequency desc, take top N
        const sorted = Object.entries(pageCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([page, count]) => ({
            page,
            count,
            ...routeMap[page],
          }));

        // If less than limit, fill with suggestions
        if (sorted.length < limit) {
          const usedRoutes = new Set(sorted.map(s => s.page));
          const suggestions = defaultPages.filter(d => !usedRoutes.has(d.page));
          while (sorted.length < limit && suggestions.length > 0) {
            sorted.push(suggestions.shift()!);
          }
        }

        setPages(sorted);
        setIsDefault(false);
      } catch (err) {
        console.error('Error fetching frequent pages:', err);
        setPages(defaultPages.slice(0, limit));
        setIsDefault(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [user, limit]);

  return { pages, loading, isDefault };
}
