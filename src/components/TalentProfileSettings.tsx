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
import { Upload, Image as ImageIcon, User, Star, Save, X, Camera, Lock, ArrowLeft } from 'lucide-react';

interface TalentProfileSettingsProps {
  language: 'en' | 'es';
  isOpen: boolean;
  onClose: () => void;
}

const TalentProfileSettings = ({ language, isOpen, onClose }: TalentProfileSettingsProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: '',
    background_image_url: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const content = {
    en: {
      title: "Talent Profile Settings",
      description: "Manage your talent profile, upload images and update your information",
      profileImage: "Profile Image",
      heroImage: "Hero Banner Image",
      personalInfo: "Personal Information",
      firstName: "First Name",
      lastName: "Last Name",
      phone: "Phone Number",
      changePassword: "Change Password",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      uploadProfileImage: "Upload Profile Image",
      changeHeroImage: "Change Hero Image",
      save: "Save Changes",
      cancel: "Cancel",
      profileUpdated: "Profile updated successfully",
      passwordUpdated: "Password updated successfully",
      uploadFailed: "Failed to upload image",
      updateFailed: "Failed to update profile",
      passwordMismatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 6 characters",
      profileImageDesc: "This will be your round profile image (recommended: 200x200px)",
      heroImageDesc: "This will be your banner background (recommended: 1920x300px)"
    },
    es: {
      title: "Configuración de Perfil del Talento",
      description: "Gestiona tu perfil de talento, sube imágenes y actualiza tu información",
      profileImage: "Imagen de Perfil",
      heroImage: "Imagen del Banner Principal",
      personalInfo: "Información Personal",
      firstName: "Nombre",
      lastName: "Apellido",
      phone: "Número de Teléfono",
      changePassword: "Cambiar Contraseña",
      newPassword: "Nueva Contraseña",
      confirmPassword: "Confirmar Contraseña",
      uploadProfileImage: "Subir Imagen de Perfil",
      changeHeroImage: "Cambiar Imagen Principal",
      save: "Guardar Cambios",
      cancel: "Cancelar",
      profileUpdated: "Perfil actualizado exitosamente",
      passwordUpdated: "Contraseña actualizada exitosamente",
      uploadFailed: "Error al subir imagen",
      updateFailed: "Error al actualizar perfil",
      passwordMismatch: "Las contraseñas no coinciden",
      passwordTooShort: "La contraseña debe tener al menos 6 caracteres",
      profileImageDesc: "Esta será tu imagen de perfil redonda (recomendado: 200x200px)",
      heroImageDesc: "Esta será tu imagen de fondo del banner (recomendado: 1920x300px)"
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
        phone: profileData.phone,
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

      // Handle password update if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({
            title: t.passwordMismatch,
            variant: "destructive",
          });
          return;
        }

        if (newPassword.length < 6) {
          toast({
            title: t.passwordTooShort,
            variant: "destructive",
          });
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;

        toast({
          title: t.passwordUpdated,
        });
      }

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
            <Star className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        {/* Mobile-only back button header */}
        <div className="md:hidden -mt-2 mb-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full h-11 text-base font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Back to Dashboard' : 'Volver al Panel'}
          </Button>
        </div>

        <div className="space-y-6 py-4">
          {/* Profile Image Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.profileImage}
              </CardTitle>
              <CardDescription className="text-sm">
                {t.profileImageDesc}
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
                  {uploading ? 'Uploading...' : t.uploadProfileImage}
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

          {/* Personal Info Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.personalInfo}</CardTitle>
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
              <div>
                <Label htmlFor="phone" className="text-sm">{t.phone}</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="h-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t.changePassword}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="newPassword" className="text-sm">{t.newPassword}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-sm">{t.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-8"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full sm:w-auto h-10 sm:h-8 px-4 text-sm font-semibold"
          >
            {language === 'en' ? '← Back to Dashboard' : '← Volver al Panel'}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={uploading} 
            className="w-full sm:w-auto h-10 sm:h-8 px-4 text-sm"
          >
            <Save className="h-3 w-3 mr-2" />
            {uploading ? (language === 'en' ? 'Saving...' : 'Guardando...') : t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TalentProfileSettings;