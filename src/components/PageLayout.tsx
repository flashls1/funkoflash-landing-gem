import { ReactNode, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  includeNavigation?: boolean;
  includeFooter?: boolean;
  language?: 'en' | 'es';
  setLanguage?: (lang: 'en' | 'es') => void;
}

const PageLayout = ({ 
  children, 
  className = "", 
  includeNavigation = true, 
  includeFooter = true,
  language: propLanguage,
  setLanguage: propSetLanguage
}: PageLayoutProps) => {
  const [internalLanguage, setInternalLanguage] = useState<'en' | 'es'>('en');
  
  // Use prop values if provided, otherwise use internal state
  const language = propLanguage || internalLanguage;
  const setLanguage = propSetLanguage || setInternalLanguage;

  return (
    <div 
      className={`min-h-screen bg-background ${className}`}
      style={{
        backgroundImage: 'var(--site-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {includeNavigation && (
        <Navigation language={language} setLanguage={setLanguage} />
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {includeFooter && (
        <Footer language={language} />
      )}
    </div>
  );
};

export default PageLayout;