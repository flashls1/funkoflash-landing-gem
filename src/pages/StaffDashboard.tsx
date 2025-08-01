import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MessageCenter from '@/components/MessageCenter';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, FileText, Users, BarChart3, Settings } from 'lucide-react';

const StaffDashboard = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [currentTime, setCurrentTime] = useState(new Date());
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{getGreeting()}</h1>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'America/Chicago'
            })}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.overview}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t.schedule}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t.messages}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t.tasks}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.reports}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.mySchedule}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Events this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.upcomingEvents}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Next 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.tasksAssigned}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">2 completed</p>
                </CardContent>
              </Card>

              <Card>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t.eventManagement}
                  </CardTitle>
                  <CardDescription>{t.eventManagementDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.viewEvents}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t.taskManagement}
                  </CardTitle>
                  <CardDescription>{t.taskManagementDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.viewTasks}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t.talentCoordination}
                  </CardTitle>
                  <CardDescription>{t.talentCoordinationDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.coordinateTalent}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t.reportGeneration}
                  </CardTitle>
                  <CardDescription>{t.reportGenerationDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.generateReports}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t.scheduleManagement}
                  </CardTitle>
                  <CardDescription>{t.scheduleManagementDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.manageSchedule}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {t.resourceManagement}
                  </CardTitle>
                  <CardDescription>{t.resourceManagementDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.manageResources}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === 'en' ? 'Talent Directory' : 'Directorio de Talento'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Manage talent profiles and directory banner' : 'Gestionar perfiles de talento y banner del directorio'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = '/admin/talent-directory'}
                  >
                    {language === 'en' ? 'Manage Talent Directory' : 'Gestionar Directorio de Talento'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
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
            <MessageCenter language={language} />
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
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
            <Card>
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
  );
};

export default StaffDashboard;