import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getSafeLocale } from '@/utils/locale';
import { appearanceApi, AppearanceSettings } from './data';
import { hasFeature } from '@/lib/features';
import { Palette } from 'lucide-react';

export default function AppearanceManager() {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const language = getSafeLocale();

  const t = {
    en: {
      title: "Appearance",
      bgMode: "Background mode",
      black: "Solid black",
      siteImage: "Site background image",
      siteImageWatermark: "Site background + tiled logo watermark",
      watermarkOpacity: "Watermark opacity",
      watermarkScale: "Watermark scale",
      ripple: "Enable interactive ripple (desktop)",
      rippleIntensity: "Ripple intensity",
      save: "Save",
      rippleHelper: "Respects reduced‑motion preferences",
      saved: "Appearance settings saved successfully"
    },
    es: {
      title: "Apariencia",
      bgMode: "Modo de fondo",
      black: "Negro sólido",
      siteImage: "Imagen de fondo del sitio",
      siteImageWatermark: "Fondo del sitio + marca de agua",
      watermarkOpacity: "Opacidad de marca de agua",
      watermarkScale: "Escala de marca de agua",
      ripple: "Activar efecto de onda (escritorio)",
      rippleIntensity: "Intensidad de onda",
      save: "Guardar",
      rippleHelper: "Respeta las preferencias de movimiento reducido",
      saved: "Configuración de apariencia guardada exitosamente"
    }
  };

  useEffect(() => {
    if (!hasFeature('appearance')) return;
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await appearanceApi.getSettings();
      setSettings(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load appearance settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await appearanceApi.saveSettings(settings);
      
      // Dispatch custom event to notify BackgroundManager
      window.dispatchEvent(new CustomEvent('appearance-settings-changed', {
        detail: settings
      }));

      toast({
        title: t[language].saved,
        description: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save appearance settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!hasFeature('appearance')) {
    return null;
  }

  if (loading || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {t[language].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-6 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {t[language].title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Background Mode */}
        <div className="space-y-3">
          <Label className="text-base font-medium">{t[language].bgMode}</Label>
          <RadioGroup
            value={settings.bgMode}
            onValueChange={(value) => setSettings({
              ...settings,
              bgMode: value as 'black' | 'siteImage' | 'siteImage+watermark'
            })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="black" id="bg-black" />
              <Label htmlFor="bg-black">{t[language].black}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="siteImage" id="bg-site" />
              <Label htmlFor="bg-site">{t[language].siteImage}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="siteImage+watermark" id="bg-watermark" />
              <Label htmlFor="bg-watermark">{t[language].siteImageWatermark}</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Watermark Controls */}
        {settings.bgMode === 'siteImage+watermark' && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t[language].watermarkOpacity} ({Math.round(settings.watermarkOpacity * 100)}%)
              </Label>
              <Slider
                value={[settings.watermarkOpacity]}
                onValueChange={([value]) => setSettings({
                  ...settings,
                  watermarkOpacity: value
                })}
                max={0.1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t[language].watermarkScale} ({Math.round(settings.watermarkScale * 100)}%)
              </Label>
              <Slider
                value={[settings.watermarkScale]}
                onValueChange={([value]) => setSettings({
                  ...settings,
                  watermarkScale: value
                })}
                max={1.5}
                min={0.5}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Desktop Ripple */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t[language].ripple}</Label>
              <p className="text-xs text-muted-foreground">{t[language].rippleHelper}</p>
            </div>
            <Switch
              checked={settings.rippleEnabled}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                rippleEnabled: checked
              })}
            />
          </div>

          {settings.rippleEnabled && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">
                {t[language].rippleIntensity} ({Math.round(settings.rippleIntensity * 100)}%)
              </Label>
              <Slider
                value={[settings.rippleIntensity]}
                onValueChange={([value]) => setSettings({
                  ...settings,
                  rippleIntensity: value
                })}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (language === 'es' ? 'Guardando...' : 'Saving...') : t[language].save}
        </Button>
      </CardContent>
    </Card>
  );
}