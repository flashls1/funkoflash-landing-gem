import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TalentProfile {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  bio?: string;
  headshot_url?: string;
  active: boolean;
  public_visibility: boolean;
  sort_rank: number;
  created_at: string;
  updated_at: string;
}

export const useTalentProfile = () => {
  const { user, profile } = useAuth();
  const [talentProfile, setTalentProfile] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'talent') {
      setTalentProfile(null);
      setLoading(false);
      return;
    }

    fetchTalentProfile();
  }, [user, profile]);

  const fetchTalentProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('active', true)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching talent profile:', fetchError);
        setError('Failed to load talent profile');
        setTalentProfile(null);
        return;
      }

      if (!data) {
        setError('No talent profile found');
        setTalentProfile(null);
        return;
      }

      setTalentProfile(data);
    } catch (err) {
      console.error('Error in fetchTalentProfile:', err);
      setError('Failed to load talent profile');
      setTalentProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    talentProfile,
    loading,
    error,
    refetch: fetchTalentProfile
  };
};