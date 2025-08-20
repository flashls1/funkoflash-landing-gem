import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type Permission = 'calendar:view' | 'calendar:edit' | 'calendar:edit_own';

export const usePermissions = () => {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!profile?.role) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('permission_scope')
          .eq('role_key', profile.role);

        if (error) {
          console.error('Error fetching permissions:', error);
          setPermissions([]);
        } else {
          setPermissions(data?.map(p => p.permission_scope as Permission) || []);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [profile?.role]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  return {
    permissions,
    hasPermission,
    loading
  };
};