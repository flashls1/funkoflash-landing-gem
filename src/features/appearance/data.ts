import { supabase } from '@/integrations/supabase/client';

export interface AppearanceSettings {
  bgMode: 'black' | 'siteImage' | 'siteImage+watermark';
  watermarkOpacity: number;
  watermarkScale: number;
  rippleEnabled: boolean;
  rippleIntensity: number;
  rippleFollow: 'cursor' | 'auto';
}

export const defaultAppearanceSettings: AppearanceSettings = {
  bgMode: 'siteImage', // Default to respecting site design
  watermarkOpacity: 0.04,
  watermarkScale: 1.0,
  rippleEnabled: false,
  rippleIntensity: 0.75,
  rippleFollow: 'cursor'
};

export const appearanceApi = {
  async getSettings(): Promise<AppearanceSettings> {
    const { data, error } = await supabase
      .from('ui_settings')
      .select('value')
      .eq('key', 'appearance')
      .single();

    if (error || !data) {
      return defaultAppearanceSettings;
    }

    return { ...defaultAppearanceSettings, ...(data.value as any) } as AppearanceSettings;
  },

  async saveSettings(settings: AppearanceSettings): Promise<void> {
    const { error } = await supabase
      .from('ui_settings')
      .upsert({
        key: 'appearance',
        value: settings as any,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) throw error;
  },

  async getSiteImageUrl(): Promise<string | null> {
    // Get the site background image from site_design_settings
    const { data, error } = await supabase
      .from('site_design_settings')
      .select('settings')
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Look for hero settings that might contain background image
    for (const setting of data) {
      const settings = setting.settings as any;
      if (settings?.hero?.backgroundImage) {
        return settings.hero.backgroundImage;
      }
      if (settings?.backgroundImage) {
        return settings.backgroundImage;
      }
    }

    return null;
  }
};