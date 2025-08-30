import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AdminThemeProvider from "@/components/AdminThemeProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, FileText, Image, Video, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminContentManagement() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      title: "Content Management",
      description: "Manage site content, media, and digital assets",
      mediaLibrary: "Media Library",
      mediaLibraryDesc: "Upload and manage images, videos, and documents",
      pageContent: "Page Content",
      pageContentDesc: "Edit homepage, about, and other static page content",
      siteAssets: "Site Assets",
      siteAssetsDesc: "Manage logos, banners, and other site assets",
      backToDashboard: "Back to Dashboard"
    },
    es: {
      title: "Gestión de Contenido",
      description: "Gestionar contenido del sitio, medios y activos digitales",
      mediaLibrary: "Biblioteca de Medios",
      mediaLibraryDesc: "Subir y gestionar imágenes, videos y documentos",
      pageContent: "Contenido de Páginas",
      pageContentDesc: "Editar página de inicio, acerca de, y otro contenido estático",
      siteAssets: "Activos del Sitio",
      siteAssetsDesc: "Gestionar logos, banners y otros activos del sitio",
      backToDashboard: "Volver al Panel"
    }
  };

  const t = content[language];

  const contentModules = [
    {
      title: t.mediaLibrary,
      description: t.mediaLibraryDesc,
      icon: Image,
      color: "text-green-600"
    },
    {
      title: t.pageContent,
      description: t.pageContentDesc,
      icon: Globe,
      color: "text-blue-600"
    },
    {
      title: t.siteAssets,
      description: t.siteAssetsDesc,
      icon: Video,
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
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
          <p className="text-muted-foreground">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentModules.map((module, index) => {
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
                    {language === 'es' ? 'Gestionar' : 'Manage'}
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