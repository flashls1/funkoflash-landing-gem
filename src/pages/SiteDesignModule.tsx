import { useState, useEffect, useRef } from "react";
import { useSiteDesign } from '@/hooks/useSiteDesign';
import { useAuth } from '@/hooks/useAuth';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminThemeProvider from '@/components/AdminThemeProvider';
import AdminHeader from '@/components/AdminHeader';
import { 
  Save, 
  RefreshCw, 
  Upload, 
  Eye, 
  Monitor, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  ShoppingBag,
  Users,
  Calendar,
  Info,
  Mail,
  LogIn,
  ArrowLeft,
  Move,
  Crop
} from 'lucide-react';

export const SiteDesignModule = () => {
  const { user, profile } = useAuth();
  const { currentTheme } = useColorTheme();
  const { 
    getCurrentPageSettings: getPageSettings, 
    updateCurrentPageSettings, 
    savePageSettings, 
    uploadFile, 
    currentPage, 
    setCurrentPage, 
    loading 
  } = useSiteDesign();
  
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageScale, setImageScale] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Access control - only admin and staff can access
  if (!user || (profile?.role !== 'admin' && profile?.role !== 'staff')) {
    return (
      <AdminThemeProvider>
        <div className="flex items-center justify-center min-h-screen">
          <Card 
            className="max-w-md mx-auto border-2"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: currentTheme.accent }} />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="opacity-70">
                  You need admin or staff privileges to access the Site Design Module.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminThemeProvider>
    );
  }

  const pages = [
    { id: 'home', name: 'Home Page', icon: Home, route: '/' },
    { id: 'shop', name: 'Shop', icon: ShoppingBag, route: '/shop' },
    { id: 'talent-directory', name: 'Talent Directory', icon: Users, route: '/talent-directory' },
    { id: 'events', name: 'Events', icon: Calendar, route: '/events' },
    { id: 'about', name: 'About', icon: Info, route: '/about' },
    { id: 'contact', name: 'Contact', icon: Mail, route: '/contact' },
    { id: 'auth', name: 'Login Page', icon: LogIn, route: '/auth' }
  ];

  // Validate image dimensions for hero images
  const validateHeroImageSize = (file: File): Promise<{ valid: boolean; dimensions: { width: number; height: number } }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const isValid1920x240 = Math.abs(width - 1920) <= 192 && Math.abs(height - 240) <= 24;
        const isValid1920x480 = Math.abs(width - 1920) <= 192 && Math.abs(height - 480) <= 48;
        resolve({ 
          valid: isValid1920x240 || isValid1920x480, 
          dimensions: { width, height } 
        });
      };
      img.onerror = () => resolve({ valid: false, dimensions: { width: 0, height: 0 } });
      img.src = URL.createObjectURL(file);
    });
  };

  // Validate background image dimensions (1920x1920 minimum with 10% tolerance)
  const validateBackgroundImageSize = (file: File): Promise<{ valid: boolean; dimensions: { width: number; height: number } }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const minSize = 1920;
        const tolerance = minSize * 0.1; // 10% tolerance
        const isValid = width >= (minSize - tolerance) && height >= (minSize - tolerance);
        resolve({ 
          valid: isValid, 
          dimensions: { width, height } 
        });
      };
      img.onerror = () => resolve({ valid: false, dimensions: { width: 0, height: 0 } });
      img.src = URL.createObjectURL(file);
    });
  };

  const currentSettings = getPageSettings();

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await savePageSettings(currentPage, currentSettings);
      setUploadStatus({ 
        status: 'success', 
        message: `Settings saved successfully for ${pages.find(p => p.id === currentPage)?.name}!` 
      });
      
      // Enhanced success toast
      toast({
        title: "✅ Settings Saved!",
        description: `All design changes for ${pages.find(p => p.id === currentPage)?.name} have been saved and are now live.`,
      });
      
      // Auto-clear success status after 3 seconds
      setTimeout(() => {
        setUploadStatus({ status: 'idle', message: '' });
      }, 3000);
      
    } catch (error) {
      setUploadStatus({ 
        status: 'error', 
        message: 'Failed to save settings. Please try again.' 
      });
      
      toast({
        title: "❌ Save Failed",
        description: "There was an error saving your settings. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleHeroMediaUpload = async (file: File) => {
    setUploadStatus({ status: 'uploading', message: 'Validating image...' });
    
    try {
      // Validate image size for images only
      if (file.type.startsWith('image/')) {
        const validation = await validateHeroImageSize(file);
        
        if (!validation.valid) {
          const { width, height } = validation.dimensions;
          const message = `Image size ${width}x${height}px is not supported. Please use 1920x240px or 1920x480px (±10% tolerance).`;
          
          setUploadStatus({ status: 'error', message });
          toast({
            title: "❌ Invalid Image Size",
            description: message,
            variant: "destructive"
          });
          return;
        }
      }

      setUploadStatus({ status: 'uploading', message: 'Uploading media...' });
      
      const mediaUrl = await uploadFile(file, 'design-assets');
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      updateCurrentPageSettings({
        hero: {
          ...currentSettings.hero,
          backgroundMedia: mediaUrl,
          mediaType: mediaType,
          position: { x: imagePosition.x, y: imagePosition.y },
          scale: imageScale
        }
      });
      
      setUploadStatus({ 
        status: 'success', 
        message: `${mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully!` 
      });
      
      toast({
        title: `🎉 ${mediaType === 'video' ? 'Video' : 'Image'} Uploaded!`,
        description: `Your hero ${mediaType} has been uploaded and is ready to be saved.`,
      });
      
      setTimeout(() => {
        setUploadStatus({ status: 'idle', message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error uploading hero media:', error);
      setUploadStatus({ 
        status: 'error', 
        message: 'Upload failed. Please try again.' 
      });
      
      toast({
        title: "❌ Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your file.",
        variant: "destructive"
      });
    }
  };

  const handleBackgroundImageUpload = async (file: File) => {
    setUploadStatus({ status: 'uploading', message: 'Validating background image...' });
    
    try {
      // Validate image size
      if (file.type.startsWith('image/')) {
        const validation = await validateBackgroundImageSize(file);
        
        if (!validation.valid) {
          const { width, height } = validation.dimensions;
          const message = `Background image size ${width}x${height}px is too small. Please use minimum 1920x1920px (±10% tolerance).`;
          
          setUploadStatus({ status: 'error', message });
          toast({
            title: "❌ Invalid Background Image Size",
            description: message,
            variant: "destructive"
          });
          return;
        }
      }

      setUploadStatus({ status: 'uploading', message: 'Uploading background image...' });
      
      const imageUrl = await uploadFile(file, 'design-assets');
      
      updateCurrentPageSettings({
        siteBackground: {
          backgroundImage: imageUrl,
          position: { x: 50, y: 50 },
          scale: 100
        }
      });
      
      setUploadStatus({ 
        status: 'success', 
        message: 'Background image uploaded successfully!' 
      });
      
      toast({
        title: "🎉 Background Image Uploaded!",
        description: "Your site background image has been uploaded and is ready to be saved.",
      });
      
      setTimeout(() => {
        setUploadStatus({ status: 'idle', message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error uploading background image:', error);
      setUploadStatus({ 
        status: 'error', 
        message: 'Upload failed. Please try again.' 
      });
      
      toast({
        title: "❌ Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your background image.",
        variant: "destructive"
      });
    }
  };

  const StatusIndicator = ({ status, message }: { status: string; message: string }) => {
    const getIcon = () => {
      switch (status) {
        case 'uploading': return <RefreshCw className="w-4 h-4 animate-spin" />;
        case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
        default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      }
    };

    if (status === 'idle') return null;

    return (
      <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
        status === 'success' ? 'bg-green-50 text-green-700' :
        status === 'error' ? 'bg-red-50 text-red-700' :
        'bg-blue-50 text-blue-700'
      }`}>
        {getIcon()}
        {message}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminThemeProvider>
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
            <p className="text-white">Loading design settings...</p>
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
          title="Hero Image Manager"
          description="Upload and customize hero banner images for your website pages. Images must be 1920x240px or 1920x480px."
          language={language}
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/staff'}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to {profile?.role === 'admin' ? 'Admin' : 'Staff'} CMS
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" style={{ color: currentTheme.accent }} />
              <span className="text-sm font-medium">Hero Images</span>
            </div>
          </div>
        </AdminHeader>

        {/* Page Selector */}
        <Card 
          className="mb-6 border-2"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.border,
            color: currentTheme.cardForeground
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" style={{ color: currentTheme.accent }} />
              Select Page to Edit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {pages.map((page) => {
                const Icon = page.icon;
                return (
                  <Button
                    key={page.id}
                    variant={currentPage === page.id ? "default" : "outline"}
                    className="flex flex-col gap-2 h-auto py-4"
                    onClick={() => setCurrentPage(page.id)}
                    style={currentPage === page.id ? {
                      backgroundColor: currentTheme.accent,
                      borderColor: currentTheme.accent,
                      color: 'white'
                    } : {
                      backgroundColor: 'transparent',
                      borderColor: currentTheme.border,
                      color: currentTheme.cardForeground
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{page.name}</span>
                  </Button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge 
                variant="secondary"
                style={{
                  backgroundColor: currentTheme.accent + '20',
                  color: currentTheme.accent,
                  borderColor: currentTheme.accent
                }}
              >
                Currently editing: {pages.find(p => p.id === currentPage)?.name}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open(pages.find(p => p.id === currentPage)?.route, '_blank')}
                style={{ color: currentTheme.cardForeground }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview Live
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hero Image Controls Panel */}
        <Card 
          className="max-w-4xl mx-auto border-2"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.border,
            color: currentTheme.cardForeground
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: currentTheme.accent }}>Hero Image Controls</CardTitle>
            <StatusIndicator status={uploadStatus.status} message={uploadStatus.message} />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hero Height for Home Page */}
            {currentPage === 'home' && (
              <div>
                <Label className="text-sm font-medium">Hero Height</Label>
                <Select
                  value={currentSettings.hero?.height || '240'}
                  onValueChange={(value) => updateCurrentPageSettings({
                    hero: { ...currentSettings.hero, height: value as '240' | '480' }
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="240">Standard (240px)</SelectItem>
                    <SelectItem value="480">Large (480px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Upload Section */}
            <div>
              <Label className="text-sm font-medium">Upload Hero Image</Label>
              <div className="mt-2 space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Required Size:</strong> 1920x240px or 1920x480px (±10% tolerance allowed)
                  </p>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Upload className="w-12 h-12 mx-auto mb-3 text-primary/60" />
                  <p className="text-sm font-medium mb-1">Click to upload hero image</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WebP - 1920x240px or 1920x480px
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleHeroMediaUpload(file);
                  }}
                />
              </div>
            </div>

            {/* Current Image Preview & Controls */}
            {currentSettings.hero?.backgroundMedia && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Current Hero Image</Label>
                
                {/* Image Preview */}
                <div className="relative border rounded-lg overflow-hidden bg-muted">
                  <div 
                    className="w-full h-32 bg-cover bg-center relative"
                    style={{
                      backgroundImage: `url(${currentSettings.hero.backgroundMedia})`,
                      backgroundPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                      transform: `scale(${imageScale / 100})`
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                      {currentSettings.hero.backgroundMedia.split('/').pop()}
                    </div>
                  </div>
                </div>

                {/* Position Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium">Horizontal Position: {imagePosition.x}%</Label>
                    <Slider
                      value={[imagePosition.x]}
                      onValueChange={([value]) => {
                        setImagePosition(prev => ({ ...prev, x: value }));
                        updateCurrentPageSettings({
                          hero: { ...currentSettings.hero, position: { ...imagePosition, x: value } }
                        });
                      }}
                      max={100}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium">Vertical Position: {imagePosition.y}%</Label>
                    <Slider
                      value={[imagePosition.y]}
                      onValueChange={([value]) => {
                        setImagePosition(prev => ({ ...prev, y: value }));
                        updateCurrentPageSettings({
                          hero: { ...currentSettings.hero, position: { x: imagePosition.x, y: value } }
                        });
                      }}
                      max={100}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Scale Control */}
                <div>
                  <Label className="text-xs font-medium">Image Scale: {imageScale}%</Label>
                  <Slider
                    value={[imageScale]}
                    onValueChange={([value]) => {
                      setImageScale(value);
                      updateCurrentPageSettings({
                        hero: { ...currentSettings.hero, scale: value }
                      });
                    }}
                    min={50}
                    max={200}
                    step={5}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Site Background Image Section */}
            <div className="space-y-4 border-t pt-6">
              <Label className="text-sm font-medium">Site Background Image</Label>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  <strong>Site-wide background:</strong> This background image will be displayed across all pages. Minimum size: 1920x1920px (±10% tolerance)
                </p>
              </div>
              
              <div 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleBackgroundImageUpload(file);
                  };
                  input.click();
                }}
                className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center hover:border-amber-400 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <Upload className="w-10 h-10 mx-auto mb-2 text-amber-600" />
                <p className="text-sm font-medium mb-1">Click to upload site background</p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP - Minimum 1920x1920px
                </p>
              </div>

              {/* Current Background Preview */}
              {currentSettings.siteBackground?.backgroundImage && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Current Background Image</Label>
                  <div className="relative border rounded-lg overflow-hidden bg-muted">
                    <div 
                      className="w-full h-24 bg-cover bg-center relative"
                      style={{
                        backgroundImage: `url(${currentSettings.siteBackground.backgroundImage})`,
                        backgroundPosition: `${currentSettings.siteBackground.position?.x || 50}% ${currentSettings.siteBackground.position?.y || 50}%`,
                        transform: `scale(${(currentSettings.siteBackground.scale || 100) / 100})`
                      }}
                    >
                      <div className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-1 py-0.5 rounded">
                        Background: {currentSettings.siteBackground.backgroundImage.split('/').pop()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: currentTheme.accent,
                  borderColor: currentTheme.accent,
                  color: 'white'
                }}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Hero Image'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open(pages.find(p => p.id === currentPage)?.route, '_blank')}
                style={{
                  borderColor: currentTheme.border,
                  color: currentTheme.cardForeground
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Live Page
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                style={{
                  borderColor: currentTheme.border,
                  color: currentTheme.cardForeground
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer language={language} />
    </AdminThemeProvider>
  );
};

export default SiteDesignModule;