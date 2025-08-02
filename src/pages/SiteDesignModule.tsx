import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Image, 
  Type, 
  Palette, 
  Monitor,
  Eye,
  Save,
  RefreshCw,
  Settings,
  Layers,
  ArrowLeft,
  Home,
  FileText,
  Phone,
  ShoppingBag,
  Calendar,
  Users,
  Shield,
  CheckCircle,
  AlertTriangle,
  Video
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSiteDesign } from '@/hooks/useSiteDesign';
import { ColorPicker } from '@/components/ColorPicker';
import { LivePreview } from '@/components/LivePreview';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const SiteDesignModule = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const {
    settings,
    loading,
    currentPage,
    setCurrentPage,
    getCurrentPageSettings,
    updateCurrentPageSettings,
    savePageSettings,
    uploadFile
  } = useSiteDesign();

  const [activeTab, setActiveTab] = useState('backgrounds');
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not admin/staff - STRICT ACCESS CONTROL
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check if user has proper role (admin or staff only)
    if (user && profile && !['admin', 'staff'].includes(profile.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the Site Design module.",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }
  }, [user, profile, navigate, toast]);

  const pages = [
    { id: 'home', name: 'Homepage', icon: Home, route: '/' },
    { id: 'about', name: 'About', icon: FileText, route: '/about' },
    { id: 'contact', name: 'Contact', icon: Phone, route: '/contact' },
    { id: 'shop', name: 'Shop', icon: ShoppingBag, route: '/shop' },
    { id: 'events', name: 'Events', icon: Calendar, route: '/events' },
    { id: 'talent-directory', name: 'Talent Directory', icon: Users, route: '/talent-directory' },
  ];

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 
    'Source Sans Pro', 'Raleway', 'Ubuntu', 'Nunito', 'Playfair Display', 
    'Merriweather', 'Dancing Script', 'Pacifico', 'Lobster'
  ];

  const currentSettings = getCurrentPageSettings();

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await savePageSettings(currentPage, currentSettings);
      toast({
        title: "Settings Saved",
        description: `Design settings for ${pages.find(p => p.id === currentPage)?.name} have been applied successfully.`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your design settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackgroundUpload = async (url: string) => {
    updateCurrentPageSettings({
      background: {
        type: 'image',
        value: url
      }
    });
  };

  const handleHeroImageUpload = async (url: string) => {
    updateCurrentPageSettings({
      hero: {
        ...currentSettings.hero,
        backgroundImage: url
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-muted/30">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading site design settings...</p>
          <p className="text-sm text-muted-foreground mt-2">Preparing your design studio</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin/staff users
  if (profile && !['admin', 'staff'].includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-muted/30">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the Site Design module.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'var(--site-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navigation language={language} setLanguage={setLanguage} />
      <div className="container mx-auto p-6 bg-background/80 backdrop-blur-sm rounded-lg">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/dashboard/admin')}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to CMS Dashboard
                </Button>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                ✨ Site Design Studio
              </h1>
              <p className="text-muted-foreground text-lg">
                Customize every aspect of your website with live preview
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm px-3 py-1 bg-background/80 backdrop-blur-sm">
                <Settings className="w-3 h-3 mr-1" />
                {pages.find(p => p.id === currentPage)?.name} Page
              </Badge>
            </div>
          </div>
        </div>

        {/* Access Control Notice */}
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Admin/Staff Access:</strong> You have permission to modify site design settings. 
            Changes will be applied across the entire website.
          </AlertDescription>
        </Alert>

        {/* Page Selector */}
        <Card className="mb-6 bg-background/95 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Page Selection
            </CardTitle>
            <CardDescription>
              Choose which page to customize. Each page can have unique design settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {pages.map((page) => {
                const IconComponent = page.icon;
                return (
                  <Button
                    key={page.id}
                    variant={currentPage === page.id ? "default" : "outline"}
                    onClick={() => setCurrentPage(page.id)}
                    className="flex flex-col gap-2 h-auto py-4 relative"
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs">{page.name}</span>
                    {settings[page.id] && (
                      <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Design Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Design Tools Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-background/95 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Design Tools
                </CardTitle>
                <CardDescription>
                  Customize the {pages.find(p => p.id === currentPage)?.name} page appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="backgrounds" className="text-xs">
                      <Layers className="w-3 h-3 mr-1" />
                      Backgrounds
                    </TabsTrigger>
                    <TabsTrigger value="heroes" className="text-xs">
                      <Image className="w-3 h-3 mr-1" />
                      Hero Section
                    </TabsTrigger>
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-2 mt-2">
                    <TabsTrigger value="colors" className="text-xs">
                      <Palette className="w-3 h-3 mr-1" />
                      Colors
                    </TabsTrigger>
                    <TabsTrigger value="typography" className="text-xs">
                      <Type className="w-3 h-3 mr-1" />
                      Typography
                    </TabsTrigger>
                  </TabsList>

                  {/* Background Settings */}
                  <TabsContent value="backgrounds" className="space-y-6 mt-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Page Background
                      </Label>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm">Background Type</Label>
                          <Select 
                            value={currentSettings.background.type} 
                            onValueChange={(value: 'color' | 'image' | 'gradient') => 
                              updateCurrentPageSettings({
                                background: { ...currentSettings.background, type: value }
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="color">Solid Color</SelectItem>
                              <SelectItem value="image">Background Image</SelectItem>
                              <SelectItem value="gradient">Gradient</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {currentSettings.background.type === 'color' && (
                          <ColorPicker
                            label="Background Color"
                            color={currentSettings.background.value}
                            onChange={(color) => 
                              updateCurrentPageSettings({
                                background: { ...currentSettings.background, value: color }
                              })
                            }
                          />
                        )}

                        {currentSettings.background.type === 'image' && (
                          <div>
                            <FileUpload
                              onFileUploaded={(url) => handleBackgroundUpload(url)}
                              acceptedTypes={['image/*']}
                              maxSize={10 * 1024 * 1024} // 10MB
                            />
                            {currentSettings.background.value && (
                              <div className="mt-3 p-3 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                  Current: {currentSettings.background.value}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {currentSettings.background.type === 'gradient' && (
                          <div>
                            <Label className="text-sm">Gradient CSS</Label>
                            <Textarea
                              value={currentSettings.background.value}
                              onChange={(e) => 
                                updateCurrentPageSettings({
                                  background: { ...currentSettings.background, value: e.target.value }
                                })
                              }
                              placeholder="linear-gradient(135deg, hsl(280, 70%, 50%), hsl(220, 70%, 50%))"
                              className="mt-2"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Hero Settings */}
                  <TabsContent value="heroes" className="space-y-6 mt-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Hero Section
                      </Label>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm">Hero Title</Label>
                          <Input
                            value={currentSettings.hero.title}
                            onChange={(e) => 
                              updateCurrentPageSettings({
                                hero: { ...currentSettings.hero, title: e.target.value }
                              })
                            }
                            className="mt-2"
                            placeholder="Enter hero title"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Hero Subtitle</Label>
                          <Textarea
                            value={currentSettings.hero.subtitle}
                            onChange={(e) => 
                              updateCurrentPageSettings({
                                hero: { ...currentSettings.hero, subtitle: e.target.value }
                              })
                            }
                            className="mt-2"
                            placeholder="Enter hero subtitle"
                          />
                        </div>

                        <div>
                          <Label className="text-sm flex items-center gap-2">
                            <Video className="w-3 h-3" />
                            Hero Background Media (Image/Video)
                          </Label>
                          <Alert className="mt-2 mb-3 border-blue-200 bg-blue-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              <strong>Recommended dimensions:</strong> 1920x240px or 1920x480px for optimal display across all devices.
                            </AlertDescription>
                          </Alert>
                          <FileUpload
                            onFileUploaded={(url) => handleHeroImageUpload(url)}
                            acceptedTypes={['image/*', 'video/*']}
                            maxSize={50 * 1024 * 1024} // 50MB
                            bucket="design-assets"
                          />
                          {currentSettings.hero.backgroundImage && (
                            <div className="mt-3 space-y-3">
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                  Current: {currentSettings.hero.backgroundImage}
                                </p>
                              </div>
                              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                                {currentSettings.hero.backgroundImage?.includes('.mp4') || 
                                 currentSettings.hero.backgroundImage?.includes('.mov') || 
                                 currentSettings.hero.backgroundImage?.includes('.webm') ? (
                                  <video 
                                    src={currentSettings.hero.backgroundImage} 
                                    className="w-full h-full object-cover"
                                    controls
                                    muted
                                  />
                                ) : (
                                  <img 
                                    src={currentSettings.hero.backgroundImage} 
                                    alt="Hero background preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling!.textContent = 'Failed to load image';
                                    }}
                                  />
                                )}
                                <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center text-destructive-foreground text-sm hidden">
                                  Failed to load media
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm">Overlay Opacity</Label>
                          <Slider
                            value={[Math.round((currentSettings.hero.overlayOpacity || 0.5) * 100)]}
                            onValueChange={(value) => 
                              updateCurrentPageSettings({
                                hero: { ...currentSettings.hero, overlayOpacity: value[0] / 100 }
                              })
                            }
                            max={100}
                            step={5}
                            className="mt-2"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {Math.round((currentSettings.hero.overlayOpacity || 0.5) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Color Settings */}
                  <TabsContent value="colors" className="space-y-6 mt-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Brand Colors
                      </Label>
                      
                      <div className="space-y-4">
                        <ColorPicker
                          label="Primary Color"
                          color={currentSettings.colors.primary}
                          onChange={(color) => 
                            updateCurrentPageSettings({
                              colors: { ...currentSettings.colors, primary: color }
                            })
                          }
                        />

                        <ColorPicker
                          label="Secondary Color"
                          color={currentSettings.colors.secondary}
                          onChange={(color) => 
                            updateCurrentPageSettings({
                              colors: { ...currentSettings.colors, secondary: color }
                            })
                          }
                        />

                        <ColorPicker
                          label="Accent Color"
                          color={currentSettings.colors.accent}
                          onChange={(color) => 
                            updateCurrentPageSettings({
                              colors: { ...currentSettings.colors, accent: color }
                            })
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Typography Settings */}
                  <TabsContent value="typography" className="space-y-6 mt-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Typography
                      </Label>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm">Heading Font</Label>
                          <Select 
                            value={currentSettings.fonts.heading} 
                            onValueChange={(value) => 
                              updateCurrentPageSettings({
                                fonts: { ...currentSettings.fonts, heading: value }
                              })
                            }
                          >
                            <SelectTrigger>
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
                          <Label className="text-sm">Body Font</Label>
                          <Select 
                            value={currentSettings.fonts.body} 
                            onValueChange={(value) => 
                              updateCurrentPageSettings({
                                fonts: { ...currentSettings.fonts, body: value }
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontOptions.map((font) => (
                                <SelectItem key={font} value={font}>{font}</SelectItem>
                              ))}
                            </SelectContent>
                           </Select>
                         </div>
                       </div>
                     </div>
                   </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                {/* Save/Reset Actions */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveSettings} 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isSaving}
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
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-3">
            <Card className="bg-background/95 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See your changes in real-time. Visit the actual page to see full functionality.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <LivePreview currentPage={currentPage} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notice */}
        <Card className="mt-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Layers className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Future-Proof Design System</h3>
                <p className="text-sm text-muted-foreground">
                  This design module applies changes globally across your site using CSS custom properties. 
                  Changes are saved to the database and applied instantly with live preview. Each page can have unique settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer language={language} />
    </div>
  );
};

export default SiteDesignModule;