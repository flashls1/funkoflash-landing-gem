import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GripVertical, Upload, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface TalentProfile {
  id: string;
  name: string;
  slug: string;
  headshot_url: string | null;
  bio: string | null;
  active: boolean;
  sort_rank: number;
}

interface DirectorySettings {
  id: string;
  banner_image_url: string | null;
  banner_alt_text: string | null;
}

const TalentDirectoryCMS = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [settings, setSettings] = useState<DirectorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTalent, setEditingTalent] = useState<TalentProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { toast } = useToast();

  // Check if user has permission
  if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch talent profiles
      const { data: talentData, error: talentError } = await supabase
        .from('talent_profiles')
        .select('*')
        .order('sort_rank', { ascending: true });

      if (talentError) throw talentError;

      // Fetch directory settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('directory_settings')
        .select('*')
        .limit(1)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      setTalents(talentData || []);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load talent directory data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const uploadImage = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('talent-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    return filePath;
  };

  const saveTalent = async (talentData: Partial<TalentProfile>, headshotFile?: File) => {
    try {
      let headshot_url = talentData.headshot_url;

      if (headshotFile) {
        headshot_url = await uploadImage(headshotFile, 'headshots');
      }

      const slug = talentData.slug || generateSlug(talentData.name || '');
      
      const payload = {
        ...talentData,
        name: talentData.name || '',
        slug,
        headshot_url,
        sort_rank: talentData.sort_rank ?? talents.length,
      };

      if (editingTalent) {
        const { error } = await supabase
          .from('talent_profiles')
          .update(payload)
          .eq('id', editingTalent.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('talent_profiles')
          .insert(payload);
        
        if (error) throw error;
      }

      await fetchData();
      setEditingTalent(null);
      setShowForm(false);
      
      toast({
        title: "Success",
        description: `Talent ${editingTalent ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving talent:', error);
      toast({
        title: "Error",
        description: "Failed to save talent",
        variant: "destructive",
      });
    }
  };

  const deleteTalent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('talent_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Success",
        description: "Talent deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting talent:', error);
      toast({
        title: "Error",
        description: "Failed to delete talent",
        variant: "destructive",
      });
    }
  };

  const updateBanner = async () => {
    try {
      let banner_image_url = settings?.banner_image_url;

      if (bannerFile) {
        banner_image_url = await uploadImage(bannerFile, 'banners');
      }

      const payload = {
        banner_image_url,
        banner_alt_text: settings?.banner_alt_text || 'Talent Directory Banner',
        updated_by: profile.id,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('directory_settings')
          .update(payload)
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('directory_settings')
          .insert(payload);
        
        if (error) throw error;
      }

      await fetchData();
      setBannerFile(null);
      
      toast({
        title: "Success",
        description: "Banner updated successfully",
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      toast({
        title: "Error",
        description: "Failed to update banner",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundImage: 'var(--site-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="pt-20 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'var(--site-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navigation language={language} setLanguage={setLanguage} />
      
      <main className="pt-20 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Back to Admin Dashboard Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Talent Directory Management</h1>
            <Button onClick={() => {
              setEditingTalent(null);
              setShowForm(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Talent
            </Button>
          </div>

          {/* Banner Management */}
          <Card>
            <CardHeader>
              <CardTitle>Directory Banner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="banner-upload">Banner Image (1920px width recommended)</Label>
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label htmlFor="banner-alt">Alt Text</Label>
                <Input
                  id="banner-alt"
                  value={settings?.banner_alt_text || ''}
                  onChange={(e) => setSettings(prev => prev ? 
                    {...prev, banner_alt_text: e.target.value} : 
                    {id: '', banner_image_url: null, banner_alt_text: e.target.value}
                  )}
                />
              </div>
              <Button onClick={updateBanner}>
                <Upload className="w-4 h-4 mr-2" />
                Update Banner
              </Button>
            </CardContent>
          </Card>

          {/* Talent List */}
          <Card>
            <CardHeader>
              <CardTitle>Talent Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {talents.map((talent) => (
                  <div key={talent.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{talent.name}</h3>
                      <p className="text-sm text-muted-foreground">/{talent.slug}</p>
                    </div>
                    <Switch 
                      checked={talent.active}
                      onCheckedChange={async (checked) => {
                        try {
                          const { error } = await supabase
                            .from('talent_profiles')
                            .update({ active: checked })
                            .eq('id', talent.id);
                          
                          if (error) throw error;
                          await fetchData();
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update talent status",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTalent(talent);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this talent?')) {
                          deleteTalent(talent.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
};

export default TalentDirectoryCMS;