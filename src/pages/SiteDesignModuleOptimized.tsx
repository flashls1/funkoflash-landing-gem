import { useState, useRef } from "react";
import { useSiteDesign } from '@/hooks/useSiteDesign';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminThemeProvider from '@/components/AdminThemeProvider';
import AdminHeader from '@/components/AdminHeader';
import { 
  Save, 
  Upload, 
  Eye,
  Home,
  ShoppingBag,
  Users,
  Calendar,
  Info,
  Mail,
  LogIn,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const SiteDesignModuleOptimized = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { savePageSettings, uploadFile, loading, getCurrentPageSettings } = useSiteDesign();
  
  const [selectedPage, setSelectedPage] = useState('home');
  const [heroMedia, setHeroMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const pages = [
    { id: 'home', name: 'Home Page', icon: Home, route: '/' },
    { id: 'shop', name: 'Shop', icon: ShoppingBag, route: '/shop' },
    { id: 'talent-directory', name: 'Talent Directory', icon: Users, route: '/talent-directory' },
    { id: 'events', name: 'Events', icon: Calendar, route: '/events' },
    { id: 'about', name: 'About', icon: Info, route: '/about' },
    { id: 'contact', name: 'Contact', icon: Mail, route: '/contact' },
    { id: 'auth', name: 'Login Page', icon: LogIn, route: '/auth' }
  ];

  // Admin-only access check
  if (authLoading) {
    return (
      <AdminThemeProvider>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminThemeProvider>
    );
  }

  if (!user || !profile || profile.role !== 'admin') {
    return (
      <AdminThemeProvider>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  Only administrators can access the Site Design Manager.
                </p>
                <Button onClick={() => window.location.href = '/'}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminThemeProvider>
    );
  }

  const currentSettings = getCurrentPageSettings();
  const currentHeroMedia = currentSettings.hero?.backgroundMedia;
  const currentMediaType = currentSettings.hero?.mediaType || 'image';

  const handleMediaUpload = async (file: File) => {
    setUploadStatus({ status: 'uploading', message: 'Uploading media...' });
    
    try {
      const mediaUrl = await uploadFile(file, 'design-assets');
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      setHeroMedia({ url: mediaUrl, type: mediaType });
      
      setUploadStatus({ 
        status: 'success', 
        message: `${mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully!` 
      });
      
      toast({
        title: `🎉 ${mediaType === 'video' ? 'Video' : 'Image'} Uploaded!`,
        description: `Your hero ${mediaType} is ready to be saved.`,
      });
      
      setTimeout(() => {
        setUploadStatus({ status: 'idle', message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error uploading media:', error);
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const mediaToSave = heroMedia || { url: currentHeroMedia || '', type: currentMediaType };
      
      await savePageSettings(selectedPage, {
        hero: {
          backgroundMedia: mediaToSave.url,
          mediaType: mediaToSave.type
        }
      });
      
      // Clear uploaded media after save
      setHeroMedia(null);
      
      setUploadStatus({ 
        status: 'success', 
        message: `Settings saved successfully for ${pages.find(p => p.id === selectedPage)?.name}!` 
      });
      
      toast({
        title: "✅ Settings Saved!",
        description: `Hero image for ${pages.find(p => p.id === selectedPage)?.name} has been updated.`,
      });
      
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
        description: "There was an error saving your settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image (JPG, PNG, WEBP) or video (MP4, WebM) file.",
          variant: "destructive"
        });
        return;
      }

      // Check minimum width for images
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth < 1920) {
            toast({
              title: "Image Too Small",
              description: "Image must be at least 1920px wide for best quality.",
              variant: "destructive"
            });
            return;
          }
          handleMediaUpload(file);
        };
        img.src = URL.createObjectURL(file);
      } else {
        handleMediaUpload(file);
      }
    }
  };

  const StatusIndicator = () => {
    if (uploadStatus.status === 'idle') return null;
    
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
        {uploadStatus.status === 'uploading' && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
        {uploadStatus.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
        {uploadStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
        <span className="text-sm">{uploadStatus.message}</span>
      </div>
    );
  };

  const previewUrl = heroMedia?.url || currentHeroMedia;
  const previewType = heroMedia?.type || currentMediaType;

  return (
    <AdminThemeProvider>
      <div className="min-h-screen">
        <Navigation language={language} setLanguage={setLanguage} />
        <AdminHeader 
          title="Site Design Manager"
          language={language}
        />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Website Hero Images</h1>
                <p className="text-muted-foreground">Upload and manage hero images/videos for your website pages</p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Admin Only
              </Badge>
            </div>

            {/* Page Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Select Page
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="page-select">Choose page to edit:</Label>
                <Select value={selectedPage} onValueChange={setSelectedPage}>
                  <SelectTrigger id="page-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        <div className="flex items-center gap-2">
                          <page.icon className="h-4 w-4" />
                          {page.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Hero Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Upload new image or video:</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Images: Min 1920px width, JPG/PNG/WEBP • Videos: MP4/WebM optimized for web
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadStatus.status === 'uploading'}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </div>
                
                <StatusIndicator />
              </CardContent>
            </Card>

            {/* Preview Section */}
            {previewUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative h-[240px] overflow-hidden rounded-lg bg-muted">
                    {previewType === 'video' ? (
                      <video 
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      >
                        <source src={previewUrl} type="video/mp4" />
                        <source src={previewUrl} type="video/webm" />
                      </video>
                    ) : (
                      <img 
                        src={previewUrl}
                        alt="Hero preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    {/* Overlay to match actual display */}
                    <div className="absolute inset-0 bg-black/45" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-black text-2xl uppercase tracking-wide">
                        {pages.find(p => p.id === selectedPage)?.name}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={isSaving || (!heroMedia && !currentHeroMedia)}
                className="min-w-32"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
        
        <Footer language={language} />
      </div>
    </AdminThemeProvider>
  );
};

export default SiteDesignModuleOptimized;