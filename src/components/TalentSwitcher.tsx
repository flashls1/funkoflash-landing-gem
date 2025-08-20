import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Talent {
  id: string;
  name: string;
  headshot_url?: string;
}

interface TalentSwitcherProps {
  selectedTalent: string;
  onTalentChange: (talentId: string) => void;
  language: 'en' | 'es';
}

export const TalentSwitcher = ({ selectedTalent, onTalentChange, language }: TalentSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);

  const content = {
    en: {
      selectTalent: 'Select talent',
      allTalents: 'All Talents',
      searchTalent: 'Search talents...',
      noTalentFound: 'No talent found.'
    },
    es: {
      selectTalent: 'Seleccionar talento',
      allTalents: 'Todos los Talentos',
      searchTalent: 'Buscar talentos...',
      noTalentFound: 'No se encontró talento.'
    }
  };

  const t = content[language];

  useEffect(() => {
    loadTalents();
  }, []);

  const loadTalents = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_profiles')
        .select('id, name, headshot_url')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setTalents(data || []);
    } catch (error) {
      console.error('Error loading talents:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTalentData = talents.find(talent => talent.id === selectedTalent);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Save selected talent to localStorage
  useEffect(() => {
    if (selectedTalent) {
      localStorage.setItem('calendar-selected-talent', selectedTalent);
    }
  }, [selectedTalent]);

  // Load selected talent from localStorage on mount
  useEffect(() => {
    const savedTalent = localStorage.getItem('calendar-selected-talent');
    if (savedTalent && talents.length > 0) {
      const talentExists = talents.find(t => t.id === savedTalent);
      if (talentExists && !selectedTalent) {
        onTalentChange(savedTalent);
      }
    }
  }, [talents, selectedTalent, onTalentChange]);

  if (loading) {
    return (
      <div className="w-64">
        <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted animate-pulse">
          <div className="w-8 h-8 rounded-full bg-muted-foreground/20" />
          <div className="h-4 bg-muted-foreground/20 rounded w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-64">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center space-x-2">
              {selectedTalentData ? (
                <>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedTalentData.headshot_url} />
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedTalentData.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{selectedTalentData.name}</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  <span>{t.allTalents}</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder={t.searchTalent} />
            <CommandList>
              <CommandEmpty>{t.noTalentFound}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value=""
                  onSelect={() => {
                    onTalentChange('');
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{t.allTalents}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedTalent === '' ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
                {talents.map((talent) => (
                  <CommandItem
                    key={talent.id}
                    value={talent.name}
                    onSelect={() => {
                      onTalentChange(talent.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={talent.headshot_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(talent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{talent.name}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedTalent === talent.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};