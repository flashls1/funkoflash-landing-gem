import { useState, useEffect } from "react";
import { useSiteDesign } from '@/hooks/useSiteDesign';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import FileUpload from '@/components/FileUpload';
import { ColorPicker } from '@/components/ColorPicker';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { LivePreview } from '@/components/LivePreview';
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
  LogIn
} from 'lucide-react';

export const SiteDesignModule = () => {
  const { user, profile } = useAuth();
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
  const { toast } = useToast();

  // Access control - only admin and staff can access
  if (!user || (profile?.role !== 'admin' && profile?.role !== 'staff')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You need admin or staff privileges to access the Site Design Module.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
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

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 
    'Source Sans Pro', 'Nunito', 'Raleway', 'Ubuntu'
  ];

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
    setUploadStatus({ status: 'uploading', message: 'Uploading media...' });
    
    try {
      const mediaUrl = await uploadFile(file, 'design-assets');
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      updateCurrentPageSettings({
        hero: {
          ...currentSettings.hero,
          backgroundMedia: mediaUrl,
          mediaType: mediaType
        }
      });
      
      setUploadStatus({ 
        status: 'success', 
        message: `${mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully!` 
      });
      
      // Enhanced upload success toast
      toast({
        title: `🎉 ${mediaType === 'video' ? 'Video' : 'Image'} Uploaded!`,
        description: `Your hero ${mediaType} has been uploaded successfully. Preview it in the live preview panel on the right. Don't forget to save your changes!`,
      });
      
      // Auto-clear upload status after 3 seconds
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
        description: error instanceof Error ? error.message : "There was an error uploading your file. Please check your connection and try again.",
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
      <div className="min-h-screen bg-background">
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading design settings...</p>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Site Design Manager</h1>
          </div>
          <p className="text-muted-foreground">
            Customize the visual appearance of your website pages. Changes are applied instantly with live preview.
          </p>
        </div>

        {/* Page Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
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
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{page.name}</span>
                  </Button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">Currently editing: {pages.find(p => p.id === currentPage)?.name}</Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open(pages.find(p => p.id === currentPage)?.route, '_blank')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview Live
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Design Controls Panel */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Design Controls</CardTitle>
            <StatusIndicator status={uploadStatus.status} message={uploadStatus.message} />
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hero" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hero">Hero</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="fonts">Fonts</TabsTrigger>
              </TabsList>

              {/* Hero Section Tab */}
              <TabsContent value="hero" className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Hero banners now only display background media (images/videos). 
                    Text overlays have been removed to prevent content conflicts.
                  </p>
                </div>

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
                        <SelectItem value="240">Small (240px)</SelectItem>
                        <SelectItem value="480">Large (480px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Background Media</Label>
                  <div className="mt-2">
                    <div onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,video/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleHeroMediaUpload(file);
                      };
                      input.click();
                    }}>
                      <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drop image or video here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports images and videos (no size limit)
                        </p>
                      </div>
                    </div>
                  </div>
                  {currentSettings.hero?.backgroundMedia && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      Current: {currentSettings.hero.mediaType === 'video' ? '🎥' : '🖼️'} 
                      {currentSettings.hero.backgroundMedia.split('/').pop()}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Primary Color</Label>
                  <ColorPicker
                    color={currentSettings.colors?.primary || 'hsl(280, 70%, 50%)'}
                    onChange={(color) => updateCurrentPageSettings({
                      colors: { ...currentSettings.colors, primary: color }
                    })}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Secondary Color</Label>
                  <ColorPicker
                    color={currentSettings.colors?.secondary || 'hsl(220, 70%, 50%)'}
                    onChange={(color) => updateCurrentPageSettings({
                      colors: { ...currentSettings.colors, secondary: color }
                    })}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Accent Color</Label>
                  <ColorPicker
                    color={currentSettings.colors?.accent || 'hsl(50, 80%, 55%)'}
                    onChange={(color) => updateCurrentPageSettings({
                      colors: { ...currentSettings.colors, accent: color }
                    })}
                  />
                </div>
              </TabsContent>

              {/* Fonts Tab */}
              <TabsContent value="fonts" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Heading Font</Label>
                  <Select
                    value={currentSettings.fonts?.heading || 'Inter'}
                    onValueChange={(value) => updateCurrentPageSettings({
                      fonts: { ...currentSettings.fonts, heading: value }
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Body Font</Label>
                  <Select
                    value={currentSettings.fonts?.body || 'Inter'}
                    onValueChange={(value) => updateCurrentPageSettings({
                      fonts: { ...currentSettings.fonts, body: value }
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            {/* Save Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleSaveSettings} 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium disabled:bg-green-300 disabled:text-gray-600"
                disabled={isSaving}
                size="lg"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                disabled={isSaving}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset & Reload
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer language={language} />
    </div>
  );
};

export default SiteDesignModule;