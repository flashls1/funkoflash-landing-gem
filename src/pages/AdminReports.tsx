import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AdminThemeProvider from "@/components/AdminThemeProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, BarChart3, Users, Activity, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminReports() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      title: "Reports & Analytics",
      description: "View detailed reports and analytics dashboard",
      userAnalytics: "User Analytics",
      userAnalyticsDesc: "Track user registrations, activity, and engagement",
      systemActivity: "System Activity",
      systemActivityDesc: "Monitor system performance and usage statistics",
      eventReports: "Event Reports",
      eventReportsDesc: "Analyze event data and attendance metrics",
      backToDashboard: "Back to Dashboard"
    },
    es: {
      title: "Informes y Análisis",
      description: "Ver informes detallados y panel de análisis",
      userAnalytics: "Análisis de Usuarios",
      userAnalyticsDesc: "Seguir registros de usuarios, actividad y participación",
      systemActivity: "Actividad del Sistema",
      systemActivityDesc: "Monitorear rendimiento del sistema y estadísticas de uso",
      eventReports: "Informes de Eventos",
      eventReportsDesc: "Analizar datos de eventos y métricas de asistencia",
      backToDashboard: "Volver al Panel"
    }
  };

  const t = content[language];

  const reportModules = [
    {
      title: t.userAnalytics,
      description: t.userAnalyticsDesc,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: t.systemActivity,
      description: t.systemActivityDesc,
      icon: Activity,
      color: "text-green-600"
    },
    {
      title: t.eventReports,
      description: t.eventReportsDesc,
      icon: Calendar,
      color: "text-purple-600"
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
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
          <p className="text-muted-foreground">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportModules.map((module, index) => {
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
                    {language === 'es' ? 'Ver Informe' : 'View Report'}
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