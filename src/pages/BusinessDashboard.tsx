import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RealtimeMessageCenter from '@/components/RealtimeMessageCenter';
import { useAuth } from '@/hooks/useAuth';
import { InvisibleModeToggle } from '@/components/InvisibleModeToggle';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '@/hooks/useColorTheme';
import { Calendar, MessageSquare, User, Star, FileText, BarChart3, Settings, DollarSign, TrendingUp, Lock, Unlock, Palette, ChevronDown, Building2 } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { NextEventCard } from '@/components/NextEventCard';
import { MiniAgenda } from '@/components/MiniAgenda';

// Draggable card component for business
const DraggableCard = ({ children, id, index, moveCard, isDragEnabled }: any) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: { id, index },
    canDrag: isDragEnabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'card',
    hover: (item: any) => {
      if (!isDragEnabled || item.index === index) return;
      moveCard(item.index, index);
      item.index = index;
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={isDragEnabled ? 'cursor-move' : 'cursor-default'}
    >
      {children}
    </div>
  );
};

const BusinessDashboard = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [cardOrder, setCardOrder] = useState([0, 1, 2, 3, 4, 5]);
  const { user, profile, loading } = useAuth();
  const { currentTheme, colorThemes, changeTheme } = useColorTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle authentication and authorization separately
    if (loading) return; // Wait for auth to initialize

    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile && profile.role !== 'business') {
      navigate('/auth');
      return;
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [user, profile, loading, navigate]);

  const moveCard = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...cardOrder];
    const draggedCard = newOrder[dragIndex];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedCard);
    setCardOrder(newOrder);
  };

  const getGreeting = () => {
    const cstTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    const hour = cstTime.getHours();
    const firstName = profile?.first_name || 'Business';

    const greetings = {
      en: {
        morning: `Good morning ${firstName}`,
        afternoon: `Good afternoon ${firstName}`,
        evening: `Good evening ${firstName}`
      },
      es: {
        morning: `Buenos días ${firstName}`,
        afternoon: `Buenas tardes ${firstName}`,
        evening: `Buenas noches ${firstName}`
      }
    };

    const t = greetings[language];

    if (hour >= 0 && hour < 12) return t.morning;
    if (hour >= 12 && hour < 17) return t.afternoon;
    return t.evening;
  };

  const content = {
    en: {
      dashboard: "Business Dashboard",
      overview: "Overview",
      messages: "Messages",
      settings: "Settings",
      moduleComingSoon: "Modules coming soon.",
      moduleLayout: "Module Layout",
      dashboardColors: "Dashboard Colors",
      locked: "Locked",
      unlocked: "Unlocked"
    },
    es: {
      dashboard: "Panel de Empresa",
      overview: "Resumen",
      messages: "Mensajes",
      settings: "Configuración",
      moduleComingSoon: "Módulos próximamente.",
      moduleLayout: "Diseño de Módulos",
      dashboardColors: "Colores del Panel",
      locked: "Bloqueado",
      unlocked: "Desbloqueado"
    }
  };

  const t = content[language];

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not business, don't render dashboard content
  if (!user || !profile || profile.role !== 'business') {
    return null;
  }

  return (
    <DndProvider backend={HTML5Backend}>
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
        
        <div className="container mx-auto px-4 py-8">
        {/* Combined Profile Header with Greeting and Date */}
        <div className="mb-6">
          <Card 
            className="border-2 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <div 
              className="relative h-48 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: (profile as any)?.background_image_url 
                  ? `url(${(profile as any).background_image_url})` 
                  : "url('/lovable-uploads/bb29cf4b-64ec-424f-8221-3b283256e06d.png')"
              }}
            >
              {/* Overlay for better text visibility */}
              <div className="absolute inset-0 bg-black/40"></div>
              
              {/* Profile content */}
              <div className="relative flex items-end justify-between h-full p-6">
                {/* Left side - Profile info */}
                <div className="flex items-end gap-4">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                    <AvatarImage src={(profile as any)?.avatar_url || ''} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-green-600 text-white">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white mb-2">
                    <h2 className="text-2xl font-bold drop-shadow-lg">
                      {profile?.first_name} {profile?.last_name}
                    </h2>
                    <p className="text-white/90 capitalize flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {profile?.role}
                    </p>
                    <InvisibleModeToggle language={language} className="mt-2" />
                  </div>
                </div>
                
                {/* Right side - Greeting and Date */}
                <div className="text-right text-white">
                  <h1 className="text-3xl font-bold mb-1 drop-shadow-lg">
                    {getGreeting()}
                  </h1>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-lg font-medium drop-shadow-lg">
                      {currentTime.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'America/Chicago'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Control Bar - Module Layout and Dashboard Colors */}
          <Card 
            className="border-2 border-t-0 rounded-t-none"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {/* Module Layout Controls */}
                  <div className="flex items-center gap-3">
                    {isDragEnabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {t.moduleLayout}
                    </span>
                    <Switch
                      checked={isDragEnabled}
                      onCheckedChange={setIsDragEnabled}
                      style={{ backgroundColor: isDragEnabled ? currentTheme.accent : undefined }}
                    />
                    <span className="text-xs opacity-70">
                      {isDragEnabled ? t.unlocked : t.locked}
                    </span>
                  </div>

                  {/* Navigation Tabs */}
                  <nav className="flex space-x-6">
                    <button 
                      className="py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 border-current"
                      style={{ color: currentTheme.accent }}
                    >
                      <BarChart3 className="h-4 w-4" />
                      {t.overview}
                    </button>
                    <button 
                      className="py-2 px-3 border-b-2 border-transparent opacity-70 hover:opacity-100 font-medium text-sm transition-colors flex items-center gap-2"
                      style={{ color: currentTheme.cardForeground }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t.messages}
                    </button>
                    <button 
                      className="py-2 px-3 border-b-2 border-transparent opacity-70 hover:opacity-100 font-medium text-sm transition-colors flex items-center gap-2"
                      style={{ color: currentTheme.cardForeground }}
                    >
                      <Settings className="h-4 w-4" />
                      {t.settings}
                    </button>
                  </nav>
                </div>
                
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
                      {t.dashboardColors}
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
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Next Event and Mini Agenda */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NextEventCard language={language} />
            <MiniAgenda language={language} />
          </div>

          {/* Future modules placeholder */}
          <Card 
            className="border-2 text-center py-8"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">{t.dashboard}</h3>
              <p className="opacity-70">{t.moduleComingSoon}</p>
            </CardContent>
          </Card>
        </div>

        <RealtimeMessageCenter language={language} />
        </div>
        
        <Footer language={language} />
      </div>
    </DndProvider>
  );
};

export default BusinessDashboard;