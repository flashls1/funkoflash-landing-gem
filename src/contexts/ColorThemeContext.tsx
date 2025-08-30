
import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type ColorTheme = {
  id: string;
  name: string;
  className: string;
  accent: string;
  background: string;
  foreground: string;
  cardBackground: string;
  cardForeground: string;
  border: string;
};

export type ColorThemeContextType = {
  currentTheme: ColorTheme;
  colorThemes: ColorTheme[];
  changeTheme: (id: string) => void;
};

const DEFAULT_THEMES: ColorTheme[] = [
  { 
    id: "default", 
    name: "Default", 
    className: "theme-default",
    accent: "#3b82f6",
    background: "#ffffff",
    foreground: "#000000",
    cardBackground: "#f8fafc",
    cardForeground: "#1e293b",
    border: "#e2e8f0"
  },
  { 
    id: "blue", 
    name: "Blue", 
    className: "theme-blue",
    accent: "#2563eb",
    background: "#f0f9ff",
    foreground: "#1e3a8a",
    cardBackground: "#e0f2fe",
    cardForeground: "#0c4a6e",
    border: "#0ea5e9"
  },
  { 
    id: "orange", 
    name: "Orange", 
    className: "theme-orange",
    accent: "#ea580c",
    background: "#fff7ed",
    foreground: "#9a3412",
    cardBackground: "#fed7aa",
    cardForeground: "#c2410c",
    border: "#fb923c"
  },
];

const DEFAULT_THEME = DEFAULT_THEMES[0];

export const ColorThemeContext = createContext<ColorThemeContextType | null>(null);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ColorTheme>(DEFAULT_THEME);

  const value = useMemo<ColorThemeContextType>(() => ({
    currentTheme: theme,
    colorThemes: DEFAULT_THEMES,
    changeTheme: (id: string) => {
      const next = DEFAULT_THEMES.find(t => t.id === id) ?? DEFAULT_THEME;
      setTheme(next);
      document.body.dataset.theme = next.id;
    },
  }), [theme]);

  return <ColorThemeContext.Provider value={value}>{children}</ColorThemeContext.Provider>;
}

export function useColorTheme() {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) throw new Error("useColorTheme must be used within ColorThemeProvider");
  return ctx;
}

export default useColorTheme;
