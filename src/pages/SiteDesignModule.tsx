import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Image, 
  Type, 
  Palette, 
  Layout, 
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  Save,
  RefreshCw,
  Settings,
  Layers,
  Navigation as NavigationIcon,
  ArrowLeft,
  Home,
  FileText,
  Phone,
  ShoppingBag,
  Calendar,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSiteDesign } from '@/hooks/useSiteDesign';
import { ColorPicker } from '@/components/ColorPicker';
import { LivePreview } from '@/components/LivePreview';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SiteDesignModule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  // Redirect if not admin/staff
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Allow access to continue - RLS policies will handle permissions
  }, [user, navigate]);

  const pages = [
    { id: 'home', name: 'Homepage', icon: Home },
    { id: 'about', name: 'About', icon: FileText },
    { id: 'contact', name: 'Contact', icon: Phone },
    { id: 'shop', name: 'Shop', icon: ShoppingBag },
    { id: 'events', name: 'Events', icon: Calendar },
    { id: 'talent-directory', name: 'Talent Directory', icon: Users },
  ];

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 
    'Source Sans Pro', 'Raleway', 'Ubuntu', 'Nunito', 'Playfair Display', 
    'Merriweather', 'Dancing Script', 'Pacifico', 'Lobster'
  ];

  const currentSettings = getCurrentPageSettings();

  const handleSaveSettings = async () => {
    try {
      await savePageSettings(currentPage, currentSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading site design settings...</p>
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
      <div className="container mx-auto p-6">
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
                {pages.find(p => p.id === currentPage)?.name} Page
              </Badge>
            </div>
          </div>
        </div>

        {/* Page Selector */}
        <Card className="mb-6 bg-background/95 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Page Selection
            </CardTitle>
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
                    className="flex flex-col gap-2 h-auto py-4"
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs">{page.name}</span>
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
                  Customize the {pages.find(p => p.id === currentPage)?.name} page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
                    <TabsTrigger value="heroes">Hero Section</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-2 mt-2">
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="typography">Typography</TabsTrigger>
                  </TabsList>

                  {/* Background Settings */}
                  <TabsContent value="backgrounds" className="space-y-6 mt-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">Page Background</Label>
                      
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
                      <Label className="text-base font-semibold mb-4 block">Hero Section</Label>
                      
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
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Hero Background Media (Image/Video)</Label>
                          <FileUpload
                            onFileUploaded={(url) => handleHeroImageUpload(url)}
                            acceptedTypes={['image/*', 'video/*']}
                            maxSize={50 * 1024 * 1024} // 50MB for videos
                          />
                          {currentSettings.hero.backgroundImage && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                Current: {currentSettings.hero.backgroundImage}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm">Overlay Opacity</Label>
                          <Slider
                            value={[currentSettings.hero.overlayOpacity || 50]}
                            onValueChange={(value) => 
                              updateCurrentPageSettings({
                                hero: { ...currentSettings.hero, overlayOpacity: value[0] }
                              })
                            }
                            max={100}
                            step={5}
                            className="mt-2"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {currentSettings.hero.overlayOpacity || 50}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Color Settings */}
                  <TabsContent value="colors" className="space-y-6 mt-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">Brand Colors</Label>
                      
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
                      <Label className="text-base font-semibold mb-4 block">Typography</Label>
                      
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

                {/* Save/Reset Actions */}
                <div className="flex gap-3 mt-8">
                  <Button onClick={handleSaveSettings} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
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
              <LivePreview currentPage={currentPage} />
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
                  Changes are saved to the database and applied instantly with live preview.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SiteDesignModule;