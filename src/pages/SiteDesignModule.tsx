import { useState } from 'react';
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
  Video, 
  Type, 
  Palette, 
  Layout, 
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  Save,
  Trash2,
  Copy,
  RefreshCw,
  Settings,
  Layers,
  Grid,
  Square,
  Navigation
} from 'lucide-react';

interface PageSettings {
  id: string;
  name: string;
  backgroundImage?: string;
  heroType: 'image' | 'video' | 'none';
  heroContent?: string;
  heroSize: '1920x480' | '1920x240';
  customColors: Record<string, string>;
  customFonts: Record<string, string>;
}

const SiteDesignModule = () => {
  const [selectedPage, setSelectedPage] = useState<string>('landing');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('backgrounds');

  const pages = [
    { id: 'landing', name: 'Landing Page' },
    { id: 'auth', name: 'Authentication' },
    { id: 'dashboard-admin', name: 'Admin Dashboard' },
    { id: 'dashboard-staff', name: 'Staff Dashboard' },
    { id: 'dashboard-talent', name: 'Talent Dashboard' },
  ];

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 
    'Source Sans Pro', 'Raleway', 'Ubuntu', 'Nunito', 'Playfair Display', 'Merriweather'
  ];

  const colorPalettes = [
    { name: 'Funko Original', primary: '#FF8C00', secondary: '#1E40AF' },
    { name: 'Ocean Blue', primary: '#0EA5E9', secondary: '#1E293B' },
    { name: 'Forest Green', primary: '#059669', secondary: '#374151' },
    { name: 'Sunset Orange', primary: '#F97316', secondary: '#7C2D12' },
    { name: 'Purple Night', primary: '#9333EA', secondary: '#1F2937' },
  ];

  return (
    <div 
      className="min-h-screen p-6"
      style={{
        backgroundImage: 'var(--site-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              ✨ Site Design Module
            </h1>
            <p className="text-muted-foreground text-lg">
              Customize all pages with backgrounds, heroes, navigation, colors, fonts, and layouts
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Admin CMS Dashboard
            </Badge>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Live Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Page Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Page Selection & Preview Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Label>Select Page to Customize</Label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preview Mode</Label>
              <div className="flex bg-muted rounded-lg p-1 mt-2">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className="rounded-md"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                  className="rounded-md"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className="rounded-md"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Design Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Design Tools Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Design Tools
              </CardTitle>
              <CardDescription>
                Customize every aspect of your selected page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
                  <TabsTrigger value="heroes">Heroes</TabsTrigger>
                  <TabsTrigger value="navigation">Navigation</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 mt-2">
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="typography">Typography</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 mt-2">
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                  <TabsTrigger value="elements">Elements</TabsTrigger>
                </TabsList>

                {/* Background Settings */}
                <TabsContent value="backgrounds" className="space-y-4 mt-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Page Background</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Use Default Background</span>
                        <Switch defaultChecked />
                      </div>
                      <Button variant="outline" className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Custom Background
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Minimum width: 1920px. Recommended: JPG, PNG, WebP
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Background Options</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Position</Label>
                        <Select defaultValue="center">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Size</Label>
                        <Select defaultValue="cover">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">Cover</SelectItem>
                            <SelectItem value="contain">Contain</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Fixed Attachment</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Hero Settings */}
                <TabsContent value="heroes" className="space-y-4 mt-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Hero Header Type</Label>
                    <Select defaultValue="image">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Hero</SelectItem>
                        <SelectItem value="image">Image Hero</SelectItem>
                        <SelectItem value="video">Video Hero</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Hero Size</Label>
                    <Select defaultValue="1920x480">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920x480">Large (1920x480)</SelectItem>
                        <SelectItem value="1920x240">Compact (1920x240)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Hero Content
                  </Button>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Hero Overlay</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Enable Overlay</Label>
                        <Switch />
                      </div>
                      <div>
                        <Label className="text-xs">Overlay Opacity</Label>
                        <Slider defaultValue={[50]} max={100} step={1} className="mt-2" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Navigation Settings */}
                <TabsContent value="navigation" className="space-y-4 mt-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">✨ Navigation Bar Customization</Label>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs">Navigation Background Color</Label>
                        <div className="flex gap-2 mt-2">
                          <Input type="color" defaultValue="#ffffff" className="h-10 w-20" />
                          <Input placeholder="Or enter HSL/RGB" className="flex-1" />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Navigation Text Color</Label>
                        <div className="flex gap-2 mt-2">
                          <Input type="color" defaultValue="#1a1a1a" className="h-10 w-20" />
                          <Input placeholder="Or enter HSL/RGB" className="flex-1" />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Title Text Color</Label>
                        <div className="flex gap-2 mt-2">
                          <Input type="color" defaultValue="#FF8C00" className="h-10 w-20" />
                          <Input placeholder="Or enter HSL/RGB" className="flex-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Navigation Typography</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Font Family</Label>
                        <Select defaultValue="Inter">
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
                        <Label className="text-xs">Font Size</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider 
                            defaultValue={[14]} 
                            min={10} 
                            max={24} 
                            step={1} 
                            className="flex-1" 
                          />
                          <span className="text-sm text-muted-foreground w-8">14px</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Font Weight</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light (300)</SelectItem>
                            <SelectItem value="normal">Normal (400)</SelectItem>
                            <SelectItem value="medium">Medium (500)</SelectItem>
                            <SelectItem value="semibold">Semibold (600)</SelectItem>
                            <SelectItem value="bold">Bold (700)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Navigation Layout</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Navigation Height</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider 
                            defaultValue={[64]} 
                            min={48} 
                            max={96} 
                            step={4} 
                            className="flex-1" 
                          />
                          <span className="text-sm text-muted-foreground w-8">64px</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Show Shadow</Label>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Sticky Navigation</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      ℹ️ Language toggle button styling remains unchanged as requested. 
                      Login button inherits navigation colors automatically.
                    </p>
                  </div>
                </TabsContent>

                {/* Color Settings */}
                <TabsContent value="colors" className="space-y-4 mt-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Color Palettes</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {colorPalettes.map((palette) => (
                        <Button
                          key={palette.name}
                          variant="outline"
                          className="justify-start h-auto p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: palette.primary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: palette.secondary }}
                              />
                            </div>
                            <span className="text-sm">{palette.name}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Custom Colors</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Primary Color</Label>
                        <Input type="color" defaultValue="#FF8C00" className="h-10" />
                      </div>
                      <div>
                        <Label className="text-xs">Secondary Color</Label>
                        <Input type="color" defaultValue="#1E40AF" className="h-10" />
                      </div>
                      <div>
                        <Label className="text-xs">Accent Color</Label>
                        <Input type="color" defaultValue="#059669" className="h-10" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Typography Settings */}
                <TabsContent value="typography" className="space-y-4 mt-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Font Selection</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Heading Font</Label>
                        <Select defaultValue="Inter">
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
                        <Label className="text-xs">Body Font</Label>
                        <Select defaultValue="Inter">
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

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Font Sizing</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Base Size</Label>
                        <Slider defaultValue={[16]} min={12} max={24} step={1} className="mt-2" />
                      </div>
                      <div>
                        <Label className="text-xs">Heading Scale</Label>
                        <Slider defaultValue={[125]} min={100} max={200} step={5} className="mt-2" />
                      </div>
                      <div>
                        <Label className="text-xs">Line Height</Label>
                        <Slider defaultValue={[150]} min={100} max={200} step={10} className="mt-2" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Layout Settings */}
                <TabsContent value="layout" className="space-y-4 mt-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Page Layout</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-20 flex-col">
                        <Layout className="w-6 h-6 mb-1" />
                        <span className="text-xs">Standard</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <Grid className="w-6 h-6 mb-1" />
                        <span className="text-xs">Grid</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <Square className="w-6 h-6 mb-1" />
                        <span className="text-xs">Boxed</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <Layers className="w-6 h-6 mb-1" />
                        <span className="text-xs">Layered</span>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Spacing & Margins</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Container Padding</Label>
                        <Slider defaultValue={[20]} min={0} max={100} step={5} className="mt-2" />
                      </div>
                      <div>
                        <Label className="text-xs">Section Spacing</Label>
                        <Slider defaultValue={[40]} min={0} max={100} step={5} className="mt-2" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Elements Settings */}
                <TabsContent value="elements" className="space-y-4 mt-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Page Elements</Label>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Type className="w-4 h-4 mr-2" />
                        Edit Text Elements
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Image className="w-4 h-4 mr-2" />
                        Manage Images
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Video className="w-4 h-4 mr-2" />
                        Add Videos
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Square className="w-4 h-4 mr-2" />
                        Edit Boxes & Fields
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Element Actions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="flex-col h-16">
                        <Copy className="w-4 h-4 mb-1" />
                        <span className="text-xs">Duplicate</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-col h-16">
                        <Trash2 className="w-4 h-4 mb-1" />
                        <span className="text-xs">Delete</span>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                <Button className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview - {pages.find(p => p.id === selectedPage)?.name}
              </CardTitle>
              <CardDescription>
                Real-time preview of your design changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-8 min-h-[600px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-funko-orange rounded-full mx-auto flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Live Preview Panel</h3>
                  <p className="text-muted-foreground max-w-md">
                    Your design changes will appear here in real-time. Select different tools 
                    from the left panel to customize your page.
                  </p>
                  <Badge variant="secondary">
                    {previewMode.charAt(0).toUpperCase() + previewMode.slice(1)} View
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Future-Proof Notice */}
      <Card className="mt-6 border-funko-orange/20 bg-funko-orange/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-funko-orange/10 rounded-full">
              <RefreshCw className="w-5 h-5 text-funko-orange" />
            </div>
            <div>
              <h4 className="font-semibold text-funko-orange mb-2">✨ Future-Proof Design System</h4>
              <p className="text-sm text-muted-foreground">
                This Site Design Module is built with extensibility in mind. Any new features, 
                components, or design tools added to the system will automatically integrate 
                without breaking existing functionality or page layouts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteDesignModule;