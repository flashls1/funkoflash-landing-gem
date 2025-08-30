
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useColorTheme } from '@/hooks/useColorTheme';
import { supabase } from '@/integrations/supabase/client';
import { Palette, ChevronDown } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  description?: string;
  language: 'en' | 'es';
  children?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  title, 
  description, 
  language,
  children 
}) => {
  const { currentTheme, colorThemes, changeTheme } = useColorTheme();
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", u.user.id)
        .maybeSingle();
      setAvatarUrl(data?.avatar_url ?? null);
    })();
  }, []);

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        {description && (
          <p className="text-white/80">{description}</p>
        )}
      </div>

      {/* Control Bar */}
      <Card 
        className="border-2 rounded-2xl"
        style={{
          backgroundColor: currentTheme.cardBackground,
          borderColor: currentTheme.border,
          color: currentTheme.cardForeground
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {children}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10" />
              )}
              
              {/* Dashboard Colors Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    style={{
                      backgroundColor: currentTheme.cardBackground,
                      borderColor: currentTheme.border,
                      color: currentTheme.cardForeground
                    }}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Dashboard Colors' : 'Colores del Panel'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48"
                  style={{
                    backgroundColor: currentTheme.cardBackground,
                    borderColor: currentTheme.border,
                    color: currentTheme.cardForeground
                  }}
                >
                  {colorThemes.map((theme) => (
                    <DropdownMenuItem
                      key={theme.id}
                      onClick={() => changeTheme(theme.id)}
                      className="flex items-center gap-3 cursor-pointer"
                      style={{
                        backgroundColor: currentTheme.id === theme.id ? currentTheme.accent + '20' : 'transparent'
                      }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.accent, borderColor: theme.border }}
                      />
                      {theme.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHeader;
