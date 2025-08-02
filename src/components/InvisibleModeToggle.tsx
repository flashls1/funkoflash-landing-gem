import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

interface InvisibleModeToggleProps {
  language: 'en' | 'es';
  className?: string;
}

export const InvisibleModeToggle = ({ language, className = '' }: InvisibleModeToggleProps) => {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<'online' | 'offline' | 'invisible'>('online');

  const content = {
    en: {
      online: 'Online',
      offline: 'Offline', 
      invisible: 'Invisible',
      invisibleMode: 'Invisible Mode'
    },
    es: {
      online: 'En Línea',
      offline: 'Fuera de Línea',
      invisible: 'Invisible',
      invisibleMode: 'Modo Invisible'
    }
  };

  const t = content[language];

  useEffect(() => {
    if (profile) {
      setStatus((profile as any).status || 'online');
    }
  }, [profile]);

  const getStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'online': return t.online;
      case 'offline': return t.offline;
      case 'invisible': return t.invisible;
      default: return t.offline;
    }
  };

  const toggleInvisible = async () => {
    if (!user) return;
    
    const newStatus = status === 'invisible' ? 'online' : 'invisible';
    setStatus(newStatus);
    
    try {
      await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert on error
      setStatus(status);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          status === 'online' 
            ? 'bg-green-500 animate-pulse' 
            : status === 'invisible'
            ? 'bg-blue-500 animate-pulse'
            : 'bg-red-500'
        }`} />
        <Badge 
          variant="secondary" 
          className={`text-xs ${
            status === 'online' 
              ? 'bg-green-500/20 text-green-300 border-green-500/30' 
              : status === 'invisible'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/30'
          }`}
        >
          {getStatusText(status)}
        </Badge>
      </div>
      
      {/* Invisible mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/80">{t.invisibleMode}:</span>
        <button
          onClick={toggleInvisible}
          className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
            status === 'invisible' 
              ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
              : 'bg-white/20 hover:bg-white/30'
          }`}
          title={status === 'invisible' ? 'Disable invisible mode' : 'Enable invisible mode'}
        >
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 flex items-center justify-center ${
            status === 'invisible' ? 'translate-x-5' : 'translate-x-0'
          }`}>
            {status === 'invisible' ? (
              <EyeOff className="h-2.5 w-2.5 text-blue-500" />
            ) : (
              <Eye className="h-2.5 w-2.5 text-gray-500" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};