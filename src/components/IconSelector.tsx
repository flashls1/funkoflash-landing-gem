import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Category {
  id?: string;
  name: string;
  icon: string;
  color: string;
}

interface IconSelectorProps {
  currentCategory?: Category;
  categories: Category[];
  onCategoryChange: (category: Category) => void;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  currentCategory,
  categories,
  onCategoryChange
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-auto p-1 flex items-center gap-2 hover:bg-muted/50"
        >
          <span className="text-lg">{currentCategory?.icon || '📌'}</span>
          <Badge 
            variant="secondary" 
            className="text-xs cursor-pointer"
            style={{ 
              backgroundColor: (currentCategory?.color || '#6b7280') + '20',
              color: currentCategory?.color || '#6b7280',
              borderColor: (currentCategory?.color || '#6b7280') + '40'
            }}
          >
            {currentCategory?.name || 'General'}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 z-50 bg-background border shadow-lg"
      >
        {categories.map((category, index) => (
          <DropdownMenuItem
            key={category.id || index}
            onClick={() => onCategoryChange(category)}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted"
          >
            <span className="text-lg">{category.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-sm">{category.name}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};