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
  createdAt: string | null;
  onboardingCompleted: boolean;
  termsAcceptedAt: string | null;
  isAdmin: boolean;
  isActive: boolean;
  lastSeenAt: string | null;
  surveyCompleted: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const mapProfile = (data: any): Profile => ({
    id: data.id,
    displayName: data.display_name ?? null,
    fullName: data.full_name ?? null,
    email: data.email ?? null,
    avatarUrl: data.avatar_url ?? null,
    bio: data.bio ?? null,
    createdAt: data.created_at ?? null,
    onboardingCompleted: data.onboarding_completed ?? false,
    termsAcceptedAt: data.terms_accepted_at ?? null,
    isAdmin: data.is_admin ?? false,
    isActive: data.is_active ?? true,
    lastSeenAt: data.last_seen_at ?? null,
    surveyCompleted: data.survey_completed ?? false,
  });

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, email, avatar_url, bio, created_at, onboarding_completed, terms_accepted_at, is_admin, is_active, last_seen_at, survey_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        setProfile(null);
        return;
      }

      if (!data) {
        // Perfil não existe, cria
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            display_name: user.email?.split('@')[0] || 'User',
          })
          .select('id, display_name, full_name, email, avatar_url, bio, created_at, onboarding_completed, terms_accepted_at, is_admin, is_active, last_seen_at, survey_completed')
          .single();

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
          setProfile(null);
        } else if (newProfile) {
          setProfile(mapProfile(newProfile));
        }
      } else {
        setProfile(mapProfile(data));
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const nameOrEmail = profile?.displayName || profile?.fullName || profile?.email || '';
  const initial = nameOrEmail.charAt(0).toUpperCase() || '?';

  const avatarColor = (() => {
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
    let hash = 0;
    for (let i = 0; i < nameOrEmail.length; i++) hash = nameOrEmail.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  })();

  return { profile, loading, nameOrEmail, initial, avatarColor, refetch: fetchProfile };
}
