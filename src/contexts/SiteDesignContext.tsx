
import { createContext, useContext, ReactNode } from "react";

export type PageDesign = {
  backgroundImageUrl?: string;
  heroVariant?: "1920x480" | "1920x240";
  hero?: {
    backgroundMedia?: string;
    mediaType?: "image" | "video";
    overlayOpacity?: number;
    height?: string;
    position?: {
      x: number;
      y: number;
    };
    scale?: number;
  };
  tiles?: any[];
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
  getCurrentPageSettings: (pathname?: string) => PageDesign;
  loading?: boolean;
  currentPage?: string;
  error?: string | null;
  savePageSettings?: (pageName: string, settings: any) => Promise<void>;
  uploadFile?: (file: File, path: string) => Promise<string>;
  settings?: any;
  setCurrentPage?: (page: string) => void;
};

export const DEFAULT_PAGE_DESIGN: PageDesign = {
  hero: {
    backgroundMedia: '',
    mediaType: 'image',
    overlayOpacity: 0.5,
    height: '240',
    position: { x: 50, y: 50 },
    scale: 100,
  },
  heroVariant: "1920x240",
};

export const SiteDesignContext = createContext<SiteDesignContextType | null>(null);

export function SiteDesignProvider({ children }: { children: ReactNode }) {
  const api: SiteDesignContextType = {
    getCurrentPageSettings: (_pathname?: string) => ({ ...DEFAULT_PAGE_DESIGN }),
    loading: false,
    currentPage: undefined,
    error: null,
    savePageSettings: async () => {},
    uploadFile: async () => '',
    settings: DEFAULT_PAGE_DESIGN,
    setCurrentPage: () => {},
  };
  return <SiteDesignContext.Provider value={api}>{children}</SiteDesignContext.Provider>;
}

export function useSiteDesign() {
  const ctx = useContext(SiteDesignContext);
  if (!ctx) throw new Error("useSiteDesign must be used within SiteDesignProvider");
  return ctx;
}

export default useSiteDesign;
