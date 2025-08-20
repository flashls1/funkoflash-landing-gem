
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, MapPin, Globe, Users, MoreVertical, Edit, Copy, Download, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface BusinessEvent {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  website?: string;
  logo_url?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

interface BusinessEventCardProps {
  event: BusinessEvent;
  language: 'en' | 'es';
  canEdit: boolean;
  onEdit: (event: BusinessEvent) => void;
  onClone: (event: BusinessEvent) => void;
  onRefresh: () => void;
}

export const BusinessEventCard = ({ 
  event, 
  language, 
  canEdit, 
  onEdit, 
  onClone, 
  onRefresh 
}: BusinessEventCardProps) => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const content = {
    en: {
      edit: "Edit Event",
      clone: "Clone Event",
      export: "Export ICS",
      delete: "Delete Event",
      deleteConfirm: "Are you sure you want to delete this event?",
      deleted: "Event deleted successfully",
      exportSuccess: "ICS file downloaded",
      noDate: "Date TBD",
      website: "Visit Website",
      contact: "Contact"
    },
    es: {
      edit: "Editar Evento",
      clone: "Clonar Evento",
      export: "Exportar ICS",
      delete: "Eliminar Evento",
      deleteConfirm: "¿Estás seguro de que quieres eliminar este evento?",
      deleted: "Evento eliminado exitosamente",
      exportSuccess: "Archivo ICS descargado",
      noDate: "Fecha por definir",
      website: "Visitar Sitio Web",
      contact: "Contacto"
    }
  };

  const t = content[language];
  const locale = language === 'es' ? es : enUS;

  const formatDate = (dateString?: string) => {
    if (!dateString) return t.noDate;
    try {
      return format(parseISO(dateString), 'PPP', { locale });
    } catch {
      return t.noDate;
    }
  };

  const formatDateRange = () => {
    if (!event.start_date) return t.noDate;
    
    const startDate = formatDate(event.start_date);
    if (!event.end_date || event.start_date === event.end_date) {
      return startDate;
    }
    
    const endDate = formatDate(event.end_date);
    return `${startDate} - ${endDate}`;
  };

  const handleDelete = async () => {
    if (!confirm(t.deleteConfirm)) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('business_events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: t.deleted,
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportICS = () => {
    if (!event.start_date) return;

    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Funko Flash//Business Events//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@funkoflash.com`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${event.name}`,
      ...(event.location ? [`LOCATION:${event.location}`] : []),
      ...(event.website ? [`URL:${event.website}`] : []),
      `CREATED:${formatICSDate(new Date(event.created_at))}`,
      `LAST-MODIFIED:${formatICSDate(new Date(event.updated_at))}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: t.exportSuccess,
    });
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      {/* Hero Image */}
      {event.logo_url && (
        <div className="aspect-[16/9] overflow-hidden rounded-t-lg">
          <img
            src={event.logo_url}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight mb-2">{event.name || 'Untitled Event'}</h3>
            
            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDateRange()}</span>
            </div>
            
            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(event)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t.edit}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onClone(event)}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t.clone}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportICS}>
                  <Download className="h-4 w-4 mr-2" />
                  {t.export}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Website Link */}
        {event.website && (
          <Button variant="outline" size="sm" className="w-full mb-3" asChild>
            <a href={event.website} target="_blank" rel="noopener noreferrer">
              <Globe className="h-4 w-4 mr-2" />
              {t.website}
            </a>
          </Button>
        )}

        {/* Contact Info */}
        {(event.contact_name || event.contact_email || event.contact_phone) && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Users className="h-4 w-4" />
              {t.contact}
            </div>
            {event.contact_name && (
              <p className="text-sm text-muted-foreground">{event.contact_name}</p>
            )}
            {event.contact_email && (
              <p className="text-sm text-muted-foreground">{event.contact_email}</p>
            )}
            {event.contact_phone && (
              <p className="text-sm text-muted-foreground">{event.contact_phone}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
