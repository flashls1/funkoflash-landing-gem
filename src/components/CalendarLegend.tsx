import { Badge } from '@/components/ui/badge';

interface CalendarLegendProps {
  language: 'en' | 'es';
}

export const CalendarLegend = ({ language }: CalendarLegendProps) => {
  const legendContent = {
    en: {
      title: 'Legend',
      available: 'Available',
      hold: 'Hold', 
      tentative: 'Tentative',
      booked: 'Booked',
      cancelled: 'Cancelled',
      notAvailable: 'Not Available'
    },
    es: {
      title: 'Leyenda',
      available: 'Disponible',
      hold: 'Apartado',
      tentative: 'Tentativo', 
      booked: 'Confirmado',
      cancelled: 'Cancelado',
      notAvailable: 'No disponible'
    }
  };

  const t = legendContent[language];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{t.title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-status-available hover:bg-status-available/90 text-white border-0">
            {t.available}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-status-hold hover:bg-status-hold/90 text-white border-0">
            {t.hold}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-status-tentative hover:bg-status-tentative/90 text-black border-0">
            {t.tentative}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-status-booked hover:bg-status-booked/90 text-white border-0">
            {t.booked}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-status-cancelled hover:bg-status-cancelled/90 text-white border-0 line-through">
            {t.cancelled}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-status-not-available hover:bg-status-not-available/90 text-white border-0">
            {t.notAvailable}
          </Badge>
        </div>
      </div>
    </div>
  );
};