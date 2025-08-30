import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Users, UserCheck, Calendar, Activity } from "lucide-react";

export default function AdminStats() {
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    pendingRequests: 0,
    activeEvents: 0,
    systemHealth: 100
  });
  const { language } = useLanguage();

  const content = {
    en: {
      totalUsers: "Total Users",
      pendingRequests: "Pending Requests", 
      activeEvents: "Active Events",
      systemHealth: "System Health"
    },
    es: {
      totalUsers: "Usuarios Totales",
      pendingRequests: "Solicitudes Pendientes",
      activeEvents: "Eventos Activos", 
      systemHealth: "Estado del Sistema"
    }
  };

  const t = content[language];

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("active", true);

        // Fetch pending access requests
        const { count: requestCount } = await supabase
          .from("access_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Fetch active events
        const { count: eventCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("active", true);

        setStats({
          totalUsers: userCount || 0,
          pendingRequests: requestCount || 0,
          activeEvents: eventCount || 0,
          systemHealth: 98 // Could be calculated based on various metrics
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: t.totalUsers,
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: t.pendingRequests,
      value: stats.pendingRequests,
      icon: UserCheck,
      color: "text-orange-600"
    },
    {
      title: t.activeEvents,
      value: stats.activeEvents,
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: t.systemHealth,
      value: `${stats.systemHealth}%`,
      icon: Activity,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}