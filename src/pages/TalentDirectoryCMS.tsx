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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GripVertical, ArrowLeft, User, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AdminThemeProvider from '@/components/AdminThemeProvider';
import AdminHeader from '@/components/AdminHeader';
import { useColorTheme } from '@/hooks/useColorTheme';

interface TalentProfile {
  id: string;
  name: string;
  slug: string;
  headshot_url: string | null;
  bio: string | null;
  active: boolean;
  sort_rank: number;
}

interface TalentFormData {
  name: string;
  bio: string;
  active: boolean;
}

const TalentDirectoryCMS = () => {
  const { user, profile } = useAuth();
  const { currentTheme } = useColorTheme();
  const navigate = useNavigate();
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTalent, setEditingTalent] = useState<TalentProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TalentFormData>({
    name: '',
    bio: '',
    active: true
  });
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
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

      setTalents(talentData || []);
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
    // More flexible image validation - no strict size requirements
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size too large. Please choose a file under 10MB.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('talent-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let headshot_url = editingTalent?.headshot_url;

      if (headshotFile) {
        headshot_url = await uploadImage(headshotFile, 'headshots');
      }

      const slug = generateSlug(formData.name);
      
      const payload = {
        name: formData.name,
        slug,
        bio: formData.bio,
        headshot_url,
        active: formData.active,
        sort_rank: editingTalent?.sort_rank ?? talents.length,
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
      resetForm();
      
      toast({
        title: "Success",
        description: `Talent ${editingTalent ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving talent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save talent",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', bio: '', active: true });
    setHeadshotFile(null);
    setEditingTalent(null);
    setShowForm(false);
  };

  const openEditForm = (talent: TalentProfile) => {
    setFormData({
      name: talent.name,
      bio: talent.bio || '',
      active: talent.active
    });
    setEditingTalent(talent);
    setShowForm(true);
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

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${supabase.storage.from('talent-images').getPublicUrl(url).data.publicUrl}`;
  };

  if (loading) {
    return (
      <AdminThemeProvider>
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-white">Loading talent directory...</div>
          </div>
        </div>
        <Footer language={language} />
      </AdminThemeProvider>
    );
  }

  return (
    <AdminThemeProvider>
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <AdminHeader
          title="Talent Directory Management"
          description="Manage talent profiles and directory settings"
          language={language}
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5" style={{ color: currentTheme.accent }} />
            <span className="text-sm font-medium">
              {language === 'en' ? 'Talent Management' : 'Gestión de Talentos'}
            </span>
          </div>
        </AdminHeader>

        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/admin')}
            style={{
              backgroundColor: 'transparent',
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
          <Button 
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{
              backgroundColor: currentTheme.accent,
              color: 'white',
              borderColor: currentTheme.accent
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Talent
          </Button>
        </div>

        {/* Talent List */}
        <Card 
          className="border-2"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.border,
            color: currentTheme.cardForeground
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: currentTheme.accent }}>Talent Profiles</CardTitle>
          </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {talents.map((talent) => (
                  <div key={talent.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    {talent.headshot_url && (
                      <img 
                        src={getImageUrl(talent.headshot_url)} 
                        alt={talent.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    {!talent.headshot_url && (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
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
                      onClick={() => openEditForm(talent)}
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
      
      <Footer language={language} />

      {/* Talent Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTalent ? 'Edit Talent' : 'Add New Talent'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                placeholder="Tell us about this talent..."
              />
            </div>

            <div>
              <Label htmlFor="headshot">Headshot Image</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Recommended: Square format (e.g., 400x400px) for best results. Max file size: 10MB.
              </p>
              <Input
                id="headshot"
                type="file"
                accept="image/*"
                onChange={(e) => setHeadshotFile(e.target.files?.[0] || null)}
              />
              {editingTalent?.headshot_url && !headshotFile && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Current headshot:</p>
                  <img 
                    src={getImageUrl(editingTalent.headshot_url)} 
                    alt="Current headshot"
                    className="w-20 h-20 rounded-full object-cover mt-1"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">Active (visible on website)</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">
                {editingTalent ? 'Update Talent' : 'Create Talent'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminThemeProvider>
  );
};

export default TalentDirectoryCMS;