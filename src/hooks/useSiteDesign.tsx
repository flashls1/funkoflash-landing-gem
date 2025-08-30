
import { createContext, useContext, useState, ReactNode } from 'react';

interface SiteDesignContextType {
  siteDesign: any;
  setSiteDesign: (design: any) => void;
}

const SiteDesignContext = createContext<SiteDesignContextType | null>(null);

export function SiteDesignProvider({ children }: { children: ReactNode }) {
  const [siteDesign, setSiteDesign] = useState({});
  
  return (
    <SiteDesignContext.Provider value={{ siteDesign, setSiteDesign }}>
      {children}
    </SiteDesignContext.Provider>
  );
}

export function useSiteDesign() {
  const context = useContext(SiteDesignContext);
  if (!context) {
    throw new Error('useSiteDesign must be used within a SiteDesignProvider');
  }
  return context;
}
