
import { createContext, useContext, useState, ReactNode } from 'react';

interface ColorThemeContextType {
  colorTheme: any;
  setColorTheme: (theme: any) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType | null>(null);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorTheme] = useState({});
  
  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
}
