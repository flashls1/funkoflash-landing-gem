
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

interface LoginHistoryEntry {
  id: string;
  ip_address: string;
  login_time: string;
  location_info: {
    city?: string;
    region?: string;
    country?: string;
  } | null;
}

interface LoginHistoryBoxProps {
  language: 'en' | 'es';
  targetUserId?: string; // For admin viewing other users
}

const LoginHistoryBox = ({ language, targetUserId }: LoginHistoryBoxProps) => {
  const { user, profile } = useAuth();
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const content = {
    en: {
      title: "Recent Login History",
      description: "Your last 15 login sessions",
      noHistory: "No login history available",
      exportFull: "Export Complete History",
      ipAddress: "IP Address",
      location: "Location", 
      loginTime: "Login Time",
      exportSuccess: "History exported successfully",
      exportError: "Failed to export history"
    },
    es: {
      title: "Historial de Inicios de Sesión Recientes",
      description: "Tus últimas 15 sesiones",
      noHistory: "No hay historial disponible",
      exportFull: "Exportar Historial Completo",
      ipAddress: "Dirección IP",
      location: "Ubicación",
      loginTime: "Hora de Inicio",
      exportSuccess: "Historial exportado exitosamente",
      exportError: "Error al exportar historial"
    }
  };

  const t = content[language];

  useEffect(() => {
    if (user || targetUserId) {
      fetchLoginHistory();
    }
  }, [user, targetUserId]);

  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      const userIdToQuery = targetUserId || user?.id;
      
      if (!userIdToQuery) return;

      const { data, error } = await supabase
        .from('user_login_history')
        .select('id, ip_address, login_time, location_info')
        .eq('user_id', userIdToQuery)
        .order('login_time', { ascending: false })
        .limit(15);

      if (error) throw error;
      
      setLoginHistory(data || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLocalTime = (utcTime: string) => {
    const date = new Date(utcTime);
    return date.toLocaleString('es-MX', {
      timeZone: 'America/Chicago', // CST
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatLocation = (locationInfo: any) => {
    if (!locationInfo) return '-';
    
    const parts = [];
    if (locationInfo.city) parts.push(locationInfo.city);
    if (locationInfo.region) parts.push(locationInfo.region);
    if (locationInfo.country) parts.push(locationInfo.country);
    
    return parts.join(', ') || '-';
  };

  const handleExportHistory = async () => {
    try {
      const userIdToQuery = targetUserId || user?.id;
      
      if (!userIdToQuery) return;

      // Get JWT token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session found');
      }

      // Call the export function
      const response = await fetch(
        `https://gytjgmeoepglbrjrbfie.supabase.co/functions/v1/export-login-history?user_id=${userIdToQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `login-history-${userIdToQuery}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: t.exportSuccess,
        description: language === 'en' 
          ? "Complete login history has been downloaded"
          : "El historial completo de inicio de sesión ha sido descargado",
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: t.exportError,
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Cargando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          {loginHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHistory}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t.exportFull}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loginHistory.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {t.noHistory}
          </div>
        ) : (
          <div className="space-y-3">
            {loginHistory.map((entry) => (
              <div key={entry.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{entry.ip_address}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatLocation(entry.location_info)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatLocalTime(entry.login_time)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoginHistoryBox;
