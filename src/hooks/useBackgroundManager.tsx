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
    // DISABLED: Background manager completely disabled
    // Global black background is enforced via CSS
    return {};
  };

  const getBackgroundImageUrl = () => {
    // DISABLED: Background manager completely disabled
    return '';
  };

  return {
    settings,
    loading,
    getBackgroundStyle,
    getBackgroundImageUrl
  };
};