import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { VideoRecorder } from '@/components/VideoRecorder';
import { Upload, Video, Image, FileText, Edit, Trash2, Eye, Download, Settings, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getSafeLocale } from '@/utils/locale';
import { 
  talentAssetsApi, 
  watermarkApi, 
  businessTalentAccessApi,
  getAssetBucket, 
  getAssetPath, 
  validateFileType, 
  formatFileSize,
  type TalentAsset,
  type AssetCategory,
  type WatermarkSettings
} from './data';

interface TalentAssetsManagerProps {
  talentId?: string;
  className?: string;
  locale?: 'en' | 'es';
}

export const TalentAssetsManager: React.FC<TalentAssetsManagerProps> = ({
  talentId,
  className = '',
  locale
}) => {
  const [assets, setAssets] = useState<TalentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('headshot');
  const [editingAsset, setEditingAsset] = useState<TalentAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<TalentAsset | null>(null);
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);

  const { profile } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const currentLocale = locale || getSafeLocale();

  // Determine effective talent ID - look up talent profile for current user if no talentId provided
  const [effectiveTalentId, setEffectiveTalentId] = useState<string | null>(talentId || null);
  
  useEffect(() => {
    if (!talentId && profile?.role === 'talent') {
      // Find talent profile for current user
      talentAssetsApi.getAssetsByTalent('').catch(() => {
        // If no talent profile found, user may not be set up as talent yet
      });
    }
  }, [talentId, profile]);

  // Check permissions - use role-based access for talent assets
  const canEdit = profile?.role === 'admin' || 
    profile?.role === 'staff' || 
    (profile?.role === 'talent' && effectiveTalentId);
  const canView = canEdit || profile?.role === 'business';

  const labels = {
    en: {
      title: 'Talent Assets',
      portfolio: 'Portfolio Management',
      categories: {
        headshot: 'Headshots',
        character_image: 'Character Images', 
        bio: 'Bio/Resume',
        promo_video: 'Promo Videos'
      },
      upload: 'Upload File',
      uploadVideo: 'Upload Video',
      recordVideo: 'Record Video',
      title_field: 'Title',
      description: 'Description',
      featured: 'Featured',
      active: 'Active',
      fileSize: 'File Size',
      uploadedAt: 'Uploaded',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      preview: 'Preview',
      download: 'Download',
      watermark: 'Watermark Settings',
      logoSize: 'Logo Size',
      opacity: 'Opacity',
      position: 'Position',
      defaultPosition: 'Default Position',
      businessPosition: 'Business Position',
      positions: {
        'upper-left': 'Upper Left',
        'upper-right': 'Upper Right',
        'lower-left': 'Lower Left',
        'lower-right': 'Lower Right',
        'center': 'Center'
      },
      dragDrop: 'Drag and drop files here, or click to browse',
      fileTypes: 'Supported formats',
      maxSize: 'Max file size',
      success: {
        uploaded: 'File uploaded successfully',
        updated: 'Asset updated successfully',
        deleted: 'Asset deleted successfully',
        watermarkUpdated: 'Watermark settings updated'
      },
      errors: {
        invalidFileType: 'Invalid file type',
        fileTooLarge: 'File size too large',
        uploadFailed: 'Upload failed',
        updateFailed: 'Update failed',
        deleteFailed: 'Delete failed'
      }
    },
    es: {
      title: 'Recursos de Talento',
      portfolio: 'Gestión de Portafolio',
      categories: {
        headshot: 'Fotos de Perfil',
        character_image: 'Imágenes de Personajes',
        bio: 'Biografía/CV',
        promo_video: 'Videos Promocionales'
      },
      upload: 'Subir Archivo',
      uploadVideo: 'Subir Video',
      recordVideo: 'Grabar Video',
      title_field: 'Título',
      description: 'Descripción',
      featured: 'Destacado',
      active: 'Activo',
      fileSize: 'Tamaño de Archivo',
      uploadedAt: 'Subido',
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar',
      preview: 'Vista Previa',
      download: 'Descargar',
      watermark: 'Configuración de Marca de Agua',
      logoSize: 'Tamaño del Logo',
      opacity: 'Opacidad',
      position: 'Posición',
      defaultPosition: 'Posición Predeterminada',
      businessPosition: 'Posición de Negocio',
      positions: {
        'upper-left': 'Superior Izquierda',
        'upper-right': 'Superior Derecha',
        'lower-left': 'Inferior Izquierda',
        'lower-right': 'Inferior Derecha',
        'center': 'Centro'
      },
      dragDrop: 'Arrastra y suelta archivos aquí, o haz clic para explorar',
      fileTypes: 'Formatos compatibles',
      maxSize: 'Tamaño máximo de archivo',
      success: {
        uploaded: 'Archivo subido exitosamente',
        updated: 'Recurso actualizado exitosamente',
        deleted: 'Recurso eliminado exitosamente',
        watermarkUpdated: 'Configuración de marca de agua actualizada'
      },
      errors: {
        invalidFileType: 'Tipo de archivo inválido',
        fileTooLarge: 'Archivo demasiado grande',
        uploadFailed: 'Fallo al subir',
        updateFailed: 'Fallo al actualizar',
        deleteFailed: 'Fallo al eliminar'
      }
    }
  };

  const t = labels[currentLocale];

  // Load assets and watermark settings
  const loadData = useCallback(async () => {
    if (!effectiveTalentId) return;

    try {
      setLoading(true);
      const [assetsData, watermarkData] = await Promise.all([
        talentAssetsApi.getAssetsByTalent(effectiveTalentId),
        watermarkApi.getSettings()
      ]);
      
      setAssets(assetsData);
      setWatermarkSettings(watermarkData);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast({
        title: 'Error loading assets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [effectiveTalentId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList, category: AssetCategory) => {
    if (!effectiveTalentId || !canEdit) return;

    const file = files[0];
    if (!file) return;

    if (!validateFileType(file, category)) {
      toast({
        title: t.errors.invalidFileType,
        variant: 'destructive'
      });
      return;
    }

    const maxSize = category === 'promo_video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for videos, 10MB for others
    if (file.size > maxSize) {
      toast({
        title: t.errors.fileTooLarge,
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      
      const bucket = getAssetBucket(category);
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = getAssetPath(effectiveTalentId, category, fileName);
      
      const fileUrl = await talentAssetsApi.uploadFile(bucket, filePath, file);
      
      const asset = await talentAssetsApi.createAsset({
        talent_id: effectiveTalentId,
        category,
        format: file.type.includes('image/png') ? 'png' : 
                file.type.includes('image/jpeg') ? 'jpeg' : 
                file.type.includes('video/mp4') ? 'mp4' : 
                file.type.includes('application/pdf') ? 'rich_text' : 'png',
        file_size: file.size,
        content_data: null,
        is_featured: false,
        display_order: assets.filter(a => a.category === category).length,
        active: true,
        created_by: profile?.user_id,
        updated_by: null,
        title: file.name.split('.')[0],
        description: null,
        file_url: fileUrl
      });

      setAssets(prev => [...prev, asset]);
      toast({
        title: t.success.uploaded,
        variant: 'default'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t.errors.uploadFailed,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  }, [effectiveTalentId, canEdit, assets, profile?.user_id, toast, t]);

  // Handle video recording
  const handleVideoRecorded = useCallback(async (blob: Blob) => {
    if (!effectiveTalentId || !canEdit) return;

    const file = new File([blob], `recording-${Date.now()}.mp4`, { type: 'video/mp4' });
    
    try {
      setUploading(true);
      
      const bucket = getAssetBucket('promo_video');
      const fileName = file.name;
      const filePath = getAssetPath(effectiveTalentId, 'promo_video', fileName);
      
      const fileUrl = await talentAssetsApi.uploadFile(bucket, filePath, file);
      
      const asset = await talentAssetsApi.createAsset({
        talent_id: effectiveTalentId,
        category: 'promo_video',
        format: 'mp4',
        file_size: file.size,
        content_data: null,
        is_featured: false,
        display_order: assets.filter(a => a.category === 'promo_video').length,
        active: true,
        created_by: profile?.user_id,
        updated_by: null,
        title: `Recording ${new Date().toLocaleDateString()}`,
        description: null,
        file_url: fileUrl
      });

      setAssets(prev => [...prev, asset]);
      setShowVideoRecorder(false);
      toast({
        title: t.success.uploaded,
        variant: 'default'
      });
    } catch (error) {
      console.error('Video upload error:', error);
      toast({
        title: t.errors.uploadFailed,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  }, [effectiveTalentId, canEdit, assets, profile?.user_id, toast, t]);

  // Handle asset update
  const handleAssetUpdate = useCallback(async (asset: TalentAsset, updates: Partial<TalentAsset>) => {
    if (!canEdit) return;

    try {
      const updatedAsset = await talentAssetsApi.updateAsset(asset.id, {
        ...updates,
        updated_by: profile?.user_id
      });

      setAssets(prev => prev.map(a => a.id === asset.id ? updatedAsset : a));
      setEditingAsset(null);
      toast({
        title: t.success.updated,
        variant: 'default'
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: t.errors.updateFailed,
        variant: 'destructive'
      });
    }
  }, [canEdit, profile?.user_id, toast, t]);

  // Handle asset deletion
  const handleAssetDelete = useCallback(async (asset: TalentAsset) => {
    if (!canEdit) return;

    try {
      await talentAssetsApi.deleteAsset(asset.id);
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      setDeletingAsset(null);
      toast({
        title: t.success.deleted,
        variant: 'default'
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: t.errors.deleteFailed,
        variant: 'destructive'
      });
    }
  }, [canEdit, toast, t]);

  // Handle watermark settings update
  const handleWatermarkUpdate = useCallback(async (updates: Partial<WatermarkSettings>) => {
    try {
      const updated = await watermarkApi.updateSettings(updates);
      setWatermarkSettings(updated);
      toast({
        title: t.success.watermarkUpdated,
        variant: 'default'
      });
    } catch (error) {
      console.error('Watermark update error:', error);
      toast({
        title: t.errors.updateFailed,
        variant: 'destructive'
      });
    }
  }, [toast, t]);

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'headshot':
      case 'character_image':
        return <Image className="h-4 w-4" />;
      case 'bio':
        return <FileText className="h-4 w-4" />;
      case 'promo_video':
        return <Video className="h-4 w-4" />;
    }
  };

  const getFileTypeHelp = (category: AssetCategory) => {
    switch (category) {
      case 'headshot':
      case 'character_image':
        return 'JPG, PNG';
      case 'bio':
        return 'PDF, DOC, DOCX';
      case 'promo_video':
        return 'MP4, MOV, AVI';
    }
  };

  const getMaxSizeHelp = (category: AssetCategory) => {
    return category === 'promo_video' ? '100MB' : '10MB';
  };

  if (!effectiveTalentId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No talent selected.</p>
        </CardContent>
      </Card>
    );
  }

  if (!canView) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Access denied.</p>
        </CardContent>
      </Card>
    );
  }

  const categoryAssets = assets.filter(asset => asset.category === selectedCategory);

  return (
    <div className={className}>
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">{t.portfolio}</TabsTrigger>
          <TabsTrigger value="watermark">{t.watermark}</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(selectedCategory)}
                {t.categories[selectedCategory]}
              </CardTitle>
              <div className="flex gap-2">
                {(Object.keys(t.categories) as AssetCategory[]).map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-2"
                  >
                    {getCategoryIcon(category)}
                    {t.categories[category]}
                  </Button>
                ))}
              </div>
            </CardHeader>

            {canEdit && (
              <CardContent className="border-b">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = selectedCategory === 'promo_video' ? 'video/*' : selectedCategory === 'bio' ? '.pdf,.doc,.docx' : 'image/*';
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) handleFileUpload(files, selectedCategory);
                      };
                      input.click();
                    }}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {selectedCategory === 'promo_video' ? t.uploadVideo : t.upload}
                  </Button>

                  {selectedCategory === 'promo_video' && (
                    <Dialog open={showVideoRecorder} onOpenChange={setShowVideoRecorder}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          {t.recordVideo}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{t.recordVideo}</DialogTitle>
                        </DialogHeader>
                        <VideoRecorder 
                          onVideoRecorded={handleVideoRecorded}
                          locale={currentLocale}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{t.fileTypes}: {getFileTypeHelp(selectedCategory)}</p>
                  <p>{t.maxSize}: {getMaxSizeHelp(selectedCategory)}</p>
                </div>
              </CardContent>
            )}

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : categoryAssets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No assets in this category.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryAssets.map(asset => (
                    <Card key={asset.id} className="relative">
                      <CardContent className="p-4">
                        {asset.is_featured && (
                          <Badge className="absolute -top-2 -right-2">
                            <Star className="h-3 w-3" />
                          </Badge>
                        )}

                        <div className="space-y-2">
                          <h4 className="font-medium truncate">{asset.title}</h4>
                          {asset.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {asset.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatFileSize(asset.file_size || 0)}</span>
                            <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                          </div>

                          {canEdit && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingAsset(asset)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                {t.edit}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeletingAsset(asset)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                {t.delete}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watermark" className="space-y-4">
          {canEdit && watermarkSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t.watermark}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t.logoSize}</Label>
                    <Slider
                      value={[watermarkSettings.logo_size]}
                      onValueChange={(value) => 
                        handleWatermarkUpdate({ logo_size: value[0] })
                      }
                      max={300}
                      min={50}
                      step={10}
                    />
                    <p className="text-sm text-muted-foreground">{watermarkSettings.logo_size}px</p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.opacity}</Label>
                    <Slider
                      value={[Number(watermarkSettings.opacity) * 100]}
                      onValueChange={(value) => 
                        handleWatermarkUpdate({ opacity: value[0] / 100 })
                      }
                      max={100}
                      min={10}
                      step={5}
                    />
                    <p className="text-sm text-muted-foreground">{Math.round(Number(watermarkSettings.opacity) * 100)}%</p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.defaultPosition}</Label>
                    <Select
                      value={watermarkSettings.default_position}
                      onValueChange={(value) => 
                        handleWatermarkUpdate({ default_position: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(t.positions).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.businessPosition}</Label>
                    <Select
                      value={watermarkSettings.business_position}
                      onValueChange={(value) => 
                        handleWatermarkUpdate({ business_position: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(t.positions).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Asset Dialog */}
      {editingAsset && (
        <Dialog open={!!editingAsset} onOpenChange={() => setEditingAsset(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.edit}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.title_field}</Label>
                <Input
                  value={editingAsset.title}
                  onChange={(e) => setEditingAsset({...editingAsset, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.description}</Label>
                <Textarea
                  value={editingAsset.description || ''}
                  onChange={(e) => setEditingAsset({...editingAsset, description: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingAsset.is_featured || false}
                  onCheckedChange={(checked) => setEditingAsset({...editingAsset, is_featured: checked})}
                />
                <Label>{t.featured}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingAsset.active || false}
                  onCheckedChange={(checked) => setEditingAsset({...editingAsset, active: checked})}
                />
                <Label>{t.active}</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleAssetUpdate(editingAsset, editingAsset)}>
                  {t.success.updated.replace(' successfully', '')}
                </Button>
                <Button variant="outline" onClick={() => setEditingAsset(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingAsset && (
        <AlertDialog open={!!deletingAsset} onOpenChange={() => setDeletingAsset(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingAsset.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingAsset(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => handleAssetDelete(deletingAsset)}>
                {t.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};