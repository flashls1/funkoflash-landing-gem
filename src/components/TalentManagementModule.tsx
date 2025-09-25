import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar,
  UserCog,
  Settings
} from 'lucide-react';
import { EventsManagementModule } from './EventsManagementModule';

interface TalentManagementModuleProps {
  language?: 'en' | 'es';
}

export const TalentManagementModule: React.FC<TalentManagementModuleProps> = ({ 
  language = 'en' 
}) => {
  const [activeModule, setActiveModule] = useState('events');

  const content = {
    en: {
      talentManagement: 'Talent Management',
      events: 'Events Management',
      profiles: 'Talent Profiles',
      assets: 'Talent Assets',
      settings: 'Settings'
    },
    es: {
      talentManagement: 'Gestión de Talentos',
      events: 'Gestión de Eventos',
      profiles: 'Perfiles de Talento',
      assets: 'Recursos de Talento',
      settings: 'Configuración'
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          {content[language].talentManagement}
        </h1>
      </div>

      <Tabs value={activeModule} onValueChange={setActiveModule}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {content[language].events}
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            {content[language].profiles}
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {content[language].assets}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {content[language].settings}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-6">
          <EventsManagementModule language={language} />
        </TabsContent>

        <TabsContent value="profiles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{content[language].profiles}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Talent Profiles management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{content[language].assets}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Talent Assets management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{content[language].settings}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Settings management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};