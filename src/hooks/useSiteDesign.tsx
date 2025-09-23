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
import heroHomeNew from '@/assets/hero-home-1920x240-real.jpg';
import heroShopNew from '@/assets/hero-shop-1920x240-real.jpg';
import heroTalentNew from '@/assets/hero-talent-directory-1920x240-real.jpg';
import heroEventsNew from '@/assets/hero-events-1920x240-real.jpg';
import heroAboutNew from '@/assets/hero-about-1920x240-real.jpg';
import heroContactNew from '@/assets/hero-contact-1920x240-real.jpg';
export interface SiteDesignSettings {
  hero: {
    backgroundMedia?: string;
    mediaType?: 'image' | 'video';
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

  // Apply settings to CSS - simplified for hero only
  const applySettingsToCSS = (pageSettings: SiteDesignSettings) => {
    // Force component re-render by updating a timestamp
    window.dispatchEvent(new CustomEvent('heroImageUpdate', { 
      detail: { 
        page: currentPage, 
        timestamp: Date.now(),
        heroMedia: pageSettings.hero?.backgroundMedia
      } 
    }));
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

  // Get current page settings - simplified
  const getCurrentPageSettings = (): SiteDesignSettings => {
    const pageSettings = settings[currentPage];
    console.log(`🎯 Getting settings for page: ${currentPage}`, {
      found: !!pageSettings,
      heroMedia: pageSettings?.hero?.backgroundMedia,
      mediaType: pageSettings?.hero?.mediaType,
      loading: loading
    });

    // Simple defaults - fallback to gradient if no media
    const defaults: SiteDesignSettings = {
      hero: {
        backgroundMedia: '',
        mediaType: 'image'
      }
    };

    if (!pageSettings) return defaults;

    return {
      hero: {
        backgroundMedia: pageSettings.hero?.backgroundMedia || '',
        mediaType: pageSettings.hero?.mediaType || 'image'
      }
    };
  };

  // Update current page settings - simplified
  const updateCurrentPageSettings = (newSettings: Partial<SiteDesignSettings>) => {
    const currentSettings = getCurrentPageSettings();
    const updatedSettings = {
      hero: { 
        ...currentSettings.hero, 
        ...newSettings.hero 
      }
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
  }, [currentPage, settings]);

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