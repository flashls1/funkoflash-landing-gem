import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, Camera, Save, X } from 'lucide-react';

interface ProfileManagerProps {
  language: 'en' | 'es';
}

const ProfileManager = ({ language }: ProfileManagerProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: '',
    status: 'online',
    name_color: '#ffffff',
    background_image_url: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const content = {
    en: {
      profile: "Profile",
      editProfile: "Edit Profile",
      updateProfile: "Update Profile",
      cancel: "Cancel",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone",
      role: "Role",
      changePhoto: "Change Photo",
      uploadPhoto: "Upload Photo",
      status: "Status",
      nameColor: "Name Color",
      backgroundImage: "Background Image",
      changeBackground: "Change Background",
      online: "Online Now",
      offline: "Offline", 
      invisible: "Invisible",
      profileUpdated: "Profile updated successfully",
      uploadFailed: "Failed to upload image",
      updateFailed: "Failed to update profile"
    },
    es: {
      profile: "Perfil",
      editProfile: "Editar Perfil",
      updateProfile: "Actualizar Perfil",
      cancel: "Cancelar",
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Correo Electrónico",
      phone: "Teléfono",
      role: "Rol",
      changePhoto: "Cambiar Foto",
      uploadPhoto: "Subir Foto",
      status: "Estado",
      nameColor: "Color del Nombre",
      backgroundImage: "Imagen de Fondo",
      changeBackground: "Cambiar Fondo",
      online: "En Línea",
      offline: "Fuera de Línea",
      invisible: "Invisible",
      profileUpdated: "Perfil actualizado exitosamente",
      uploadFailed: "Error al subir imagen",
      updateFailed: "Error al actualizar perfil"
    }
  };

  const t = content[language];

  useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        avatar_url: (profile as any).avatar_url || '',
        status: (profile as any).status || 'online',
        name_color: (profile as any).name_color || '#ffffff',
        background_image_url: (profile as any).background_image_url || ''
      });
    }
  }, [profile]);

  // Set user online status when component mounts
  useEffect(() => {
    if (user && profile) {
      const updateOnlineStatus = async () => {
        await supabase
          .from('profiles')
          .update({ status: 'online' })
          .eq('user_id', user.id);
      };
      updateOnlineStatus();

      // Set offline on page unload
      const handleBeforeUnload = () => {
        navigator.sendBeacon(`https://gytjgmeoepglbrjrbfie.supabase.co/rest/v1/profiles?user_id=eq.${user.id}`, 
          JSON.stringify({ status: 'offline' }));
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [user, profile]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'staff': return 'bg-blue-500';
      case 'talent': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const uploadImage = async (file: File, type: 'avatar' | 'background') => {
    if (!user) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t.uploadFailed,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const avatarUrl = await uploadImage(file, 'avatar');
    if (avatarUrl) {
      setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }));
    }
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const backgroundUrl = await uploadImage(file, 'background');
    if (backgroundUrl) {
      setProfileData(prev => ({ ...prev, background_image_url: backgroundUrl }));
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      const updateData: any = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        status: profileData.status,
        name_color: profileData.name_color,
      };
      
      // Only update image URLs if new ones were uploaded
      if (profileData.avatar_url) {
        updateData.avatar_url = profileData.avatar_url;
      }
      if (profileData.background_image_url) {
        updateData.background_image_url = profileData.background_image_url;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t.profileUpdated,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t.updateFailed,
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    const first = profile?.first_name || '';
    const last = profile?.last_name || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  if (!profile) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'invisible': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return t.online;
      case 'offline': return t.offline;
      case 'invisible': return t.invisible;
      default: return t.offline;
    }
  };

  return (
    <Card 
      className="border-2 border-black bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: profileData.background_image_url ? `url(${profileData.background_image_url})` : 'none',
        backgroundColor: profileData.background_image_url ? 'transparent' : 'white'
      }}
    >
      <CardHeader className={profileData.background_image_url ? 'bg-black/50 backdrop-blur-sm' : ''}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-black">
              <AvatarImage src={(profile as any).avatar_url || profileData.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-funko-orange to-funko-blue text-white text-lg font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.profile}
              </CardTitle>
              <CardDescription 
                className="flex flex-col gap-1"
              >
                <span style={{ color: profileData.name_color || '#ffffff' }} className="font-medium">
                  {profile.first_name} {profile.last_name}
                </span>
                <span className={`text-xs font-semibold ${getStatusColor(profileData.status)}`}>
                  {getStatusText(profileData.status)}
                </span>
              </CardDescription>
            </div>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {t.editProfile}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t.editProfile}</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24 border-2 border-black">
                    <AvatarImage src={(profile as any).avatar_url || profileData.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-funko-orange to-funko-blue text-white text-xl font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : t.changePhoto}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">{t.status}</Label>
                    <select
                      id="status"
                      value={profileData.status}
                      onChange={(e) => setProfileData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="online">{t.online}</option>
                      <option value="offline">{t.offline}</option>
                      <option value="invisible">{t.invisible}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nameColor">{t.nameColor}</Label>
                    <Input
                      id="nameColor"
                      type="color"
                      value={profileData.name_color}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name_color: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="backgroundImage">{t.backgroundImage}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => backgroundInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full mt-2"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : t.changeBackground}
                  </Button>
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t.firstName}</Label>
                    <Input
                      id="firstName"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t.lastName}</Label>
                    <Input
                      id="lastName"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">{t.phone}</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t.cancel}
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  {t.updateProfile}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className={profileData.background_image_url ? 'bg-black/50 backdrop-blur-sm text-white' : ''}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t.email}:</span>
            <span className="text-sm">{profile.email}</span>
          </div>
          
          {profile.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t.phone}:</span>
              <span className="text-sm">{profile.phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t.role}:</span>
            <Badge className={`${getRoleColor(profile.role)} text-white`}>
              {profile.role.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileManager;