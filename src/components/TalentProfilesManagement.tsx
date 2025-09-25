import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
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
import { Plus, Edit, Trash2, GripVertical, User, Users, UserPlus, Lock, Unlock, ExternalLink } from "lucide-react";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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

// Draggable card component for talent profiles
const DraggableCard = ({ children, id, index, moveCard, isDragEnabled }: any) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'talent',
    item: { id, index },
    canDrag: isDragEnabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'talent',
    hover: (item: any) => {
      if (!isDragEnabled || item.index === index) return;
      moveCard(item.index, index);
      item.index = index;
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={isDragEnabled ? 'cursor-move' : 'cursor-default'}
    >
      {children}
    </div>
  );
};

interface TalentProfilesManagementProps {
  language?: 'en' | 'es';
}

export const TalentProfilesManagement: React.FC<TalentProfilesManagementProps> = ({ 
  language = 'en' 
}) => {
  const { user, profile } = useAuth();
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
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectingTalent, setConnectingTalent] = useState<TalentProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  // Module Layout state
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [cardOrder, setCardOrder] = useState<number[]>([]);
  
  const { toast } = useToast();

  // Check if user has permission
  if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize card order when talents load
  useEffect(() => {
    if (talents.length > 0) {
      setCardOrder(talents.map((_, index) => index));
    }
  }, [talents]);

  // Module Layout functions
  const moveCard = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...cardOrder];
    const draggedCard = newOrder[dragIndex];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedCard);
    setCardOrder(newOrder);
  };

  const updateSortOrder = async (newOrder: number[]) => {
    try {
      const updates = newOrder.map((originalIndex, newIndex) => ({
        id: talents[originalIndex].id,
        sort_rank: newIndex
      }));

      const { error } = await supabase.rpc('update_talent_sort_order', {
        talent_updates: updates
      });

      if (error) throw error;

      toast({
        title: language === 'en' ? "Success" : "Éxito",
        description: language === 'en' ? "Talent order updated successfully" : "Orden de talentos actualizado exitosamente",
      });

      // Refresh data to reflect new order
      await fetchData();
    } catch (error) {
      console.error('Error updating sort order:', error);
      toast({
        title: language === 'en' ? "Error" : "Error",
        description: language === 'en' ? "Failed to update talent order" : "No se pudo actualizar el orden de talentos",
        variant: "destructive",
      });
    }
  };

  const content = {
    en: {
      talentProfiles: "Talent Profiles",
      moduleLayout: "Module Layout",
      unlockToReorder: "Unlock to reorder talent profiles",
      lockOrder: "Lock talent order",
      dragToReorder: "Drag talent profiles to reorder them",
      addTalent: "Add Talent Profile",
      editTalent: "Edit Talent Profile",
      name: "Name",
      bio: "Biography",
      headshot: "Headshot Photo",
      active: "Active",
      publicVisibility: "Public Visibility",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      connectUser: "Connect User",
      buildoutSheet: "Buildout Sheet",
      cleanupProfiles: "Cleanup Profiles",
      selectUser: "Select User",
      connect: "Connect",
      noTalentsYet: "No talent profiles created yet",
      createFirst: "Create your first talent profile to get started"
    },
    es: {
      talentProfiles: "Perfiles de Talento",
      moduleLayout: "Diseño de Módulo",
      unlockToReorder: "Desbloquear para reordenar perfiles de talento",
      lockOrder: "Bloquear orden de talento",
      dragToReorder: "Arrastra los perfiles de talento para reordenarlos",
      addTalent: "Agregar Perfil de Talento",
      editTalent: "Editar Perfil de Talento",
      name: "Nombre",
      bio: "Biografía",
      headshot: "Foto de Perfil",
      active: "Activo",
      publicVisibility: "Visibilidad Pública",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      connectUser: "Conectar Usuario",
      buildoutSheet: "Hoja de Desarrollo",
      cleanupProfiles: "Limpiar Perfiles",
      selectUser: "Seleccionar Usuario",
      connect: "Conectar",
      noTalentsYet: "Aún no hay perfiles de talento creados",
      createFirst: "Crea tu primer perfil de talento para comenzar"
    }
  };

  const t = content[language];

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

  // Utility functions - Use the improved server-side slug generation
  const generateSlug = async (name: string, excludeId?: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_unique_talent_slug', {
        p_name: name,
        p_exclude_id: excludeId || null
      });
      
      if (error) {
        console.error('Error generating slug:', error);
        // Fallback to basic client-side generation
        return name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }
      
      return data;
    } catch (err) {
      console.error('Error in generateSlug:', err);
      // Fallback to basic client-side generation
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
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

      const slug = await generateSlug(formData.name, editingTalent?.id);
      
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
    
    const { data } = supabase.storage
      .from('talent-headshots')
      .getPublicUrl(url);
    return data.publicUrl;
  };

  const toggleTalentStatus = async (talent: TalentProfile, field: 'active' | 'public_visibility') => {
    try {
      const { error } = await supabase
        .from('talent_profiles')
        .update({ [field]: !talent[field] })
        .eq('id', talent.id);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Success",
        description: `Talent ${field} status updated`,
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${field} status`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading talent profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t.talentProfiles}</h2>
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t.addTalent}
            </Button>
          </div>
        </div>

        {/* Control Bar - Module Layout */}
        <Card className="border-2 rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Module Layout Controls */}
                <div className="flex items-center gap-3">
                  {isDragEnabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  <span className="text-sm font-medium">{t.moduleLayout}</span>
                  <Switch
                    checked={isDragEnabled}
                    onCheckedChange={setIsDragEnabled}
                  />
                  <span className="text-xs opacity-70">
                    {isDragEnabled 
                      ? (language === 'en' ? 'Unlocked' : 'Desbloqueado')
                      : (language === 'en' ? 'Locked' : 'Bloqueado')
                    }
                  </span>
                  {isDragEnabled && (
                    <Button
                      onClick={() => updateSortOrder(cardOrder)}
                      size="sm"
                      variant="outline"
                    >
                      {language === 'en' ? 'Save Order' : 'Guardar Orden'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={runCleanup} variant="outline" size="sm">
                  {t.cleanupProfiles}
                </Button>
              </div>
            </div>
            {isDragEnabled && (
              <p className="text-xs text-muted-foreground mt-2">
                {t.dragToReorder}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Talent Profiles Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {talents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.noTalentsYet}</h3>
              <p className="text-muted-foreground mb-4">{t.createFirst}</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t.addTalent}
              </Button>
            </div>
          ) : (
            cardOrder.map((originalIndex) => {
              const talent = talents[originalIndex];
              if (!talent) return null;

              return (
                <DraggableCard
                  key={talent.id}
                  id={talent.id}
                  index={cardOrder.indexOf(originalIndex)}
                  moveCard={moveCard}
                  isDragEnabled={isDragEnabled}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {isDragEnabled && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                          <div>
                            <CardTitle className="text-lg">{talent.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">/{talent.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={talent.active}
                            onCheckedChange={() => toggleTalentStatus(talent, 'active')}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {talent.headshot_url && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={getImageUrl(talent.headshot_url) || ''}
                              alt={talent.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{t.publicVisibility}:</span>
                          <Switch
                            checked={talent.public_visibility}
                            onCheckedChange={() => toggleTalentStatus(talent, 'public_visibility')}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            onClick={() => openEditForm(talent)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {t.edit}
                          </Button>
                          
                          <Button
                            onClick={() => deleteTalent(talent.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {t.delete}
                          </Button>
                          
                          {!talent.user_id && (
                            <Button
                              onClick={() => openConnectDialog(talent)}
                              size="sm"
                              variant="secondary"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              {t.connectUser}
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => window.open(`/admin/talent-buildout/${talent.id}`, '_blank')}
                            size="sm"
                            variant="outline"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {t.buildoutSheet}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableCard>
              );
            })
          )}
        </div>

        {/* Talent Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTalent ? t.editTalent : t.addTalent}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="bio">{t.bio}</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="headshot">{t.headshot}</Label>
                <Input
                  id="headshot"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHeadshotFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">{t.active}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="public_visibility"
                  checked={formData.public_visibility}
                  onCheckedChange={(checked) => setFormData({ ...formData, public_visibility: checked })}
                />
                <Label htmlFor="public_visibility">{t.publicVisibility}</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t.cancel}
                </Button>
                <Button type="submit">{t.save}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Connect User Dialog */}
        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.connectUser}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>{t.selectUser}</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConnectDialog(false)}
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={connectTalentToUser}
                  disabled={!selectedUserId}
                >
                  {t.connect}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
};