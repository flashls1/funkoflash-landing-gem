import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, XCircle, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface GoogleCalendarSyncProps {
  talentId: string;
  language: 'en' | 'es';
  onSyncComplete?: () => void;
}

interface ConnectionStatus {
  isConnected: boolean;
  googleEmail?: string;
  calendarId?: string;
  lastSync?: string;
}

export const GoogleCalendarSync = ({ talentId, language, onSyncComplete }: GoogleCalendarSyncProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const { toast } = useToast();

  const t = {
    en: {
      connect: "Connect Google Calendar",
      connected: "Connected",
      connectedAs: "Connected as {email}",
      calendar: "Calendar: {name}",
      pushNow: "Push Now",
      pullNow: "Pull Now",
      syncReview: "Sync Review",
      connecting: "Connecting...",
      syncing: "Syncing...",
      lastSync: "Last sync: {time}",
      never: "Never",
      conflicts: "Conflicts Found",
      conflictsDesc: "Changes detected on both sides. Please review:",
      keepCms: "Keep CMS",
      keepGoogle: "Keep Google",
      merge: "Merge",
      skip: "Skip",
      resolveConflicts: "Resolve Conflicts",
      pushSuccess: "Successfully pushed events to Google Calendar",
      pullSuccess: "Successfully pulled events from Google Calendar",
      connectionSuccess: "Google Calendar connected successfully",
      error: "An error occurred"
    },
    es: {
      connect: "Conectar Google Calendar",
      connected: "Conectado",
      connectedAs: "Conectado como {email}",
      calendar: "Calendario: {name}",
      pushNow: "Sincronizar ahora (enviar)",
      pullNow: "Sincronizar ahora (recibir)",
      syncReview: "Revisión de sincronización",
      connecting: "Conectando...",
      syncing: "Sincronizando...",
      lastSync: "Última sincronización: {time}",
      never: "Nunca",
      conflicts: "Conflictos encontrados",
      conflictsDesc: "Se detectaron cambios en ambos lados. Por favor revisa:",
      keepCms: "Conservar CMS",
      keepGoogle: "Conservar Google",
      merge: "Combinar",
      skip: "Omitir",
      resolveConflicts: "Resolver conflictos",
      pushSuccess: "Eventos enviados a Google Calendar exitosamente",
      pullSuccess: "Eventos obtenidos de Google Calendar exitosamente",
      connectionSuccess: "Google Calendar conectado exitosamente",
      error: "Ocurrió un error"
    }
  };

  const content = t[language];

  useEffect(() => {
    checkConnectionStatus();
  }, [talentId]);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('gcal_connections')
        .select('google_email, calendar_id, updated_at')
        .eq('talent_id', talentId)
        .maybeSingle();

      if (error) throw error;

      setConnectionStatus({
        isConnected: !!data,
        googleEmail: data?.google_email,
        calendarId: data?.calendar_id,
        lastSync: data?.updated_at
      });
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Initialize Google OAuth flow
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { talentId, action: 'connect' }
      });

      if (error) throw error;

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast({
        title: content.error,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { talentId, action: 'push' }
      });

      if (error) throw error;

      if (data.conflicts && data.conflicts.length > 0) {
        setConflicts(data.conflicts);
        setShowConflictDialog(true);
      } else {
        toast({
          title: content.pushSuccess,
          description: `${data.pushed || 0} events synchronized`
        });
        onSyncComplete?.();
      }
    } catch (error) {
      console.error('Error pushing to Google Calendar:', error);
      toast({
        title: content.error,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePull = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { talentId, action: 'pull' }
      });

      if (error) throw error;

      if (data.conflicts && data.conflicts.length > 0) {
        setConflicts(data.conflicts);
        setShowConflictDialog(true);
      } else {
        toast({
          title: content.pullSuccess,
          description: `${data.pulled || 0} events synchronized`
        });
        onSyncComplete?.();
      }
    } catch (error) {
      console.error('Error pulling from Google Calendar:', error);
      toast({
        title: content.error,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveConflicts = async (resolutions: Record<string, string>) => {
    try {
      const { error } = await supabase.functions.invoke('google-calendar-conflicts', {
        body: { talentId, resolutions }
      });

      if (error) throw error;

      toast({
        title: "Conflicts resolved",
        description: "Events have been synchronized"
      });
      
      setConflicts([]);
      setShowConflictDialog(false);
      onSyncComplete?.();
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      toast({
        title: content.error,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  if (!connectionStatus.isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Calendar className="h-4 w-4" />
        {isLoading ? content.connecting : content.connect}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="gap-1">
        <CheckCircle className="h-3 w-3 text-green-500" />
        {content.connected}
      </Badge>
      
      <Button
        onClick={handlePush}
        disabled={isSyncing}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        {isSyncing ? content.syncing : content.pushNow}
      </Button>
      
      <Button
        onClick={handlePull}
        disabled={isSyncing}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {isSyncing ? content.syncing : content.pullNow}
      </Button>

      {conflicts.length > 0 && (
        <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              {content.syncReview}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                {content.conflicts}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {content.conflictsDesc}
              </p>
              
              <div className="space-y-4">
                {conflicts.map((conflict, index) => (
                  <ConflictResolutionCard
                    key={index}
                    conflict={conflict}
                    language={language}
                    onResolve={(resolution) => {
                      // Handle individual conflict resolution
                      console.log('Conflict resolution:', conflict.id, resolution);
                    }}
                  />
                ))}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleResolveConflicts({})}>
                  {content.resolveConflicts}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface ConflictResolutionCardProps {
  conflict: any;
  language: 'en' | 'es';
  onResolve: (resolution: string) => void;
}

const ConflictResolutionCard = ({ conflict, language, onResolve }: ConflictResolutionCardProps) => {
  const [selectedResolution, setSelectedResolution] = useState<string>('');

  const t = {
    en: {
      keepCms: "Keep CMS",
      keepGoogle: "Keep Google", 
      merge: "Merge",
      skip: "Skip"
    },
    es: {
      keepCms: "Conservar CMS",
      keepGoogle: "Conservar Google",
      merge: "Combinar", 
      skip: "Omitir"
    }
  };

  const content = t[language];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{conflict.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(new Date(conflict.date), 'PPP')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium mb-2">CMS Version</h4>
            <p className="text-sm">{conflict.cmsVersion}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Google Version</h4>
            <p className="text-sm">{conflict.googleVersion}</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex gap-2">
          <Button
            variant={selectedResolution === 'cms' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedResolution('cms');
              onResolve('cms');
            }}
          >
            {content.keepCms}
          </Button>
          <Button
            variant={selectedResolution === 'google' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedResolution('google');
              onResolve('google');
            }}
          >
            {content.keepGoogle}
          </Button>
          <Button
            variant={selectedResolution === 'merge' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedResolution('merge');
              onResolve('merge');
            }}
          >
            {content.merge}
          </Button>
          <Button
            variant={selectedResolution === 'skip' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedResolution('skip');
              onResolve('skip');
            }}
          >
            {content.skip}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};