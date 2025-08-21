import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTalentsWithUsers } from '@/features/talent-assets/data';
import { useToast } from '@/hooks/use-toast';

interface Talent {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  user_id: string | null;
}

interface TalentSelectorProps {
  selectedTalentId: string | null;
  onTalentSelect: (talentId: string | null) => void;
  className?: string;
}

export const TalentSelector: React.FC<TalentSelectorProps> = ({
  selectedTalentId,
  onTalentSelect,
  className = ""
}) => {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadTalents = async () => {
      try {
        const data = await getTalentsWithUsers();
        setTalents(data);
      } catch (error) {
        console.error('Error loading talents:', error);
        toast({
          title: "Error",
          description: "Failed to load talents",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTalents();
  }, [toast]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Talent Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading talents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Select Talent</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedTalentId || ""} onValueChange={(value) => onTalentSelect(value || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a talent to manage assets" />
          </SelectTrigger>
          <SelectContent>
            {talents.map((talent) => (
              <SelectItem key={talent.id} value={talent.id}>
                {talent.name} {talent.user_id ? '' : '(No User Account)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {talents.length === 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            No talents found. Make sure talent profiles are created and active.
          </div>
        )}
        
        {selectedTalentId && (
          <div className="mt-4 text-sm text-green-600">
            Talent selected. You can now manage their assets.
          </div>
        )}
      </CardContent>
    </Card>
  );
};