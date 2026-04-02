import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  displayName: string | null;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  lastLogin: string | null;
  emailUpdates: boolean;
  sprintReminders: boolean;
  weeklySummary: boolean;
  theme: string;
  language: string;
  onboardingCompleted: boolean;
  termsAcceptedAt: string | null;
  createdAt: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setProfile({
        id: data.id,
        displayName: data.display_name,
        fullName: data.full_name,
        email: data.email,
        avatarUrl: data.avatar_url,
        bio: data.bio,
        lastLogin: data.last_login,
        emailUpdates: data.email_updates ?? true,
        sprintReminders: data.sprint_reminders ?? true,
        weeklySummary: data.weekly_summary ?? true,
        theme: data.theme ?? 'dark',
        language: data.language ?? 'pt-BR',
        onboardingCompleted: (data as any).onboarding_completed ?? false,
        termsAcceptedAt: (data as any).terms_accepted_at ?? null,
        createdAt: data.created_at,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const nameOrEmail = profile?.displayName || profile?.fullName || profile?.email || '';
  const initial = nameOrEmail.charAt(0).toUpperCase() || '?';

  const avatarColor = (() => {
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
    let hash = 0;
    for (let i = 0; i < nameOrEmail.length; i++) hash = nameOrEmail.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  })();

  return { profile, loading, nameOrEmail, initial, avatarColor, refetch: fetchProfile };
}
