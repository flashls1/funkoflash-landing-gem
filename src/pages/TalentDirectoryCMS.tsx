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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GripVertical, ArrowLeft, User, Users, UserPlus } from "lucide-react";
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
  public_visibility: boolean;
  sort_rank: number;
  user_id?: string | null;
}

interface AvailableUser {
  user_id: string;
  name: string;
  email: string;
}

interface TalentFormData {
  name: string;
  bio: string;
  active: boolean;
  public_visibility: boolean;
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
    active: true,
    public_visibility: false
  });
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectingTalent, setConnectingTalent] = useState<TalentProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
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
      // Fetch all active talent profiles - now including admin-created profiles without users
      const { data: talentData, error: talentError } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('active', true)
        .order('sort_rank', { ascending: true });

      if (talentError) {
        console.error('Error fetching talent profiles:', talentError);
        throw talentError;
      }

      console.log('Fetched talent profiles:', talentData?.length || 0);
      setTalents(talentData);
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

  const runCleanup = async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_business_talent_profiles');
      
      if (error) {
        console.error('Error running cleanup:', error);
        toast({
          title: "Error",
          description: "Error running cleanup",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        toast({
          title: "Success",
          description: `Cleaned up ${data.length} orphaned talent profiles`,
        });
        fetchData(); // Refresh the list
      } else {
        toast({
          title: "Info",
          description: "No orphaned talent profiles found",
        });
      }
    } catch (err) {
      console.error('Error in cleanup:', err);
      toast({
        title: "Error",
        description: "Error running cleanup",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_talent_users');
      
      if (error) {
        console.error('Error fetching available users:', error);
        toast({
          title: "Error",
          description: "Error fetching available users",
          variant: "destructive",
        });
        return;
      }

      setAvailableUsers(data || []);
    } catch (err) {
      console.error('Error in fetchAvailableUsers:', err);
      toast({
        title: "Error",
        description: "Error fetching available users",
        variant: "destructive",
      });
    }
  };

  const connectTalentToUser = async () => {
    if (!selectedUserId || !connectingTalent) return;

    try {
      const { error } = await supabase.rpc('connect_talent_to_user', {
        p_talent_id: connectingTalent.id,
        p_user_id: selectedUserId
      });

      if (error) {
        console.error('Error connecting talent to user:', error);
        toast({
          title: "Error",
          description: error.message || "Error connecting talent to user",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Successfully connected ${connectingTalent.name} to user account`,
      });

      setShowConnectDialog(false);
      setConnectingTalent(null);
      setSelectedUserId('');
      fetchData(); // Refresh the list
    } catch (err) {
      console.error('Error in connectTalentToUser:', err);
      toast({
        title: "Error",
        description: "Error connecting talent to user",
        variant: "destructive",
      });
    }
  };

  const openConnectDialog = async (talent: TalentProfile) => {
    setConnectingTalent(talent);
    setSelectedUserId('');
    await fetchAvailableUsers();
    setShowConnectDialog(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const uploadImage = async (file: File, folder: string, existingPath?: string) => {
    // More flexible image validation - no strict size requirements
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size too large. Please choose a file under 10MB.');
    }

    console.log('Auto-resizing image to 400x400px...');
    
    // Auto-resize image to 400x400px for consistent display
    const { resizeTalentHeadshot } = await import('@/utils/imageResize');
    const resizedFile = await resizeTalentHeadshot(file);

    const fileExt = resizedFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log('Uploading resized image to:', filePath);

    // If there's an existing image, try to delete it first
    if (existingPath) {
      console.log('Deleting existing image:', existingPath);
      const { error: deleteError } = await supabase.storage
        .from('talent-headshots')
        .remove([existingPath]);
      
      if (deleteError) {
        console.warn('Failed to delete existing image:', deleteError);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from('talent-headshots')
      .upload(filePath, resizedFile);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('Image uploaded successfully to:', filePath);
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let headshot_url = editingTalent?.headshot_url;

      if (headshotFile) {
        console.log('Uploading new headshot for:', formData.name);
        headshot_url = await uploadImage(headshotFile, 'headshots', editingTalent?.headshot_url || undefined);
        console.log('New headshot URL:', headshot_url);
      }

      const slug = generateSlug(formData.name);
      
      const payload = {
        name: formData.name,
        slug,
        bio: formData.bio,
        headshot_url,
        active: formData.active,
        public_visibility: formData.public_visibility,
        sort_rank: editingTalent?.sort_rank ?? talents.length,
      };

      if (editingTalent) {
        const { error } = await supabase
          .from('talent_profiles')
          .update(payload)
          .eq('id', editingTalent.id);
        
        if (error) throw error;
      } else {
        // Use the secure database function for creating admin talent profiles
        console.log('Creating new talent profile using admin function...');
        
        const { data: talentId, error } = await supabase
          .rpc('create_admin_talent_profile', {
            p_name: formData.name,
            p_slug: slug,
            p_bio: formData.bio,
            p_headshot_url: headshot_url,
            p_active: formData.active,
            p_sort_rank: talents.length,
            p_public_visibility: formData.public_visibility
          });
        
        if (error) {
          console.error('Error creating talent profile:', error);
          throw error;
        }
        
        console.log('Talent profile created with ID:', talentId);
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
    setFormData({ name: '', bio: '', active: true, public_visibility: false });
    setHeadshotFile(null);
    setEditingTalent(null);
    setShowForm(false);
  };

  const openEditForm = (talent: TalentProfile) => {
    setFormData({
      name: talent.name,
      bio: talent.bio || '',
      active: talent.active,
      public_visibility: talent.public_visibility || false
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
    const publicUrl = supabase.storage.from('talent-headshots').getPublicUrl(url).data.publicUrl;
    // Add timestamp for cache busting
    return `${publicUrl}?t=${Date.now()}`;
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
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={runCleanup}
              style={{
                backgroundColor: 'transparent',
                borderColor: currentTheme.border,
                color: currentTheme.cardForeground
              }}
            >
              🧹 Cleanup Orphaned Profiles
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
                       <p className="text-xs text-muted-foreground">
                         {talent.public_visibility ? '🌐 Public' : '🔒 Private'}
                         {talent.user_id ? ' • 👤 Connected' : ' • 📋 Admin-created'}
                       </p>
                     </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <label className="text-xs text-muted-foreground">Active</label>
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
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <label className="text-xs text-muted-foreground">Public</label>
                        <Switch 
                          checked={talent.public_visibility}
                          onCheckedChange={async (checked) => {
                            try {
                              const { error } = await supabase
                                .from('talent_profiles')
                                .update({ public_visibility: checked })
                                .eq('id', talent.id);
                              
                              if (error) throw error;
                              await fetchData();
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update talent visibility",
                                variant: "destructive",
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => navigate(`/admin/talent-buildout/${talent.id}`)}
                       title="Build Out Sheet"
                     >
                       📝
                     </Button>
                     {!talent.user_id && (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => openConnectDialog(talent)}
                         title="Connect to User Account"
                         style={{
                           borderColor: currentTheme.accent,
                           color: currentTheme.accent
                         }}
                       >
                         <UserPlus className="w-4 h-4" />
                       </Button>
                     )}
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
              <Label htmlFor="headshot">Headshot Image (Auto-resizes to 400x400px)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload any image - it will be automatically resized to 400x400px for optimal display. Max file size: 10MB.
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

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Active (visible in system)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="public_visibility"
                  checked={formData.public_visibility}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, public_visibility: checked }))}
                />
                <Label htmlFor="public_visibility">Public (visible on public talent directory)</Label>
              </div>
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

      {/* Connect Talent Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Talent to User Account</DialogTitle>
          </DialogHeader>
          
          {connectingTalent && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold">{connectingTalent.name}</h4>
                <p className="text-sm text-muted-foreground">
                  This talent profile will be connected to a user account, allowing them to login and manage their own profile.
                </p>
              </div>

              <div>
                <Label htmlFor="user-select">Select User Account</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user to connect..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No available talent users found. Users must have the "talent" role and not be already connected to a talent profile.
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={connectTalentToUser}
                  disabled={!selectedUserId}
                  style={{
                    backgroundColor: currentTheme.accent,
                    color: 'white'
                  }}
                >
                  Connect Talent
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowConnectDialog(false);
                    setConnectingTalent(null);
                    setSelectedUserId('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminThemeProvider>
  );
};

export default TalentDirectoryCMS;