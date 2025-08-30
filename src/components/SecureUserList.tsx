
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecureUser {
  id: string;
  display_name: string;
  role: string;
  avatar_url?: string;
}

interface SecureUserListProps {
  onUserSelect?: (user: SecureUser) => void;
  selectedUserId?: string;
  language: 'en' | 'es';
}

const SecureUserList = ({ onUserSelect, selectedUserId, language }: SecureUserListProps) => {
  const [users, setUsers] = useState<SecureUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchSecureUserList();
    }
  }, [currentUser]);

  const fetchSecureUserList = async () => {
    try {
      setLoading(true);
      
      // Use the secure function that only returns safe user data
      const { data, error } = await supabase.rpc('get_users_for_messaging');
      
      if (error) throw error;
      
      // Map the response to our SecureUser interface
      const secureUsers: SecureUser[] = (data || []).map((user: any) => ({
        id: user.user_id,
        display_name: user.display_name,
        role: user.role,
        avatar_url: null // Don't expose avatar URLs in general lists
      }));
      
      setUsers(secureUsers);
    } catch (error) {
      console.error('Error fetching secure user list:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'talent':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'business':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
            <div className="w-8 h-8 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {language === 'es' ? 'No hay usuarios disponibles' : 'No users available'}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {users.map((user) => (
        <div
          key={user.id}
          onClick={() => onUserSelect?.(user)}
          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
            selectedUserId === user.id ? 'bg-muted' : ''
          }`}
        >
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {user.display_name}
            </div>
            <span className={`inline-block px-2 py-1 text-xs font-medium border rounded-full ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SecureUserList;
