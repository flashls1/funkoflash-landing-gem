
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import funkoFlashLogo from "/lovable-uploads/75e54418-75f9-4698-9a3b-7fd376db7c14.png";
import flagUs from "@/assets/flag-us.png";
import flagMx from "@/assets/flag-mx.png";
import { Globe, Menu, X } from "lucide-react";
import { hasFeature, FEATURES } from "@/lib/features";
import { usePermissions } from "@/hooks/usePermissions";

interface NavigationProps {
  language: 'en' | 'es';
  setLanguage: (lang: 'en' | 'es') => void;
  customStyles?: {
    backgroundColor?: string;
    textColor?: string;
    titleColor?: string;
    fontSize?: string;
    fontFamily?: string;
  };
}

const Navigation = ({ language, setLanguage, customStyles }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutOnHover, setShowLogoutOnHover] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  // Apply FunkoFlash brand styling for public-facing navigation
  const navStyles = {
    backgroundColor: customStyles?.backgroundColor || 'hsl(var(--funko-blue-dark))',
    color: customStyles?.textColor || 'hsl(0 0% 100%)',
    fontSize: customStyles?.fontSize || '14px',
    fontFamily: customStyles?.fontFamily || 'inherit'
  };

  // Build navigation items dynamically
  const buildNavigationItems = () => {
    const baseItems = {
      en: ['HOME', 'SHOP', 'TALENT DIRECTORY', 'EVENTS', 'ABOUT', 'CONTACT'],
      es: ['INICIO', 'TIENDA', 'DIRECTORIO DE TALENTO', 'EVENTOS', 'ACERCA DE', 'CONTACTO']
    };
    
    const baseLinks = ['/', '/shop', '/talent-directory', '/events', '/about', '/contact'];
    
    return { items: baseItems[language], links: baseLinks };
  };

  const { items: navigationItems, links: navigationLinks } = buildNavigationItems();

  const loginText = {
    en: 'LOG IN',
    es: 'INICIAR SESIÓN'
  };

  const dashboardText = {
    en: 'DASHBOARD',
    es: 'PANEL'
  };

  const logoutText = {
    en: 'LOG OUT',
    es: 'CERRAR SESIÓN'
  };

  const handleDashboardClick = () => {
    const dashboardPath = `/dashboard/${profile.role}`;
    const currentPath = window.location.pathname;
    
    // If on dashboard or admin pages, logout. Otherwise, go to dashboard
    if (currentPath.startsWith('/dashboard/') || currentPath.startsWith('/admin/')) {
      signOut();
      navigate('/');
    } else {
      navigate(dashboardPath);
    }
  };

  return (
    <nav 
      className="border-b border-funko-blue/20 sticky top-0 z-50 shadow-lg"
      style={{ 
        backgroundColor: navStyles.backgroundColor,
        fontFamily: navStyles.fontFamily,
        borderBottom: '2px solid hsl(var(--funko-orange))'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src={funkoFlashLogo} 
              alt="Funko Flash" 
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  to={navigationLinks[index]}
                  style={{ 
                    color: customStyles?.titleColor || navStyles.color,
                    fontSize: navStyles.fontSize 
                  }}
                  className="hover:text-funko-orange font-medium tracking-wide transition-colors duration-300 hover:scale-105 transform"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side - Language Toggle & Login */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="flex items-center space-x-2 bg-muted p-1 rounded-full">
              <button
                onClick={() => setLanguage('en')}
                className={`p-2 rounded-full transition-all duration-300 ${
                  language === 'en' ? 'bg-funko-orange shadow-funko' : 'hover:bg-background'
                }`}
              >
                <img src={flagUs} alt="English" className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`p-2 rounded-full transition-all duration-300 ${
                  language === 'es' ? 'bg-funko-orange shadow-funko' : 'hover:bg-background'
                }`}
              >
                <img src={flagMx} alt="Español" className="w-5 h-5" />
              </button>
            </div>

            {/* Login/Dashboard Button */}
            {user && profile ? (
              <div 
                className="relative"
                onMouseEnter={() => setShowLogoutOnHover(true)}
                onMouseLeave={() => setShowLogoutOnHover(false)}
              >
                <Button 
                  variant="funko" 
                  className="font-medium tracking-wide transition-all duration-300"
                  onClick={handleDashboardClick}
                >
                  {showLogoutOnHover ? logoutText[language] : dashboardText[language]}
                </Button>
              </div>
            ) : (
              <Button 
                variant="funko" 
                className="font-medium tracking-wide"
                onClick={() => navigate('/auth')}
              >
                {loginText[language]}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ color: navStyles.color }}
              className="hover:text-funko-orange transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden border-t border-border"
          style={{ backgroundColor: navStyles.backgroundColor }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                to={navigationLinks[index]}
                style={{ 
                  color: customStyles?.titleColor || navStyles.color,
                  fontSize: navStyles.fontSize 
                }}
                className="hover:text-funko-orange block px-3 py-2 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            
            {/* Mobile Language Toggle */}
            <div className="flex items-center justify-between px-3 py-2">
              <span 
                className="text-sm font-medium text-muted-foreground"
                style={{ color: navStyles.color }}
              >
                Language:
              </span>
              <div className="flex items-center space-x-2 bg-muted p-1 rounded-full">
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-1 rounded-full transition-all duration-300 ${
                    language === 'en' ? 'bg-funko-orange shadow-funko' : ''
                  }`}
                >
                  <img src={flagUs} alt="English" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLanguage('es')}
                  className={`p-1 rounded-full transition-all duration-300 ${
                    language === 'es' ? 'bg-funko-orange shadow-funko' : ''
                  }`}
                >
                  <img src={flagMx} alt="Español" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Login/Dashboard Button */}
            <div className="px-3 py-2">
              {user && profile ? (
                <div className="space-y-2">
                  <Button 
                    variant="funko" 
                    className="w-full font-medium tracking-wide"
                    onClick={() => {
                      const dashboardPath = `/dashboard/${profile.role}`;
                      const currentPath = window.location.pathname;
                      
                      if (!currentPath.startsWith('/dashboard/') && !currentPath.startsWith('/admin/')) {
                        navigate(dashboardPath);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {dashboardText[language]}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full font-medium tracking-wide"
                    onClick={() => {
                      signOut();
                      navigate('/');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {logoutText[language]}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="funko" 
                  className="w-full font-medium tracking-wide"
                  onClick={() => {
                    navigate('/auth');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {loginText[language]}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
