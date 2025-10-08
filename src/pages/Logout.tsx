import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';

const Logout = () => {
  const { language, setLanguage } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await signOut();
      } finally {
        if (isMounted) setSignedOut(true);
      }
    })();
    return () => { isMounted = false; };
  }, [signOut]);

  const content = {
    en: {
      title: 'Signed Out',
      desc: 'You have been signed out securely.',
      login: 'Go to Login',
    },
    es: {
      title: 'Sesión cerrada',
      desc: 'Has cerrado sesión de forma segura.',
      login: 'Ir a Iniciar Sesión',
    }
  } as const;

  const t = content[language];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="funko" 
              className="w-full" 
              onClick={() => navigate('/auth')}
              disabled={!signedOut}
            >
              {t.login}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer language={language} />
    </div>
  );
};

export default Logout;
