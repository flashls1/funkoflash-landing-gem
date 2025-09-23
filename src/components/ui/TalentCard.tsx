import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface TalentCardProps {
  name: string;
  email?: string | null;
  headshotUrl?: string | null;
  active: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onClick: () => void;
  children?: React.ReactNode;
}

export function TalentCard({
  name,
  email,
  headshotUrl,
  active,
  onEdit,
  onToggleActive,
  onClick,
  children
}: TalentCardProps) {
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-yellow-500"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <img
          src={headshotUrl || '/placeholder.svg'}
          alt={name}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-blue-300 truncate">{name}</h3>
          <p className="text-sm text-white/60 truncate">
            {email || 'No email provided'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
          active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          {active ? 'Active' : 'Inactive'}
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:text-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs px-2 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
          >
            <span className="hidden sm:inline">{active ? 'Deactivate' : 'Activate'}</span>
            <span className="sm:hidden">{active ? 'Off' : 'On'}</span>
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}