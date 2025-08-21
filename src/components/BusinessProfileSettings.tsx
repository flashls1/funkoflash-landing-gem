import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Image as ImageIcon, User, Building2, Save, X, Camera } from 'lucide-react';

interface BusinessProfileSettingsProps {
  language: 'en' | 'es';
  isOpen: boolean;
  onClose: () => void;
}

const BusinessProfileSettings = ({ language, isOpen, onClose }: BusinessProfileSettingsProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    avatar_url: '',
    background_image_url: ''
  });
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const content = {
    en: {
      title: "Business Profile Settings",
      description: "Manage your business profile, upload images and set your business name",
      businessImage: "Business Image",
      heroImage: "Hero Banner Image",
      businessName: "Business Name",
      firstName: "First Name",
      lastName: "Last Name",
      uploadBusinessImage: "Upload Business Image",
      changeHeroImage: "Change Hero Image",
      addBusinessName: "Add Business Name",
      save: "Save Changes",
      cancel: "Cancel",
      profileUpdated: "Profile updated successfully",
      uploadFailed: "Failed to upload image",
      updateFailed: "Failed to update profile",
      businessImageDesc: "This will be your round profile image (recommended: 200x200px)",
      heroImageDesc: "This will be your banner background (recommended: 1920x300px)",
      businessNameDesc: "Display name for your business account"
    },
    es: {
      title: "Configuración de Perfil Empresarial",
      description: "Gestiona tu perfil empresarial, sube imágenes y establece el nombre de tu empresa",
      businessImage: "Imagen Empresarial",
      heroImage: "Imagen del Banner Principal",
      businessName: "Nombre de la Empresa",
      firstName: "Nombre",
      lastName: "Apellido",
      uploadBusinessImage: "Subir Imagen Empresarial",
      changeHeroImage: "Cambiar Imagen Principal",
      addBusinessName: "Agregar Nombre de Empresa",
      save: "Guardar Cambios",
      cancel: "Cancelar",
      profileUpdated: "Perfil actualizado exitosamente",
      uploadFailed: "Error al subir imagen",
      updateFailed: "Error al actualizar perfil",
      businessImageDesc: "Esta será tu imagen de perfil redonda (recomendado: 200x200px)",
      heroImageDesc: "Esta será tu imagen de fondo del banner (recomendado: 1920x300px)",
      businessNameDesc: "Nombre a mostrar para tu cuenta empresarial"
    }
  };

  const t = content[language];

  useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        business_name: (profile as any).business_name || '',
        avatar_url: (profile as any).avatar_url || '',
        background_image_url: (profile as any).background_image_url || ''
      });
    }
  }, [profile]);

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > height) {
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
        } else {
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Set canvas size and draw image
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (file: File, type: 'avatar' | 'background') => {
    if (!user) return null;

    setUploading(true);
    try {
      // Resize image based on type
      let resizedFile = file;
      if (type === 'avatar') {
        resizedFile = await resizeImage(file, 400, 400);
      } else if (type === 'background') {
        resizedFile = await resizeImage(file, 1920, 600);
      }

      const fileExt = resizedFile.name.split('.').pop();
      const fileName = `${type}_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, resizedFile);

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

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

  const handleHeroUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const heroUrl = await uploadImage(file, 'background');
    if (heroUrl) {
      setProfileData(prev => ({ ...prev, background_image_url: heroUrl }));
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      const updateData: any = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        business_name: profileData.business_name,
      };
      
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
      onClose();
      
      // Refresh the page to show updated images
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t.updateFailed,
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    const first = profileData.first_name || profile?.first_name || '';
    const last = profileData.last_name || profile?.last_name || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Business Image Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.businessImage}
              </CardTitle>
              <CardDescription className="text-sm">
                {t.businessImageDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-border">
                  <AvatarImage src={profileData.avatar_url || (profile as any)?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="h-8 px-3 text-sm"
                >
                  <Camera className="h-3 w-3 mr-2" />
                  {uploading ? 'Uploading...' : t.uploadBusinessImage}
                </Button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Hero Image Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {t.heroImage}
              </CardTitle>
              <CardDescription className="text-sm">
                {t.heroImageDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                {profileData.background_image_url && (
                  <div className="w-full h-24 bg-cover bg-center rounded-md border border-border"
                       style={{ backgroundImage: `url(${profileData.background_image_url})` }} />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => heroInputRef.current?.click()}
                  disabled={uploading}
                  className="h-8 px-3 text-sm"
                >
                  <Upload className="h-3 w-3 mr-2" />
                  {uploading ? 'Uploading...' : t.changeHeroImage}
                </Button>
              </div>
              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeroUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Business Name Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t.businessName}
              </CardTitle>
              <CardDescription className="text-sm">
                {t.businessNameDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={profileData.business_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter your business name"
                className="h-8"
              />
            </CardContent>
          </Card>

          {/* Personal Info Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-sm">{t.firstName}</Label>
                  <Input
                    id="firstName"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm">{t.lastName}</Label>
                  <Input
                    id="lastName"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="h-8 px-4 text-sm">
            <X className="h-3 w-3 mr-2" />
            {t.cancel}
          </Button>
          <Button onClick={handleSave} disabled={uploading} className="h-8 px-4 text-sm">
            <Save className="h-3 w-3 mr-2" />
            {uploading ? 'Saving...' : t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessProfileSettings;