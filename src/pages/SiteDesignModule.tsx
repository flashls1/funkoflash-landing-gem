import { useState, useEffect, useRef } from "react";
import { useSiteDesign } from '@/hooks/useSiteDesign';
import { useAuth } from '@/hooks/useAuth';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

// Pre-approved 1920x240 hero assets
import heroHomeNew from '@/assets/hero-home-1920x240-real.jpg';
import heroShopNew from '@/assets/hero-shop-1920x240-real.jpg';
import heroTalentNew from '@/assets/hero-talent-directory-1920x240-real.jpg';
import heroEventsNew from '@/assets/hero-events-1920x240-real.jpg';
import heroAboutNew from '@/assets/hero-about-1920x240-real.jpg';
import heroContactNew from '@/assets/hero-contact-1920x240-real.jpg';
import { supabase } from '@/integrations/supabase/client';
 
export const SiteDesignModule = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { currentTheme } = useColorTheme();
  const { savePageSettings, uploadFile, loading, settings, getCurrentPageSettings, setCurrentPage } = useSiteDesign();
  
  // Use local state for page selection instead of route-based state
  const [selectedPage, setSelectedPage] = useState('home');
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageScale, setImageScale] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBuildingCollage, setIsBuildingCollage] = useState(false);
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

  // Auto-install 1920x240 hero images into CMS (overwrite to enforce specs)
  useEffect(() => {
    if (loading) return;
    const install = async () => {
      try {
        const assetMap: Record<string, { url: string; filename: string }> = {
          home: { url: heroHomeNew, filename: 'hero-home-1920x240.jpg' },
          shop: { url: heroShopNew, filename: 'hero-shop-1920x240.jpg' },
          'talent-directory': { url: heroTalentNew, filename: 'hero-talent-directory-1920x240.jpg' },
          events: { url: heroEventsNew, filename: 'hero-events-1920x240.jpg' },
          about: { url: heroAboutNew, filename: 'hero-about-1920x240.jpg' },
          contact: { url: heroContactNew, filename: 'hero-contact-1920x240.jpg' }
        };

        for (const pageId of Object.keys(assetMap)) {
          const asset = assetMap[pageId];
          const res = await fetch(asset.url);
          const blob = await res.blob();
          const file = new File([blob], asset.filename, { type: blob.type || 'image/jpeg' });
          const publicUrl = await uploadFile(file, 'design-assets');

          await savePageSettings(pageId, {
            hero: {
              backgroundMedia: publicUrl,
              mediaType: 'image',
              overlayOpacity: 0.45,
              height: '240',
              position: { x: 50, y: 50 },
              scale: 100
            }
          });
        }

        toast({
          title: 'Hero banners updated',
          description: 'All pages now use 1920x240 topic-specific images with white Impact overlay.',
        });
      } catch (e) {
        console.error('Auto-install heroes failed:', e);
        toast({
          title: 'Update failed',
          description: 'Could not install hero images. Ensure you are logged in and storage is accessible.',
          variant: 'destructive'
        });
      }
    };
    install();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Resize image to exact dimensions
  const resizeImageToSize = (file: File, targetWidth: number, targetHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Stretch image to exact dimensions
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, { type: file.type });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, file.type, 0.9);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Resize hero images to 1920x240
  const resizeHeroImage = (file: File): Promise<File> => {
    return resizeImageToSize(file, 1920, 240);
  };

  // Resize background images to 1920x1920
  const resizeBackgroundImage = (file: File): Promise<File> => {
    return resizeImageToSize(file, 1920, 1920);
  };

  // Get settings for the currently selected page
  const getCurrentSelectedPageSettings = () => {
    // First check local settings, then fall back to saved settings
    const localPageSettings = localSettings[selectedPage];
    const savedPageSettings = settings[selectedPage];
    const pageSettings = localPageSettings || savedPageSettings;
    
    return pageSettings || {
      hero: { 
        backgroundMedia: '',
        mediaType: 'image',
        overlayOpacity: 0.5,
        height: selectedPage === 'home' ? '240' : undefined,
        position: { x: 50, y: 50 },
        scale: 100
      }
    };
  };

  // Update settings for the selected page
  const updateSelectedPageSettings = (newSettings: any) => {
    const currentSettings = getCurrentSelectedPageSettings();
    const updatedSettings = {
      ...currentSettings,
      ...newSettings,
      hero: { ...currentSettings.hero, ...newSettings.hero }
    };

    setLocalSettings(prev => ({
      ...prev,
      [selectedPage]: updatedSettings
    }));
  };
  
  const currentSettings = getCurrentSelectedPageSettings();

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = getCurrentSelectedPageSettings();
      await savePageSettings(selectedPage, settingsToSave);
      
      // Clear local settings for this page after successful save
      setLocalSettings(prev => {
        const newSettings = { ...prev };
        delete newSettings[selectedPage];
        return newSettings;
      });
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      
      setUploadStatus({ 
        status: 'success', 
        message: `Settings saved successfully for ${pages.find(p => p.id === selectedPage)?.name}!` 
      });
      
      // Enhanced success toast
      toast({
        title: "✅ Settings Saved!",
        description: `All design changes for ${pages.find(p => p.id === selectedPage)?.name} have been saved and are now live.`,
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
    setUploadStatus({ status: 'uploading', message: 'Resizing image...' });
    
    try {
      let fileToUpload = file;
      
      // Resize image to exact dimensions for images only
      if (file.type.startsWith('image/')) {
        fileToUpload = await resizeHeroImage(file);
        setUploadStatus({ status: 'uploading', message: 'Image resized to 1920x240px, uploading...' });
      }

      setUploadStatus({ status: 'uploading', message: 'Uploading media...' });
      
      const mediaUrl = await uploadFile(file, 'design-assets');
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      updateSelectedPageSettings({
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
    setUploadStatus({ status: 'uploading', message: 'Resizing background image...' });
    
    try {
      let fileToUpload = file;
      
      // Resize image to exact dimensions for images only
      if (file.type.startsWith('image/')) {
        fileToUpload = await resizeBackgroundImage(file);
        setUploadStatus({ status: 'uploading', message: 'Image resized to 1920x1920px, uploading...' });
      }

      setUploadStatus({ status: 'uploading', message: 'Uploading background image...' });
      
      const imageUrl = await uploadFile(file, 'design-assets');
      
      updateSelectedPageSettings({
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

  const handleForceReseed = async () => {
    setUploadStatus({ status: 'uploading', message: 'Re-seeding default hero images...' });
    try {
      const assetMap: Record<string, { url: string; filename: string }> = {
        home: { url: heroHomeNew, filename: 'hero-home-1920x240-v2.jpg' },
        shop: { url: heroShopNew, filename: 'hero-shop-1920x240-v2.jpg' },
        'talent-directory': { url: heroTalentNew, filename: 'hero-talent-directory-1920x240-v2.jpg' },
        events: { url: heroEventsNew, filename: 'hero-events-1920x240-v2.jpg' },
        about: { url: heroAboutNew, filename: 'hero-about-1920x240-v2.jpg' },
        contact: { url: heroContactNew, filename: 'hero-contact-1920x240-v2.jpg' }
      };

      for (const pageId of Object.keys(assetMap)) {
        const asset = assetMap[pageId];
        const res = await fetch(asset.url);
        const blob = await res.blob();
        const file = new File([blob], asset.filename, { type: blob.type || 'image/jpeg' });
        const publicUrl = await uploadFile(file, 'design-assets');

        await savePageSettings(pageId, {
          hero: {
            backgroundMedia: publicUrl,
            mediaType: 'image',
            overlayOpacity: 0.45,
            height: '240',
            position: { x: 50, y: 50 },
            scale: 100
          }
        });
      }

      window.dispatchEvent(new Event('heroImageUpdate'));
      setUploadStatus({ status: 'success', message: 'Reseed complete. All pages updated.' });
      toast({
        title: '✅ Force Re-seed complete',
        description: 'v2 hero images installed and verified across pages.',
      });
    } catch (e) {
      console.error('Force reseed failed:', e);
      setUploadStatus({ status: 'error', message: 'Reseed failed. Please try again.' });
      toast({
        title: '❌ Reseed failed',
        description: e instanceof Error ? e.message : 'Unexpected error during reseed.',
        variant: 'destructive'
      });
    }
  };

  // Build collage for Voice Talent tile by fetching portraits and composing a 1920x1080 image
  const handleBuildTalentCollage = async () => {
    try {
      setIsBuildingCollage(true);
      setUploadStatus({ status: 'uploading', message: 'Fetching portraits...' });

      const actorNames = [
        'Mario Castañeda',
        'René García',
        'Laura Torres',
        'Lalo Garza',
        'Luis Manuel Ávila',
        'Gerardo Reyero',
        'Carlos Segundo'
      ];

      const { data, error } = await supabase.functions.invoke('image-scrape', {
        body: { names: actorNames }
      });
      if (error) throw error;
      const urls: string[] = (data?.images || []).map((i: any) => i.imageUrl).filter(Boolean);
      if (!urls.length) throw new Error('No images found for the requested names.');

      setUploadStatus({ status: 'uploading', message: 'Composing collage...' });
      const blob = await buildCollageFromUrls(urls, 1280, 720);
      const file = new File([blob], `voice-talent-collage-${Date.now()}.jpg`, { type: 'image/jpeg' });

      setUploadStatus({ status: 'uploading', message: 'Uploading collage...' });
      const url = await uploadFile(file, 'design-assets');

      const updated = {
        tiles: {
          ...(currentSettings.tiles || {}),
          voiceTalent: {
            ...(currentSettings.tiles?.voiceTalent || {}),
            imageUrl: url,
            alt: currentSettings.tiles?.voiceTalent?.alt || 'Funko Flash Spanish dub lineup — Mario Castañeda, René García, Laura Torres, Lalo Garza (Eduardo Garza), Luis Manuel Ávila, Gerardo Reyero, Carlos Segundo'
          }
        }
      };
      updateSelectedPageSettings(updated);
      setHasUnsavedChanges(true); // Mark as having unsaved changes instead of auto-saving

      setUploadStatus({ status: 'success', message: 'Collage created & published to Home tile.' });
      toast({ title: '✅ Collage published', description: 'Home tile updated with a seamless collage.' });
    } catch (e) {
      console.error(e);
      setUploadStatus({ status: 'error', message: e instanceof Error ? e.message : 'Failed to build collage' });
      toast({ title: '❌ Collage failed', description: e instanceof Error ? e.message : 'Unexpected error', variant: 'destructive' });
    } finally {
      setIsBuildingCollage(false);
    }
  };

  async function buildCollageFromUrls(urls: string[], width: number, height: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Prepare pool (ensure enough images, include duplicates if needed)
    const target = Math.max(7, urls.length);
    const pool: string[] = [];
    let i = 0;
    while (pool.length < target) {
      pool.push(urls[i % urls.length]);
      i++;
    }

    // Decide row layout (no gaps)
    let rows: number[] = [];
    if (pool.length >= 8) rows = [4, 4];
    else if (pool.length === 7) rows = [4, 3];
    else if (pool.length === 6) rows = [3, 3];
    else if (pool.length === 5) rows = [3, 2];
    else if (pool.length === 4) rows = [2, 2];
    else if (pool.length === 3) rows = [2, 1];
    else if (pool.length === 2) rows = [1, 1];
    else rows = [1];

    // Load images
    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    const imgs = await Promise.all(pool.map(load));

    const drawCover = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      const ir = img.width / img.height;
      const r = w / h;
      let dw, dh, dx, dy;
      if (ir > r) { dh = h; dw = dh * ir; dx = x - (dw - w) / 2; dy = y; }
      else { dw = w; dh = dw / ir; dx = x; dy = y - (dh - h) / 2; }
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    // Compute row heights to fully cover canvas
    const rowCount = rows.length;
    const baseRowH = Math.floor(height / rowCount);
    const extraH = height - baseRowH * rowCount;

    let idx = 0;
    let y = 0;
    for (let r = 0; r < rowCount; r++) {
      const cols = rows[r];
      const rowH = r === rowCount - 1 ? baseRowH + extraH : baseRowH;
      const baseColW = Math.floor(width / cols);
      const extraW = width - baseColW * cols;

      let x = 0;
      for (let c = 0; c < cols; c++) {
        const colW = c === cols - 1 ? baseColW + extraW : baseColW;
        drawCover(imgs[idx], x, y, colW, rowH);
        x += colW;
        idx++;
      }
      y += rowH;
    }

    // Soft vignette to increase legibility
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0,0,0,0.10)');
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.82));
  }

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

  // Handle authentication loading
  if (authLoading) {
    return (
      <AdminThemeProvider>
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
            <p className="text-white">Loading authentication...</p>
          </div>
        </div>
        <Footer language={language} />
      </AdminThemeProvider>
    );
  }

  // Handle access control - redirect to auth if not logged in
  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
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
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="mt-4"
                  style={{ backgroundColor: currentTheme.accent }}
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer language={language} />
      </AdminThemeProvider>
    );
  }

  // Handle design settings loading
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
          title="Site Design Manager"
          description="Upload and customize hero banner images for your website pages. Images must be exactly 1920x240px."
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
            <Button 
              variant="secondary"
              onClick={handleForceReseed}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Force Re-seed & Verify
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
                    variant={selectedPage === page.id ? "default" : "outline"}
                    className="flex flex-col gap-2 h-auto py-4"
                    onClick={() => {
                      console.log('🔧 Page button clicked:', page.id, 'Current selected:', selectedPage);
                      setSelectedPage(page.id);
                    }}
                    style={selectedPage === page.id ? {
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
                Currently editing: {pages.find(p => p.id === selectedPage)?.name}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open(pages.find(p => p.id === selectedPage)?.route, '_blank')}
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
            {selectedPage === 'home' && (
              <div>
                <Label className="text-sm font-medium">Hero Height</Label>
                <Select
                  value={currentSettings.hero?.height || '240'}
                  onValueChange={(value) => updateSelectedPageSettings({
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
                    <strong>Auto-resize:</strong> Images will be stretched to 1920x240px
                  </p>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Upload className="w-12 h-12 mx-auto mb-3 text-primary/60" />
                  <p className="text-sm font-medium mb-1">Click to upload hero image</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WebP - will be auto-resized to 1920x240px
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
                        updateSelectedPageSettings({
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
                        updateSelectedPageSettings({
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
                      updateSelectedPageSettings({
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
                    <strong>Site-wide background:</strong> This background image will be displayed across all pages. Images will be auto-resized to 1920x1920px.
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
                  JPG, PNG, WebP - will be auto-resized to 1920x1920px
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
                onClick={() => window.open(pages.find(p => p.id === selectedPage)?.route, '_blank')}
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

        {/* Home Tiles Management */}
        {selectedPage === 'home' && (
          <Card 
            className="max-w-4xl mx-auto mt-6 border-2"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: currentTheme.accent }}>Home Tile: Voice Talent Directory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Tile Image</Label>
                <p className="text-xs text-muted-foreground">Recommended: 16:9 image (e.g., 1280x720). Use licensed real photos only.</p>
                <div 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      try {
                        setUploadStatus({ status: 'uploading', message: 'Uploading tile image...' });
                        const url = await uploadFile(file, 'design-assets');
                        updateSelectedPageSettings({
                          tiles: {
                            ...(currentSettings.tiles || {}),
                            voiceTalent: {
                              ...(currentSettings.tiles?.voiceTalent || {}),
                              imageUrl: url,
                            }
                          }
                        });
                        setUploadStatus({ status: 'success', message: 'Tile image uploaded. Remember to Save.' });
                        toast({ title: '✅ Tile Image Uploaded', description: 'Click Save to publish changes.' });
                      } catch (err) {
                        console.error(err);
                        setUploadStatus({ status: 'error', message: 'Upload failed' });
                        toast({ title: '❌ Upload failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                      }
                    };
                    input.click();
                  }}
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-primary/5 hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-primary/60" />
                  <p className="text-sm font-medium">Click to upload tile image</p>
                </div>
              </div>

              {/* Current Tile Preview */}
              {currentSettings.tiles?.voiceTalent?.imageUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Current Tile Preview</Label>
                  <div
                    className="w-full h-40 bg-cover bg-center rounded-lg border"
                    style={{ 
                      backgroundImage: `url(${currentSettings.tiles.voiceTalent.imageUrl})`,
                      borderColor: currentTheme.border
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Alt Text (SEO)</Label>
                <Input
                  placeholder="e.g., Funko Flash Spanish dub lineup — Mario Castañeda, René García, Laura Torres, Lalo Garza, Luis Manuel Ávila, Gerardo Reyero, Carlos Segundo"
                  value={currentSettings.tiles?.voiceTalent?.alt || ''}
                  onChange={(e) => updateSelectedPageSettings({
                    tiles: {
                      ...(currentSettings.tiles || {}),
                      voiceTalent: {
                        ...(currentSettings.tiles?.voiceTalent || {}),
                        alt: e.target.value
                      }
                    }
                  })}
                />
              </div>

              {/* Build Collage from Web */}
              <div className="space-y-2 border-t pt-4">
                <Label className="text-sm font-medium">Build Collage from Web</Label>
                <p className="text-xs text-muted-foreground">Automatically fetch portraits and generate a seamless 1280x720 collage of the Spanish dub lineup.</p>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleBuildTalentCollage}
                    disabled={isBuildingCollage}
                    className="flex items-center gap-2"
                    style={{ backgroundColor: currentTheme.accent, borderColor: currentTheme.accent, color: 'white' }}
                  >
                    {isBuildingCollage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isBuildingCollage ? 'Building...' : 'Fetch & Build Collage'}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
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
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Tile Settings'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('/', '_blank')}
                  style={{ borderColor: currentTheme.border, color: currentTheme.cardForeground }}
                >
                  <Eye className="w-4 h-4 mr-2" />Preview Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer language={language} />
    </AdminThemeProvider>
  );
};

export default SiteDesignModule;