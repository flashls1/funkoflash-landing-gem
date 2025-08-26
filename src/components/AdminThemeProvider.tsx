import React from 'react';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';

interface AdminThemeProviderProps {
  children: React.ReactNode;
  className?: string;
}

export const AdminThemeProvider: React.FC<AdminThemeProviderProps> = ({ 
  children, 
  className = "" 
}) => {
  const { currentTheme } = useColorTheme();
  const { getBackgroundStyle } = useBackgroundManager();

  return (
    <div 
      className={`min-h-screen ${className}`}
      style={{
        ...getBackgroundStyle(),
        color: currentTheme.foreground,
        // Apply CSS custom properties for dynamic theming
        '--background': currentTheme.background,
        '--foreground': currentTheme.foreground,
        '--card': currentTheme.cardBackground,
        '--card-foreground': currentTheme.cardForeground,
        '--accent': currentTheme.accent,
        '--border': currentTheme.border
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default AdminThemeProvider;