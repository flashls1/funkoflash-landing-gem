import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Upload, Plus, Download } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { hasFeature } from '@/lib/features';
import { CalendarLegend } from '@/components/CalendarLegend';
import { useState } from 'react';

const Calendar = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { user, profile, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();

  const content = {
    en: {
      title: 'Calendar',
      subtitle: 'Manage schedules and events',
      emptyTitle: 'Calendar is coming soon.',
      emptySubtitle: 'We\'re preparing import, sync, and editing tools.',
      import: 'Import',
      addEvent: 'Add Event',
      export: 'Export'
    },
    es: {
      title: 'Calendario',
      subtitle: 'Gestiona horarios y eventos',
      emptyTitle: 'El calendario estará disponible pronto.',
      emptySubtitle: 'Estamos preparando herramientas de importación, sincronización y edición.',
      import: 'Importar',
      addEvent: 'Agregar evento',
      export: 'Exportar'
    }
  };

  const t = content[language];

  useEffect(() => {
    // Check feature flag first
    if (!hasFeature('calendar')) {
      navigate('/');
      return;
    }

    // Wait for auth and permissions to load
    if (authLoading || permissionsLoading) return;

    // Check authentication
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check calendar:view permission
    if (!hasPermission('calendar:view')) {
      navigate('/');
      return;
    }
  }, [user, hasPermission, authLoading, permissionsLoading, navigate]);

  // Show loading while checking auth and permissions
  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have access
  if (!user || !hasPermission('calendar:view') || !hasFeature('calendar')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          </div>
          <p className="text-muted-foreground text-lg">{t.subtitle}</p>
        </div>

        {/* Empty State Card */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">{t.emptyTitle}</CardTitle>
            <CardDescription className="text-base">{t.emptySubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Action Buttons (Disabled) */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button disabled className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t.import}
              </Button>
              <Button disabled className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t.addEvent}
              </Button>
              <Button disabled variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                {t.export}
              </Button>
            </div>

            {/* Status Legend */}
            <CalendarLegend language={language} />
          </CardContent>
        </Card>
      </main>

      <Footer language={language} />
    </div>
  );
};

export default Calendar;