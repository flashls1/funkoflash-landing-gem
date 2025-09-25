import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import UnifiedHeroSection from '@/components/UnifiedHeroSection';
import { useSiteDesign } from '@/hooks/useSiteDesign';

interface AccessRequestForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const Auth = () => {
  const { language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [accessForm, setAccessForm] = useState<AccessRequestForm>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const { signIn, signUp, resetPassword, user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setCurrentPage } = useSiteDesign();

  useEffect(() => {
    setCurrentPage('auth');
  }, [setCurrentPage]);

  const content = {
    en: {
      login: "Login",
      signup: "Sign Up",
      email: "Email",
      password: "Password",
      firstName: "First Name",
      lastName: "Last Name",
      loginButton: "Sign In",
      signupButton: "Create Account",
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      sendReset: "Send Reset Email",
      cancel: "Cancel",
      switchToSignup: "Don't have an account? Sign up",
      switchToLogin: "Already have an account? Sign in",
      requestAccess: "REQUEST ACCESS",
      requestAccessTitle: "Request Access",
      requestAccessDesc: "Fill out this form to request access to the platform",
      name: "Name",
      phone: "Phone Number",
      message: "Message",
      submitRequest: "Submit Request",
      loginTitle: "Welcome Back",
      loginDesc: "Sign in to your account",
      signupTitle: "Create Account", 
      signupDesc: "Join the FunkoFlash platform"
    },
    es: {
      login: "Iniciar Sesión",
      signup: "Registrarse",
      email: "Correo Electrónico",
      password: "Contraseña",
      firstName: "Nombre",
      lastName: "Apellido",
      loginButton: "Iniciar Sesión",
      signupButton: "Crear Cuenta",
      forgotPassword: "¿Olvidaste tu contraseña?",
      resetPassword: "Restablecer Contraseña",
      sendReset: "Enviar Email de Restablecimiento",
      cancel: "Cancelar",
      switchToSignup: "¿No tienes cuenta? Regístrate",
      switchToLogin: "¿Ya tienes cuenta? Inicia sesión",
      requestAccess: "SOLICITAR ACCESO",
      requestAccessTitle: "Solicitar Acceso",
      requestAccessDesc: "Completa este formulario para solicitar acceso a la plataforma",
      name: "Nombre",
      phone: "Número de Teléfono",
      message: "Mensaje",
      submitRequest: "Enviar Solicitud",
      loginTitle: "Bienvenido de Nuevo",
      loginDesc: "Inicia sesión en tu cuenta",
      signupTitle: "Crear Cuenta",
      signupDesc: "Únete a la plataforma FunkoFlash"
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
        title: "Validation Error",
        description: "Please fill in all required fields",
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
        title: "Validation Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    await resetPassword(resetEmail);
    setShowForgotPassword(false);
    setResetEmail('');
  };

  const handleRequestAccess = async () => {
    if (!accessForm.name || !accessForm.email || !accessForm.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('access_requests')
        .insert([accessForm]);

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your access request has been submitted. An admin will review it shortly.",
      });

      setShowRequestAccess(false);
      setAccessForm({ name: '', email: '', phone: '', message: '' });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      {/* Background wraps hero + content */}
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
        {/* Hero Section - Hidden on mobile */}
        <div className="hidden md:block">
          <UnifiedHeroSection 
            language={language} 
            className="mt-[5px] rounded-2xl overflow-hidden border-2"
            style={{ borderColor: 'hsl(0 0% 100%)' }}
          />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-4 md:py-8 mt-4 md:mt-0">
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
              Enter your email address to receive password reset instructions.
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

      {/* Request Access Dialog */}
      <Dialog open={showRequestAccess} onOpenChange={setShowRequestAccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.requestAccessTitle}</DialogTitle>
            <DialogDescription>
              {t.requestAccessDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessName">{t.name}</Label>
              <Input
                id="accessName"
                type="text"
                value={accessForm.name}
                onChange={(e) => setAccessForm({...accessForm, name: e.target.value})}
                placeholder={t.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessEmail">{t.email}</Label>
              <Input
                id="accessEmail"
                type="email"
                value={accessForm.email}
                onChange={(e) => setAccessForm({...accessForm, email: e.target.value})}
                placeholder={t.email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessPhone">{t.phone}</Label>
              <Input
                id="accessPhone"
                type="tel"
                value={accessForm.phone}
                onChange={(e) => setAccessForm({...accessForm, phone: e.target.value})}
                placeholder={t.phone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessMessage">{t.message}</Label>
              <Textarea
                id="accessMessage"
                value={accessForm.message}
                onChange={(e) => setAccessForm({...accessForm, message: e.target.value})}
                placeholder={t.message}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestAccess(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleRequestAccess} variant="funko">
              {t.submitRequest}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;