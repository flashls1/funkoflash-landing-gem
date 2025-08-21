import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard"; 
import TalentDashboard from "./pages/TalentDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import SiteDesignModule from "./pages/SiteDesignModule";
import TalentDirectory from "./pages/TalentDirectory";
import TalentProfile from "./pages/TalentProfile";
import TalentDirectoryCMS from "./pages/TalentDirectoryCMS";
import TalentBuildoutCMS from "./pages/TalentBuildoutCMS";
import Shop from "./pages/Shop";
import ShopManager from "./pages/ShopManager";
import Events from "./pages/Events";
import EventsManager from "./pages/EventsManager";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import BusinessEventsPage from "./features/business-events/BusinessEventsPage";
import BusinessEventDetail from "./features/business-events/BusinessEventDetail";
import BackgroundManager from "./features/appearance/BackgroundManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ErrorBoundary>
          <BackgroundManager />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/staff" element={<StaffDashboard />} />
            <Route path="/dashboard/talent" element={<TalentDashboard />} />
            <Route path="/dashboard/business" element={<BusinessDashboard />} />
            <Route path="/admin/site-design" element={<SiteDesignModule />} />
            <Route path="/talent-directory" element={<TalentDirectory />} />
            <Route path="/talent/:slug" element={<TalentProfile />} />
            <Route path="/admin/talent-directory" element={<TalentDirectoryCMS />} />
            <Route path="/admin/talent-buildout/:talentId" element={<TalentBuildoutCMS />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/admin/shop-manager" element={<ShopManager />} />
            <Route path="/events" element={<Events />} />
            <Route path="/admin/events-manager" element={<EventsManager />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/admin/business-events" element={<BusinessEventsPage />} />
            <Route path="/admin/business-events/:id" element={<BusinessEventDetail />} />
            <Route path="/business/events" element={<BusinessEventsPage />} />
            <Route path="/business/events/:id" element={<BusinessEventDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
