import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RealtimeMessageCenter from '@/components/RealtimeMessageCenter';
import ProfileManager from '@/components/ProfileManager';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, FileText, Users, BarChart3, Settings, ClipboardList, UserCheck, Wrench, ShoppingBag, Lock, Unlock } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';

// Draggable card component for staff
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

const StaffDashboard = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [cardOrder, setCardOrder] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile || profile.role !== 'staff') {
      navigate('/auth');
      return;
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [user, profile, navigate]);

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
    const firstName = profile?.first_name || 'Staff';

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
      dashboard: "Staff Dashboard",
      overview: "Overview",
      schedule: "Schedule",
      messages: "Messages",
      reports: "Reports",
      tasks: "Tasks",
      mySchedule: "My Schedule",
      upcomingEvents: "Upcoming Events",
      tasksAssigned: "Tasks Assigned",
      completionRate: "Completion Rate",
      eventManagement: "Event Management",
      eventManagementDesc: "Manage assigned events and activities",
      viewEvents: "View Events",
      taskManagement: "Task Management",
      taskManagementDesc: "View and complete assigned tasks",
      viewTasks: "View Tasks",
      talentCoordination: "Talent Coordination",
      talentCoordinationDesc: "Coordinate with talent for events and bookings",
      coordinateTalent: "Coordinate Talent",
      reportGeneration: "Report Generation",
      reportGenerationDesc: "Generate reports for assigned areas",
      generateReports: "Generate Reports",
      scheduleManagement: "Schedule Management",
      scheduleManagementDesc: "Manage your work schedule and availability",
      manageSchedule: "Manage Schedule",
      resourceManagement: "Resource Management",
      resourceManagementDesc: "Manage event resources and equipment",
      manageResources: "Manage Resources"
    },
    es: {
      dashboard: "Panel de Personal",
      overview: "Resumen",
      schedule: "Horario",
      messages: "Mensajes",
      reports: "Reportes",
      tasks: "Tareas",
      mySchedule: "Mi Horario",
      upcomingEvents: "Eventos Próximos",
      tasksAssigned: "Tareas Asignadas",
      completionRate: "Tasa de Finalización",
      eventManagement: "Gestión de Eventos",
      eventManagementDesc: "Gestionar eventos y actividades asignadas",
      viewEvents: "Ver Eventos",
      taskManagement: "Gestión de Tareas",
      taskManagementDesc: "Ver y completar tareas asignadas",
      viewTasks: "Ver Tareas",
      talentCoordination: "Coordinación de Talento",
      talentCoordinationDesc: "Coordinar con talento para eventos y reservas",
      coordinateTalent: "Coordinar Talento",
      reportGeneration: "Generación de Reportes",
      reportGenerationDesc: "Generar reportes para áreas asignadas",
      generateReports: "Generar Reportes",
      scheduleManagement: "Gestión de Horario",
      scheduleManagementDesc: "Gestionar tu horario de trabajo y disponibilidad",
      manageSchedule: "Gestionar Horario",
      resourceManagement: "Gestión de Recursos",
      resourceManagementDesc: "Gestionar recursos de eventos y equipos",
      manageResources: "Gestionar Recursos"
    }
  };

  const t = content[language];

  if (!user || !profile || profile.role !== 'staff') {
    return null;
  }

  // Module definitions with colors for staff
  const moduleCards = [
    { id: 'event-management', icon: Calendar, color: 'text-blue-500', title: t.eventManagement, desc: t.eventManagementDesc, action: t.viewEvents },
    { id: 'task-management', icon: ClipboardList, color: 'text-green-500', title: t.taskManagement, desc: t.taskManagementDesc, action: t.viewTasks },
    { id: 'talent-coordination', icon: UserCheck, color: 'text-purple-500', title: t.talentCoordination, desc: t.talentCoordinationDesc, action: t.coordinateTalent },
    { id: 'report-generation', icon: BarChart3, color: 'text-orange-500', title: t.reportGeneration, desc: t.reportGenerationDesc, action: t.generateReports },
    { id: 'schedule-management', icon: Calendar, color: 'text-indigo-500', title: t.scheduleManagement, desc: t.scheduleManagementDesc, action: t.manageSchedule },
    { id: 'resource-management', icon: Wrench, color: 'text-gray-500', title: t.resourceManagement, desc: t.resourceManagementDesc, action: t.manageResources },
    { id: 'talent-directory', icon: Users, color: 'text-cyan-500', title: language === 'en' ? 'Talent Directory' : 'Directorio de Talento', desc: language === 'en' ? 'Manage talent profiles and directory banner' : 'Gestionar perfiles de talento y banner del directorio', action: language === 'en' ? 'Manage Talent Directory' : 'Gestionar Directorio de Talento', onClick: () => window.location.href = '/admin/talent-directory' },
    { id: 'shop-manager', icon: ShoppingBag, color: 'text-emerald-500', title: language === 'en' ? 'Shop Manager' : 'Gestor de Tienda', desc: language === 'en' ? 'Manage products, images, and shop inventory' : 'Gestionar productos, imágenes e inventario de la tienda', action: language === 'en' ? 'Manage Shop' : 'Gestionar Tienda', onClick: () => window.location.href = '/admin/shop-manager' },
    { id: 'events-manager', icon: Calendar, color: 'text-red-500', title: language === 'en' ? 'Events Manager' : 'Gestor de Eventos', desc: language === 'en' ? 'Create, manage, and publish events with talent assignments' : 'Crear, gestionar y publicar eventos con asignaciones de talento', action: language === 'en' ? 'Manage Events' : 'Gestionar Eventos', onClick: () => window.location.href = '/admin/events-manager' }
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className="min-h-screen"
        style={{
          backgroundImage: "url('/lovable-uploads/bb29cf4b-64ec-424f-8221-3b283256e06d.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <Navigation language={language} setLanguage={setLanguage} />
        
        <div className="container mx-auto px-4 py-8 bg-background/80 backdrop-blur-sm rounded-lg">
        {/* Header with Enhanced Design */}
        <div className="relative mb-8 overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent rounded-2xl"></div>
          
          {/* Content */}
          <div className="relative p-8 bg-gradient-to-r from-blue-900/80 via-teal-900/80 to-green-900/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
            <div className="flex items-center gap-4">
              {/* Decorative accent */}
              <div className="w-2 h-16 bg-gradient-to-b from-blue-400 via-teal-400 to-green-400 rounded-full shadow-lg"></div>
              
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight">
                  {getGreeting()}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <p className="text-xl text-white/95 font-medium drop-shadow-lg">
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
            
            {/* Additional decorative elements */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <div className="w-3 h-3 bg-white/20 rounded-full"></div>
              <div className="w-3 h-3 bg-white/30 rounded-full"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Combined Profile and Module Layout Bar */}
        <div className="mb-6 space-y-0">
          <ProfileManager language={language} />
          
          {/* Combined Module Layout and Navigation Bar - Flush with profile */}
          <Card className="border-2 border-black border-t-0 rounded-t-none bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {/* Module Layout Controls */}
                  <div className="flex items-center gap-3">
                    {isDragEnabled ? <Unlock className="h-4 w-4 text-gray-600" /> : <Lock className="h-4 w-4 text-gray-600" />}
                    <span className="text-sm font-medium text-gray-700">
                      {language === 'en' ? 'Module Layout' : 'Diseño de Módulos'}
                    </span>
                    <Switch
                      checked={isDragEnabled}
                      onCheckedChange={setIsDragEnabled}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <span className="text-gray-600 text-xs">
                      {isDragEnabled 
                        ? (language === 'en' ? 'Unlocked' : 'Desbloqueado')
                        : (language === 'en' ? 'Locked' : 'Bloqueado')
                      }
                    </span>
                  </div>

                  {/* Navigation Tabs */}
                  <nav className="flex space-x-6">
                    <button className="py-2 px-3 border-b-2 border-funko-orange text-funko-orange font-medium text-sm transition-colors flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t.overview}
                    </button>
                    <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t.schedule}
                    </button>
                    <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t.messages}
                    </button>
                    <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t.tasks}
                    </button>
                    <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t.reports}
                    </button>
                  </nav>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.mySchedule}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Events this week</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.upcomingEvents}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Next 7 days</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.tasksAssigned}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">2 completed</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.completionRate}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cardOrder.map((cardIndex, index) => {
                const card = moduleCards[cardIndex];
                const IconComponent = card.icon;
                return (
                  <DraggableCard
                    key={card.id}
                    id={card.id}
                    index={index}
                    moveCard={moveCard}
                    isDragEnabled={isDragEnabled}
                  >
                    <Card className="border-2 border-black bg-white transition-transform hover:scale-105">
                      <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${card.color}`}>
                          <IconComponent className="h-5 w-5" />
                          {card.title}
                        </CardTitle>
                        <CardDescription>{card.desc}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full" 
                          onClick={card.onClick}
                        >
                          {card.action}
                        </Button>
                      </CardContent>
                    </Card>
                  </DraggableCard>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="border-2 border-black bg-white">
              <CardHeader>
                <CardTitle>{t.scheduleManagement}</CardTitle>
                <CardDescription>Manage your work schedule and upcoming events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Schedule management functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <RealtimeMessageCenter language={language} />
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="border-2 border-black bg-white">
              <CardHeader>
                <CardTitle>{t.taskManagement}</CardTitle>
                <CardDescription>View and manage your assigned tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Task management functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="border-2 border-black bg-white">
              <CardHeader>
                <CardTitle>{t.reportGeneration}</CardTitle>
                <CardDescription>Generate and view reports for your assigned areas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Report generation functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

        <Footer language={language} />
      </div>
    </DndProvider>
  );
};

export default StaffDashboard;