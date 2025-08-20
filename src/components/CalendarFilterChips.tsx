import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CalendarFilters {
  status: string[];
  talent: string[];
  dateRange: string;
  hideNotAvailable: boolean;
}

interface CalendarFilterChipsProps {
  filters: CalendarFilters;
  talents: { id: string; name: string }[];
  language: 'en' | 'es';
  onClearAll: () => void;
  onRemoveStatusFilter: (status: string) => void;
  onRemoveTalentFilter: (talentId: string) => void;
  onRemoveDateRangeFilter: () => void;
}

export const CalendarFilterChips = ({
  filters,
  talents,
  language,
  onClearAll,
  onRemoveStatusFilter,
  onRemoveTalentFilter,
  onRemoveDateRangeFilter
}: CalendarFilterChipsProps) => {
  const statusLabels = {
    en: {
      available: 'Available',
      hold: 'Hold', 
      tentative: 'Tentative',
      booked: 'Booked',
      cancelled: 'Cancelled',
      not_available: 'Not Available'
    },
    es: {
      available: 'Disponible',
      hold: 'Apartado',
      tentative: 'Tentativo', 
      booked: 'Confirmado',
      cancelled: 'Cancelado',
      not_available: 'No disponible'
    }
  };

  const dateRangeLabels = {
    en: {
      next7: 'Next 7 days',
      next30: 'Next 30 days',
      next90: 'Next 90 days',
      year: 'Full Year'
    },
    es: {
      next7: 'Próximos 7 días',
      next30: 'Próximos 30 días',
      next90: 'Próximos 90 días',
      year: 'Año completo'
    }
  };

  const clearAllText = language === 'en' ? 'Clear all' : 'Limpiar todo';

  // Count active filters
  const activeFiltersCount = 
    (filters.status.length < 6 ? filters.status.length : 0) +
    filters.talent.length +
    (filters.dateRange !== 'year' ? 1 : 0) +
    (filters.hideNotAvailable ? 1 : 0);

  if (activeFiltersCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {language === 'en' ? 'Active filters:' : 'Filtros activos:'}
      </span>
      
      {/* Status filter chips */}
      {filters.status.length < 6 && filters.status.map(status => (
        <Badge key={status} variant="secondary" className="gap-1">
          {statusLabels[language][status as keyof typeof statusLabels.en]}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
            onClick={() => onRemoveStatusFilter(status)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      {/* Talent filter chips */}
      {filters.talent.map(talentId => {
        const talent = talents.find(t => t.id === talentId);
        if (!talent) return null;
        
        return (
          <Badge key={talentId} variant="secondary" className="gap-1">
            {talent.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onRemoveTalentFilter(talentId)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}
      
      {/* Date range filter chip */}
      {filters.dateRange !== 'year' && (
        <Badge variant="secondary" className="gap-1">
          {dateRangeLabels[language][filters.dateRange as keyof typeof dateRangeLabels.en]}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
            onClick={onRemoveDateRangeFilter}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {/* Hide not available chip */}
      {filters.hideNotAvailable && (
        <Badge variant="secondary" className="gap-1">
          {language === 'en' ? 'Hide Not Available' : 'Ocultar No disponible'}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
            onClick={() => {/* This will be handled by parent */}}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {/* Clear all button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs"
      >
        {clearAllText}
      </Button>
    </div>
  );
};