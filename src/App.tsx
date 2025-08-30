import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { SiteDesignProvider } from "@/hooks/useSiteDesign";
import { ColorThemeProvider } from "@/hooks/useColorTheme";
import ErrorBoundary from "@/components/ErrorBoundary";

// Import all pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Shop from "./pages/Shop";
import TalentDirectory from "./pages/TalentDirectory";
import Events from "./pages/Events";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Calendar from "./pages/Calendar";
import TalentProfile from "./pages/TalentProfile";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import TalentDashboard from "./pages/TalentDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import SiteDesignModule from "./pages/SiteDesignModule";
import TalentDirectoryCMS from "./pages/TalentDirectoryCMS";
import ShopManager from "./pages/ShopManager";
import EventsManager from "./pages/EventsManager";
import TalentBuildoutCMS from "./pages/TalentBuildoutCMS";
import TalentPortfolioManagement from "./pages/TalentPortfolioManagement";
import TalentBookingManagement from "./pages/TalentBookingManagement";
import BusinessBookingManagement from "./pages/BusinessBookingManagement";
import BusinessLogisticsManager from "./pages/BusinessLogisticsManager";
import NotFound from "./pages/NotFound";

// Import CMS and management components
import UserManagement from "./components/UserManagement";
import AccessRequestManager from "./components/AccessRequestManager";
import MessageCenter from "./components/MessageCenter";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <LanguageProvider>
              <SiteDesignProvider>
                <ColorThemeProvider>
                  <AuthProvider>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/talent-directory" element={<TalentDirectory />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/talent/:slug" element={<TalentProfile />} />
                      
                      {/* Dashboard Routes */}
                      <Route path="/dashboard/admin" element={<AdminDashboard />} />
                      <Route path="/dashboard/staff" element={<StaffDashboard />} />
                      <Route path="/dashboard/talent" element={<TalentDashboard />} />
                      <Route path="/dashboard/business" element={<BusinessDashboard />} />
                      
                      {/* Admin Management Routes */}
                      <Route path="/admin/user-management" element={
                        <div className="min-h-screen bg-background">
                          <UserManagement language="en" />
                        </div>
                      } />
                      <Route path="/admin/access-requests" element={
                        <div className="min-h-screen bg-background">
                          <AccessRequestManager language="en" onBack={() => window.history.back()} />
                        </div>
                      } />
                      <Route path="/admin/message-center" element={
                        <div className="min-h-screen bg-background">
                          <MessageCenter language="en" />
                        </div>
                      } />
                      <Route path="/admin/site-design" element={<SiteDesignModule />} />
                      <Route path="/admin/talent-directory" element={<TalentDirectoryCMS />} />
                      <Route path="/admin/shop-manager" element={<ShopManager />} />
                      <Route path="/admin/events-manager" element={<EventsManager />} />
                      <Route path="/admin/calendar" element={<Calendar />} />
                      
                      {/* Talent Management Routes */}
                      <Route path="/admin/talent-buildout/:talentId" element={<TalentBuildoutCMS />} />
                      <Route path="/talent/portfolio" element={<TalentPortfolioManagement />} />
                      <Route path="/talent/bookings" element={<TalentBookingManagement />} />
                      
                      {/* Business Management Routes */}
                      <Route path="/business/bookings" element={<BusinessBookingManagement />} />
                      <Route path="/business/logistics" element={<BusinessLogisticsManager eventId="" onClose={() => {}} />} />
                      
                      {/* 404 Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster />
                    <Sonner />
                  </AuthProvider>
                </ColorThemeProvider>
              </SiteDesignProvider>
            </LanguageProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
