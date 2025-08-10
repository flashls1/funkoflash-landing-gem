import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import heroHome from '@/assets/hero-banner-main.jpg';
import heroHomeAlt from '@/assets/hero-banner.jpg';
import heroAbout from '@/assets/hero-about.jpg';
import heroContact from '@/assets/hero-contact.jpg';
import heroEvents from '@/assets/hero-events.jpg';
import heroShop from '@/assets/hero-shop.jpg';
import heroTalent from '@/assets/hero-talent-directory.jpg';
import heroHomeNew from '@/assets/hero-home-1920x240.jpg';
import heroShopNew from '@/assets/hero-shop-1920x240.jpg';
import heroTalentNew from '@/assets/hero-talent-directory-1920x240.jpg';
import heroEventsNew from '@/assets/hero-events-1920x240.jpg';
import heroAboutNew from '@/assets/hero-about-1920x240.jpg';
import heroContactNew from '@/assets/hero-contact-1920x240.jpg';
export interface SiteDesignSettings {
  hero: {
    backgroundMedia?: string;
    mediaType?: 'image' | 'video';
    overlayOpacity?: number;
    height?: '240' | '480'; // Only for home page
    position?: { x: number; y: number };
    scale?: number;
  };
  siteBackground?: {
    backgroundImage?: string;
    position?: { x: number; y: number };
    scale?: number;
  };
}

const getPageFromRoute = (): string => {
  const path = window.location.pathname;
  if (path === '/' || path === '/home') return 'home';
  if (path === '/shop') return 'shop';
  if (path === '/talent-directory') return 'talent-directory';
  if (path === '/events') return 'events';
  if (path === '/about') return 'about';
  if (path === '/contact') return 'contact';
  if (path === '/auth') return 'auth';
  if (path.includes('/admin/site-design')) return 'home'; // Default for site design module
  return 'home'; // Default fallback
};

export const useSiteDesign = () => {
  const [settings, setSettings] = useState<Record<string, SiteDesignSettings>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(() => getPageFromRoute());
  const { toast } = useToast();

  // Load all page settings with enhanced debugging
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading site design settings...');
      
      const { data, error } = await supabase
        .from('site_design_settings')
        .select('*');

      if (error) {
        console.error('❌ Error loading site design settings:', error);
        setError('Failed to load site design settings');
        throw error;
      }

      const settingsMap: Record<string, SiteDesignSettings> = {};
      
      if (data) {
        data.forEach((setting) => {
          const settingsData = setting.settings as unknown as SiteDesignSettings;
          settingsMap[setting.page_name] = settingsData;
          console.log(`✅ Loaded settings for ${setting.page_name}:`, {
            hasHero: !!settingsData?.hero,
            heroMedia: settingsData?.hero?.backgroundMedia,
            mediaType: settingsData?.hero?.mediaType
          });
        });
      }

      setSettings(settingsMap);
      console.log('📋 All settings loaded:', Object.keys(settingsMap));
    } catch (error) {
      console.error('💥 Error in loadSettings:', error);
      setError('Unexpected error loading settings');
      toast({
        title: "Error",
        description: "Failed to load design settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Save settings for a specific page
  const savePageSettings = async (pageName: string, pageSettings: SiteDesignSettings) => {
    try {
      const { error } = await supabase
        .from('site_design_settings')
        .upsert({
          page_name: pageName,
          settings: pageSettings as unknown as Record<string, any>,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'page_name'
        });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        [pageName]: pageSettings
      }));

      // Apply settings to CSS immediately
      applySettingsToCSS(pageSettings);

      toast({
        title: "Success",
        description: `Design settings saved for ${pageName}`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save design settings",
        variant: "destructive"
      });
    }
  };

  // Apply settings to CSS for both hero images and site background
  const applySettingsToCSS = (pageSettings: SiteDesignSettings) => {
    // Apply site background globally if it exists
    if (pageSettings.siteBackground?.backgroundImage) {
      const root = document.documentElement;
      root.style.setProperty('--site-background', `url('${pageSettings.siteBackground.backgroundImage}')`);
      console.log('🎨 Applied global site background:', pageSettings.siteBackground.backgroundImage);
    }

    // Add cache-busting parameter to hero media URL
    let heroMediaWithCacheBust = pageSettings.hero?.backgroundMedia;
    if (heroMediaWithCacheBust) {
      const separator = heroMediaWithCacheBust.includes('?') ? '&' : '?';
      heroMediaWithCacheBust = `${heroMediaWithCacheBust}${separator}t=${Date.now()}`;
      console.log('🚫🗃️ Cache-busted hero media URL:', heroMediaWithCacheBust);
    }

    // Force component re-render by updating a timestamp
    window.dispatchEvent(new CustomEvent('heroImageUpdate', { 
      detail: { 
        page: currentPage, 
        timestamp: Date.now(),
        heroMedia: heroMediaWithCacheBust,
        siteBackground: pageSettings.siteBackground?.backgroundImage
      } 
    }));
  };

  // Apply site background from any page settings that have it
  const applySiteBackgroundFromSettings = () => {
    // Look for site background in any page settings
    for (const [pageName, pageSettings] of Object.entries(settings)) {
      if (pageSettings.siteBackground?.backgroundImage) {
        const root = document.documentElement;
        root.style.setProperty('--site-background', `url('${pageSettings.siteBackground.backgroundImage}')`);
        console.log('🎨 Applied site background from', pageName, ':', pageSettings.siteBackground.backgroundImage);
        break; // Use the first one found
      }
    }
  };


  // Upload file to Supabase storage
  const uploadFile = async (file: File, bucket: string = 'design-assets'): Promise<string> => {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('You must be logged in to upload files');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Get current page settings with debugging
  const getCurrentPageSettings = (): SiteDesignSettings => {
    const pageSettings = settings[currentPage];
    console.log(`🎯 Getting settings for page: ${currentPage}`, {
      found: !!pageSettings,
      heroMedia: pageSettings?.hero?.backgroundMedia,
      mediaType: pageSettings?.hero?.mediaType,
      loading: loading
    });
    
    const defaultHeroByPage: Record<string, string> = {
      home: heroHomeNew || heroHome || heroHomeAlt,
      about: heroAboutNew || heroAbout,
      contact: heroContactNew || heroContact,
      events: heroEventsNew || heroEvents,
      shop: heroShopNew || heroShop,
      'talent-directory': heroTalentNew || heroTalent,
      auth: heroHomeAlt
    };
    return pageSettings || {
      hero: { 
        backgroundMedia: defaultHeroByPage[currentPage] || heroHomeAlt,
        mediaType: 'image',
        overlayOpacity: 0.45,
        height: currentPage === 'home' ? '240' : undefined,
        position: { x: 50, y: 50 },
        scale: 100
      }
    };
  };

  // Update current page settings
  const updateCurrentPageSettings = (newSettings: Partial<SiteDesignSettings>) => {
    const currentSettings = getCurrentPageSettings();
    const updatedSettings = {
      ...currentSettings,
      ...newSettings,
      hero: { ...currentSettings.hero, ...newSettings.hero }
    };

    setSettings(prev => ({
      ...prev,
      [currentPage]: updatedSettings
    }));

    // Apply immediately
    applySettingsToCSS(updatedSettings);
  };

  // Listen for route changes to update current page
  useEffect(() => {
    const handleRouteChange = () => {
      const newPage = getPageFromRoute();
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
    
    // Check route on mount
    handleRouteChange();
    
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [currentPage]);

  useEffect(() => {
    loadSettings();
  }, []);

  // Apply current page settings when page changes
  useEffect(() => {
    if (settings[currentPage]) {
      applySettingsToCSS(settings[currentPage]);
    }
    // Always apply site background from any available settings
    applySiteBackgroundFromSettings();
  }, [currentPage, settings]);

  // Apply site background on settings load
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      applySiteBackgroundFromSettings();
    }
  }, [settings]);

  return {
    settings,
    loading,
    error,
    currentPage,
    setCurrentPage,
    getCurrentPageSettings,
    updateCurrentPageSettings,
    savePageSettings,
    uploadFile,
    loadSettings
  };
};