import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Temporary types until database migration is applied
export interface TalentAsset {
  id: string;
  talent_id: string;
  category: string;
  format: string | null;
  file_size: number | null;
  content_data: any | null;
  is_featured: boolean | null;
  display_order: number | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  title: string;
  description: string | null;
  file_url: string | null;
}

export type TalentAssetInsert = Omit<TalentAsset, 'id' | 'created_at' | 'updated_at'>;
export type TalentAssetUpdate = Partial<TalentAssetInsert>;

export type AssetCategory = 'headshot' | 'character_image' | 'bio' | 'promo_video';
export type AssetFormat = 'jpg' | 'png' | 'mp4' | 'pdf' | 'doc';

export interface WatermarkSettings {
  id: string;
  logo_url: string | null;
  business_logo_url: string | null;
  logo_size: number;
  opacity: number;
  default_position: string;
  business_position: string;
  updated_at: string;
  updated_by: string | null;
}

// Talent Assets API
export const talentAssetsApi = {
  // Get all assets for a talent
  async getAssetsByTalent(talentId: string): Promise<TalentAsset[]> {
    const { data, error } = await supabase
      .from('talent_assets')
      .select('*')
      .eq('talent_id', talentId)
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching talent assets:', error);
      return [];
    }
    return data || [];
  },

  // Get assets by category
  async getAssetsByCategory(talentId: string, category: AssetCategory): Promise<TalentAsset[]> {
    const { data, error } = await supabase
      .from('talent_assets')
      .select('*')
      .eq('talent_id', talentId)
      .eq('category', category)
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching talent assets by category:', error);
      return [];
    }
    return data || [];
  },

  // Create new asset
  async createAsset(asset: TalentAssetInsert): Promise<TalentAsset> {
    const { data, error } = await supabase
      .from('talent_assets')
      .insert(asset)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update asset
  async updateAsset(id: string, updates: TalentAssetUpdate): Promise<TalentAsset> {
    const { data, error } = await supabase
      .from('talent_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete asset
  async deleteAsset(id: string): Promise<void> {
    const { error } = await supabase
      .from('talent_assets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Upload file to storage
  async uploadFile(
    bucket: string,
    filePath: string,
    file: File,
    options?: { cacheControl?: string; upsert?: boolean }
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, options);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  // Delete file from storage
  async deleteFile(bucket: string, filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  }
};

// Watermark Settings API
export const watermarkApi = {
  // Get watermark settings
  async getSettings(): Promise<WatermarkSettings | null> {
    const { data, error } = await supabase
      .from('watermark_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching watermark settings:', error);
      return null;
    }
    return data;
  },

  // Update watermark settings
  async updateSettings(settings: Partial<WatermarkSettings>): Promise<WatermarkSettings> {
    const { data, error } = await supabase
      .from('watermark_settings')
      .upsert(settings)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Business Talent Access API
export const businessTalentAccessApi = {
  // Check if business user has access to talent
  async hasAccessToTalent(talentId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('business_talent_access')
      .select('talent_id')
      .eq('talent_id', talentId)
      .maybeSingle();

    if (error) {
      console.error('Error checking talent access:', error);
      return false;
    }
    return !!data;
  },

  // Get accessible talents for business user
  async getAccessibleTalents(): Promise<string[]> {
    const { data, error } = await supabase
      .from('business_talent_access')
      .select('talent_id');

    if (error) {
      console.error('Error fetching accessible talents:', error);
      return [];
    }
    return data?.map(item => item.talent_id) || [];
  }
};

// Get all talents with user accounts
export const getTalentsWithUsers = async () => {
  const { data, error } = await supabase
    .from('talent_profiles')
    .select(`
      id,
      name,
      slug,
      active,
      user_id
    `)
    .eq('active', true);

  if (error) {
    console.error('Error fetching talents:', error);
    return [];
  }
  return data || [];
};

// Helper functions
export const getAssetBucket = (category: AssetCategory): string => {
  switch (category) {
    case 'headshot':
      return 'talent-headshots';
    case 'character_image':
      return 'talent-character-images';
    case 'promo_video':
      return 'talent-promo-videos';
    default:
      return 'talent-images';
  }
};

export const getAssetPath = (talentId: string, category: AssetCategory, fileName: string): string => {
  return `${talentId}/${category}/${fileName}`;
};

export const validateFileType = (file: File, category: AssetCategory): boolean => {
  const allowedTypes: Record<AssetCategory, string[]> = {
    headshot: ['image/jpeg', 'image/png'],
    character_image: ['image/jpeg', 'image/png'],
    bio: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    promo_video: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
  };

  return allowedTypes[category]?.includes(file.type) || false;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};