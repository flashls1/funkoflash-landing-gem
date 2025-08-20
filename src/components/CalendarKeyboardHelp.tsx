import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CalendarKeyboardHelpProps {
  language: 'en' | 'es';
}

export const CalendarKeyboardHelp = ({ language }: CalendarKeyboardHelpProps) => {
  const content = {
    en: {
      title: 'Keyboard shortcuts',
      shortcuts: [
        { key: '← →', description: 'Previous/Next month (or week)' },
        { key: '↑ ↓', description: 'Previous/Next week (or month)' },
        { key: 'Enter', description: 'Open event details' },
        { key: 'Esc', description: 'Close dialogs' },
      ]
    },
    es: {
      title: 'Atajos de teclado',
      shortcuts: [
        { key: '← →', description: 'Mes anterior/siguiente (o semana)' },
        { key: '↑ ↓', description: 'Semana anterior/siguiente (o mes)' },
        { key: 'Enter', description: 'Abrir detalles del evento' },
        { key: 'Esc', description: 'Cerrar diálogos' },
      ]
    }
  };

  const t = content[language];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">{t.title}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-medium leading-none">{t.title}</h4>
          <div className="space-y-2">
            {t.shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <code className="relative rounded bg-muted px-2 py-1 font-mono text-xs">
                  {shortcut.key}
                </code>
                <span className="text-muted-foreground">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};