import React from 'react';
import { useColorTheme } from '@/hooks/useColorTheme';

interface AdminThemeProviderProps {
  children: React.ReactNode;
  className?: string;
}

export const AdminThemeProvider: React.FC<AdminThemeProviderProps> = ({ 
  children, 
  className = "" 
}) => {
  const { currentTheme } = useColorTheme();

  return (
    <div 
      className={`min-h-screen ${className}`}
      style={{
        backgroundImage: "url('/lovable-uploads/bb29cf4b-64ec-424f-8221-3b283256e06d.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: currentTheme.background
      }}
    >
      {children}
    </div>
  );
};

export default AdminThemeProvider;