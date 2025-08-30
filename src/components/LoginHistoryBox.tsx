
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LoginHistoryEntry {
  id: string;
  ip_address: string;
  login_time: string;
  location_info: {
    city?: string;
    region?: string;
    country?: string;
  };
}

export default function LoginHistoryBox() {
  const { user } = useAuth();
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoginHistory();
    }
  }, [user]);

  const fetchLoginHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('login_history')
        .select('id, ip_address, login_time, location_info')
        .eq('user_id', user?.id)
        .order('login_time', { ascending: false })
        .limit(15);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData: LoginHistoryEntry[] = (data || []).map(item => ({
        id: item.id,
        ip_address: item.ip_address,
        login_time: item.login_time,
        location_info: typeof item.location_info === 'object' && item.location_info !== null 
          ? item.location_info as { city?: string; region?: string; country?: string; }
          : {}
      }));

      setLoginHistory(transformedData);
    } catch (error) {
      console.error('Error fetching login history:', error);
      setLoginHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportLoginHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('login_time', { ascending: false });

      if (error) throw error;

      // Create CSV content
      const headers = ['ID', 'IP Address', 'Login Time', 'City', 'Region', 'Country'];
      const csvContent = [
        headers.join(','),
        ...(data || []).map(row => [
          row.id,
          row.ip_address,
          row.login_time,
          (row.location_info as any)?.city || '',
          (row.location_info as any)?.region || '',
          (row.location_info as any)?.country || ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `login-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting login history:', error);
    }
  };

  const formatLoginTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString('es-MX', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Acceso</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historial de Acceso</CardTitle>
        <Button onClick={exportLoginHistory} size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar historial completo
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {loginHistory.length === 0 ? (
            <p className="text-muted-foreground">No hay historial disponible</p>
          ) : (
            loginHistory.map((entry) => (
              <div key={entry.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <div>
                  <p className="font-medium">{entry.ip_address}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.location_info.city && `${entry.location_info.city}, `}
                    {entry.location_info.region}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatLoginTime(entry.login_time)}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
