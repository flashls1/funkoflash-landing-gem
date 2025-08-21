import React, { useState } from 'react';
import { TalentSelector } from '@/components/TalentSelector';
import { TalentAssetsManager } from './TalentAssetsManager';

interface AdminTalentAssetsWrapperProps {
  locale?: 'en' | 'es';
}

export const AdminTalentAssetsWrapper: React.FC<AdminTalentAssetsWrapperProps> = ({ 
  locale = 'en' 
}) => {
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <TalentSelector 
        selectedTalentId={selectedTalentId}
        onTalentSelect={setSelectedTalentId}
      />
      
      {selectedTalentId && (
        <TalentAssetsManager 
          talentId={selectedTalentId} 
          locale={locale} 
        />
      )}
      
      {!selectedTalentId && (
        <div className="text-center py-8 text-muted-foreground">
          Please select a talent to manage their assets.
        </div>
      )}
    </div>
  );
};