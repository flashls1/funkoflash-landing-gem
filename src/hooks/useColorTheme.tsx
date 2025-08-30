import { useState, useEffect } from 'react';

export interface ColorTheme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  cardBackground: string;
  cardForeground: string;
  accent: string;
  border: string;
}

const colorThemes: ColorTheme[] = [
  {
    id: 'slate',
    name: 'Professional Slate',
    background: 'hsl(222, 84%, 5%)',
    foreground: 'hsl(210, 40%, 98%)',
    cardBackground: 'hsl(217, 33%, 17%)',
    cardForeground: 'hsl(210, 40%, 98%)',
    accent: 'hsl(217, 91%, 60%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    background: 'hsl(221, 39%, 11%)',
    foreground: 'hsl(210, 40%, 98%)',
    cardBackground: 'hsl(224, 71%, 4%)',
    cardForeground: 'hsl(210, 40%, 98%)',
    accent: 'hsl(213, 94%, 68%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'green',
    name: 'Forest Green',
    background: 'hsl(120, 100%, 4%)',
    foreground: 'hsl(0, 0%, 98%)',
    cardBackground: 'hsl(120, 13%, 10%)',
    cardForeground: 'hsl(0, 0%, 98%)',
    accent: 'hsl(142, 76%, 36%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    background: 'hsl(263, 70%, 4%)',
    foreground: 'hsl(210, 40%, 98%)',
    cardBackground: 'hsl(263, 69%, 12%)',
    cardForeground: 'hsl(210, 40%, 98%)',
    accent: 'hsl(263, 70%, 50%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    background: 'hsl(20, 14%, 4%)',
    foreground: 'hsl(60, 9%, 98%)',
    cardBackground: 'hsl(12, 6%, 15%)',
    cardForeground: 'hsl(60, 9%, 98%)',
    accent: 'hsl(38, 92%, 50%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    background: 'hsl(345, 100%, 4%)',
    foreground: 'hsl(210, 40%, 98%)',
    cardBackground: 'hsl(345, 13%, 15%)',
    cardForeground: 'hsl(210, 40%, 98%)',
    accent: 'hsl(330, 81%, 60%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    background: 'hsl(170, 100%, 4%)',
    foreground: 'hsl(0, 0%, 98%)',
    cardBackground: 'hsl(170, 13%, 15%)',
    cardForeground: 'hsl(0, 0%, 98%)',
    accent: 'hsl(173, 80%, 40%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    background: 'hsl(234, 89%, 7%)',
    foreground: 'hsl(210, 40%, 98%)',
    cardBackground: 'hsl(234, 13%, 15%)',
    cardForeground: 'hsl(210, 40%, 98%)',
    accent: 'hsl(239, 84%, 67%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    background: 'hsl(15, 100%, 4%)',
    foreground: 'hsl(60, 9%, 98%)',
    cardBackground: 'hsl(24, 9%, 10%)',
    cardForeground: 'hsl(60, 9%, 98%)',
    accent: 'hsl(20, 90%, 48%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'cyan',
    name: 'Electric Cyan',
    background: 'hsl(191, 100%, 4%)',
    foreground: 'hsl(0, 0%, 98%)',
    cardBackground: 'hsl(191, 13%, 15%)',
    cardForeground: 'hsl(0, 0%, 98%)',
    accent: 'hsl(188, 94%, 43%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    background: 'hsl(151, 100%, 4%)',
    foreground: 'hsl(0, 0%, 98%)',
    cardBackground: 'hsl(151, 13%, 15%)',
    cardForeground: 'hsl(0, 0%, 98%)',
    accent: 'hsl(160, 84%, 39%)',
    border: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'violet',
    name: 'Electric Violet',
    background: 'hsl(283, 100%, 4%)',
    foreground: 'hsl(210, 40%, 98%)',
    cardBackground: 'hsl(283, 13%, 15%)',
    cardForeground: 'hsl(210, 40%, 98%)',
    accent: 'hsl(271, 91%, 65%)',
    border: 'hsl(0, 0%, 100%)'
  }
];

export const useColorTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(colorThemes[0]);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedThemeId = localStorage.getItem('dashboard-color-theme');
    if (savedThemeId) {
      const theme = colorThemes.find(t => t.id === savedThemeId);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  const changeTheme = (themeId: string) => {
    const theme = colorThemes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('dashboard-color-theme', themeId);
    }
  };

  return {
    currentTheme,
    colorThemes,
    changeTheme
  };
};