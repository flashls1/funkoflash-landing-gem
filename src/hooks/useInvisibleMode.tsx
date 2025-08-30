import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useInvisibleMode() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [invisibleMode, setInvisibleMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize invisible mode state from profile
  useEffect(() => {
    if (profile?.status === 'invisible') {
      setInvisibleMode(true);
    } else {
      setInvisibleMode(false);
    }
  }, [profile?.status]);

  const toggleInvisible = async () => {
    if (!profile || loading) return;

    setLoading(true);
    
    try {
      const newStatus = invisibleMode ? 'online' : 'invisible';
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', profile.user_id);

      if (error) {
        throw error;
      }

      setInvisibleMode(!invisibleMode);
      
      toast({
        title: "Status Updated",
        description: `You are now ${newStatus === 'invisible' ? 'invisible' : 'online'}`,
      });
    } catch (error) {
      console.error('Error toggling invisible mode:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    invisibleMode,
    toggleInvisible,
    loading,
  };
}