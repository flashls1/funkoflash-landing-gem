import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AdminThemeProvider from "@/components/AdminThemeProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, Settings, Shield, Database, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminSystemSettings() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      title: "System Settings",
      description: "Configure system preferences and global settings",
      security: "Security Settings",
      securityDesc: "Manage authentication and security policies",
      database: "Database Settings",
      databaseDesc: "Configure database connections and backup settings",
      notifications: "Notification Settings", 
      notificationsDesc: "Manage system notifications and alerts",
      backToDashboard: "Back to Dashboard"
    },
    es: {
      title: "Configuración del Sistema",
      description: "Configurar preferencias del sistema y ajustes globales",
      security: "Configuración de Seguridad",
      securityDesc: "Gestionar autenticación y políticas de seguridad",
      database: "Configuración de Base de Datos",
      databaseDesc: "Configurar conexiones de base de datos y ajustes de respaldo",
      notifications: "Configuración de Notificaciones",
      notificationsDesc: "Gestionar notificaciones del sistema y alertas",
      backToDashboard: "Volver al Panel"
    }
  };

  const t = content[language];

  const settingsModules = [
    {
      title: t.security,
      description: t.securityDesc,
      icon: Shield,
      color: "text-red-600"
    },
    {
      title: t.database,
      description: t.databaseDesc,
      icon: Database,
      color: "text-blue-600"
    },
    {
      title: t.notifications,
      description: t.notificationsDesc,
      icon: Bell,
      color: "text-yellow-600"
    }
  ];

  return (
    <AdminThemeProvider>
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard/admin")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToDashboard}
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
          <p className="text-muted-foreground">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${module.color}`} />
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {module.description}
                  </CardDescription>
                  <Button variant="outline" className="w-full">
                    {language === 'es' ? 'Configurar' : 'Configure'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Footer language={language} />
    </AdminThemeProvider>
  );
}