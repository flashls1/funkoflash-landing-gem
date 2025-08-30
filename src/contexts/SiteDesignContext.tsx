
import { createContext, useContext, ReactNode } from "react";

export type PageDesign = {
  backgroundImageUrl?: string;
  heroVariant?: "1920x480" | "1920x240";
  nav?: {
    bgColor?: string;
    titleColor?: string;
    fontFamily?: string;
    fontSizePx?: number;
    heightPx?: number;
    shadow?: boolean;
    sticky?: boolean;
  };
};

export type SiteDesignContextType = {
  getCurrentPageSettings: (pathname?: string) => PageDesign | null;
};

export const SiteDesignContext = createContext<SiteDesignContextType | null>(null);

export function SiteDesignProvider({ children }: { children: ReactNode }) {
  const api: SiteDesignContextType = {
    getCurrentPageSettings: (_pathname?: string) => null,
  };
  return <SiteDesignContext.Provider value={api}>{children}</SiteDesignContext.Provider>;
}

export function useSiteDesign() {
  const ctx = useContext(SiteDesignContext);
  if (!ctx) throw new Error("useSiteDesign must be used within SiteDesignProvider");
  return ctx;
}

export default useSiteDesign;
