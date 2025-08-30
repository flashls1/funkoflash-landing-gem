
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import UnifiedHeroSection from '@/components/UnifiedHeroSection';
import RequestAccessModal from '@/components/RequestAccessModal';
import { useSiteDesign } from '@/hooks/useSiteDesign';

const Auth = () => {
  const { language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { signIn, resetPassword, user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setCurrentPage } = useSiteDesign();

  useEffect(() => {
    setCurrentPage('auth');
  }, [setCurrentPage]);

  const content = {
    en: {
      loginTitle: "Welcome Back",
      loginDesc: "Sign in to your account",
      email: "Email",
      password: "Password",
      loginButton: "Sign In",
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      sendReset: "Send Reset Email",
      cancel: "Cancel",
      requestAccess: "REQUEST ACCESS"
    },
    es: {
      loginTitle: "Bienvenido de Nuevo",
      loginDesc: "Inicia sesión en tu cuenta",
      email: "Correo Electrónico",
      password: "Contraseña",
      loginButton: "Iniciar Sesión",
      forgotPassword: "¿Olvidaste tu contraseña?",
      resetPassword: "Restablecer Contraseña",
      sendReset: "Enviar Email de Restablecimiento",
      cancel: "Cancelar",
      requestAccess: "SOLICITAR ACCESO"
    }
  };

  const t = content[language];

  useEffect(() => {
    if (user && profile) {
      // Redirect based on user role
      switch (profile.role) {
        case 'admin':
          navigate('/dashboard/admin');
          break;
        case 'staff':
          navigate('/dashboard/staff');
          break;
        case 'talent':
          navigate('/dashboard/talent');
          break;
        case 'business':
          navigate('/dashboard/business');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast({
        title: "Error de Validación",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    await signIn(email, password);
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "Error de Validación",
        description: "Por favor ingrese su dirección de correo electrónico",
        variant: "destructive",
      });
      return;
    }

    await resetPassword(resetEmail);
    setShowForgotPassword(false);
    setResetEmail('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      {/* Hero Section */}
      <UnifiedHeroSection language={language} />
      
      {/* Main Content with Background */}
      <div 
        className="flex-1"
        style={{
          backgroundImage: 'var(--site-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-no-repeat bg-center bg-contain opacity-10 pointer-events-none"
              style={{
                backgroundImage: "url('/lovable-uploads/67bbac87-013f-4469-bfeb-bc5f77732cdc.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center center'
              }}
            ></div>
            <CardHeader className="text-center relative z-10">
              <CardTitle className="text-2xl font-bold">
                {t.loginTitle}
              </CardTitle>
              <CardDescription>
                {t.loginDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t.email}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t.password}
                  />
                </div>

                <Button type="submit" className="w-full" variant="funko" disabled={loading}>
                  {loading ? "..." : t.loginButton}
                </Button>
              </form>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  {t.forgotPassword}
                </button>

                <Button
                  variant="funko-outline"
                  onClick={() => setShowRequestAccess(true)}
                  className="w-full mt-4"
                >
                  {t.requestAccess}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Footer language={language} />
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.resetPassword}</DialogTitle>
            <DialogDescription>
              Ingrese su dirección de correo electrónico para recibir instrucciones de restablecimiento de contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">{t.email}</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder={t.email}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForgotPassword(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleForgotPassword} variant="funko">
              {t.sendReset}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Access Modal */}
      <RequestAccessModal
        isOpen={showRequestAccess}
        onClose={() => setShowRequestAccess(false)}
        language={language}
      />
    </div>
  );
};

export default Auth;
