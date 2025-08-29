import { useState, useEffect } from 'react';
import { appearanceApi, AppearanceSettings, defaultAppearanceSettings } from '@/features/appearance/data';

const BACKGROUND_URLS = {
  black: 'none', // Pure black background
  siteImage: "url('/lovable-uploads/d0f4637c-55b5-42eb-af08-29eabb28b253.png')", // Black calendar background
  siteImageWatermark: "url('/lovable-uploads/d0f4637c-55b5-42eb-af08-29eabb28b253.png')" // Black background with watermark
};

export const useBackgroundManager = () => {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const appearanceSettings = await appearanceApi.getSettings();
        setSettings(appearanceSettings);
      } catch (error) {
        console.error('Failed to load appearance settings:', error);
        setSettings(defaultAppearanceSettings);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Listen for appearance settings changes
    const handleSettingsChange = () => {
      loadSettings();
    };

    window.addEventListener('appearance-settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('appearance-settings-changed', handleSettingsChange);
    };
  }, []);

  const getBackgroundStyle = () => {
    const bgMode = settings.bgMode || 'siteImage';
    
    const styles: React.CSSProperties = {
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    };

    switch (bgMode) {
      case 'black':
        styles.backgroundColor = '#000000';
        styles.backgroundImage = 'none';
        break;
      case 'siteImage':
        styles.backgroundImage = BACKGROUND_URLS.siteImage;
        styles.backgroundColor = '#000000'; // Fallback to black
        break;
      case 'siteImage+watermark':
        styles.backgroundImage = BACKGROUND_URLS.siteImageWatermark;
        styles.backgroundColor = '#000000'; // Fallback to black
        // Watermark will be handled by BackgroundManager component
        break;
      default:
        styles.backgroundImage = BACKGROUND_URLS.siteImage;
        styles.backgroundColor = '#000000';
    }

    return styles;
  };

  const getBackgroundImageUrl = () => {
    const bgMode = settings.bgMode || 'siteImage';
    
    switch (bgMode) {
      case 'black':
        return 'none';
      case 'siteImage':
      case 'siteImage+watermark':
        return "url('/lovable-uploads/d0f4637c-55b5-42eb-af08-29eabb28b253.png')";
      default:
        return "url('/lovable-uploads/d0f4637c-55b5-42eb-af08-29eabb28b253.png')";
    }
  };

  return {
    settings,
    loading,
    getBackgroundStyle,
    getBackgroundImageUrl
  };
};