import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SiteDesignSettings {
  background: {
    type: 'color' | 'image' | 'gradient';
    value: string;
    opacity?: number;
  };
  hero: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    overlayOpacity?: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    foreground?: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout?: {
    containerWidth?: string;
    spacing?: string;
  };
}

export const useSiteDesign = () => {
  const [settings, setSettings] = useState<Record<string, SiteDesignSettings>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const { toast } = useToast();

  // Load all page settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_design_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, SiteDesignSettings> = {};
      data?.forEach((setting) => {
        settingsMap[setting.page_name] = setting.settings as unknown as SiteDesignSettings;
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error loading site design settings:', error);
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

  // Apply settings to CSS variables
  const applySettingsToCSS = (pageSettings: SiteDesignSettings) => {
    const root = document.documentElement;

    // Apply colors
    if (pageSettings.colors.primary) {
      root.style.setProperty('--primary', pageSettings.colors.primary.replace('hsl(', '').replace(')', ''));
    }
    if (pageSettings.colors.secondary) {
      root.style.setProperty('--secondary', pageSettings.colors.secondary.replace('hsl(', '').replace(')', ''));
    }
    if (pageSettings.colors.accent) {
      root.style.setProperty('--accent', pageSettings.colors.accent.replace('hsl(', '').replace(')', ''));
    }

    // Apply background
    if (pageSettings.background.type === 'image' && pageSettings.background.value) {
      root.style.setProperty('--site-background', `url('${pageSettings.background.value}')`);
    } else if (pageSettings.background.type === 'color') {
      root.style.setProperty('--site-background', pageSettings.background.value);
    }

    // Apply fonts by loading Google Fonts
    if (pageSettings.fonts.heading !== 'Inter') {
      loadGoogleFont(pageSettings.fonts.heading);
      root.style.setProperty('--font-heading', `'${pageSettings.fonts.heading}', sans-serif`);
    }
    if (pageSettings.fonts.body !== 'Inter') {
      loadGoogleFont(pageSettings.fonts.body);
      root.style.setProperty('--font-body', `'${pageSettings.fonts.body}', sans-serif`);
    }
  };

  // Load Google Font dynamically
  const loadGoogleFont = (fontName: string) => {
    if (fontName === 'Inter') return; // Already loaded

    const existingLink = document.querySelector(`link[href*="${fontName.replace(' ', '+')}"]`);
    if (existingLink) return; // Already loaded

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  // Upload file to Supabase storage
  const uploadFile = async (file: File, bucket: string = 'design-assets'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Get current page settings
  const getCurrentPageSettings = (): SiteDesignSettings => {
    return settings[currentPage] || {
      background: { type: 'image', value: "url('/lovable-uploads/bb29cf4b-64ec-424f-8221-3b283256e06d.png')" },
      hero: { 
        title: 'Page Title', 
        subtitle: 'Page subtitle',
        backgroundImage: '/src/assets/hero-banner-main.jpg',
        overlayOpacity: 0.5
      },
      colors: {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))'
      },
      fonts: { heading: 'Inter', body: 'Inter' }
    };
  };

  // Update current page settings
  const updateCurrentPageSettings = (newSettings: Partial<SiteDesignSettings>) => {
    const currentSettings = getCurrentPageSettings();
    const updatedSettings = {
      ...currentSettings,
      ...newSettings,
      colors: { ...currentSettings.colors, ...newSettings.colors },
      hero: { ...currentSettings.hero, ...newSettings.hero },
      background: { ...currentSettings.background, ...newSettings.background },
      fonts: { ...currentSettings.fonts, ...newSettings.fonts }
    };

    setSettings(prev => ({
      ...prev,
      [currentPage]: updatedSettings
    }));

    // Apply immediately for live preview
    applySettingsToCSS(updatedSettings);
  };

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
    currentPage,
    setCurrentPage,
    getCurrentPageSettings,
    updateCurrentPageSettings,
    savePageSettings,
    uploadFile,
    loadSettings
  };
};