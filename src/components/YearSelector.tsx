import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  language: 'en' | 'es';
}

const AVAILABLE_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031];

export const YearSelector = ({ selectedYear, onYearChange, language }: YearSelectorProps) => {
  const content = {
    en: {
      previousYear: 'Previous Year',
      nextYear: 'Next Year'
    },
    es: {
      previousYear: 'Año Anterior',
      nextYear: 'Año Siguiente'
    }
  };

  const t = content[language];

  const currentIndex = AVAILABLE_YEARS.indexOf(selectedYear);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < AVAILABLE_YEARS.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onYearChange(AVAILABLE_YEARS[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onYearChange(AVAILABLE_YEARS[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
        aria-label={t.previousYear}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Tabs value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-7 min-w-fit">
          {AVAILABLE_YEARS.map((year) => (
            <TabsTrigger
              key={year}
              value={year.toString()}
              className="px-4 py-2"
            >
              {year}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={!canGoNext}
        aria-label={t.nextYear}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};