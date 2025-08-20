import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Calendar, Users, FileText, Settings } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, profile, navigate]);

  const content = {
    en: {
      title: "Admin Dashboard",
      subtitle: "Manage users, roles, and system settings",
      users: "Users",
      usersDescription: "Manage user accounts and roles",
      businessEvents: "Business Events",
      businessEventsDescription: "Manage corporate events and business engagements",
      talentDirectory: "Talent Directory",
      talentDirectoryDescription: "Manage talent profiles and assignments",
      systemSettings: "System Settings",
      systemSettingsDescription: "Configure global system settings"
    },
    es: {
      title: "Panel de Administración",
      subtitle: "Gestiona usuarios, roles y configuraciones del sistema",
      users: "Usuarios",
      usersDescription: "Gestiona cuentas de usuario y roles",
      businessEvents: "Eventos Empresariales",
      businessEventsDescription: "Gestiona eventos corporativos y compromisos empresariales",
      talentDirectory: "Directorio de Talento",
      talentDirectoryDescription: "Gestiona perfiles de talento y asignaciones",
      systemSettings: "Configuraciones del Sistema",
      systemSettingsDescription: "Configura ajustes globales del sistema"
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Card */}
          <Card className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/users')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{t.users}</h3>
                  <p className="text-muted-foreground text-sm">{t.usersDescription}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Events Card */}
          
            <Card className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/business-events')}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Business Events</h3>
                    <p className="text-muted-foreground text-sm">Manage corporate events and business engagements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          

          {/* Talent Directory Card */}
          <Card className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/talent-directory')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{t.talentDirectory}</h3>
                  <p className="text-muted-foreground text-sm">{t.talentDirectoryDescription}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Settings Card */}
           <Card className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/settings')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                  <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{t.systemSettings}</h3>
                  <p className="text-muted-foreground text-sm">{t.systemSettingsDescription}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default AdminDashboard;
