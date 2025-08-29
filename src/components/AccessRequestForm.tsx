import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccessRequestFormProps {
  onBack: () => void;
  language: 'en' | 'es';
}

const AccessRequestForm = ({ onBack, language }: AccessRequestFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const { toast } = useToast();

  const content = {
    en: {
      title: "Request Access",
      subtitle: "Request access to the Funko Flash platform",
      firstName: "First Name",
      lastName: "Last Name", 
      email: "Email Address",
      phone: "Phone Number",
      message: "Please tell us why you would like access to the site?",
      submit: "Submit Request",
      back: "Back to Login",
      thankYouTitle: "Thank You!",
      thankYouMessage: "Your access request has been submitted successfully. Our team will review your request and get back to you soon.",
      submitting: "Submitting...",
      requiredField: "This field is required",
      invalidEmail: "Please enter a valid email address"
    },
    es: {
      title: "Solicitar Acceso",
      subtitle: "Solicita acceso a la plataforma Funko Flash",
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Dirección de Correo",
      phone: "Número de Teléfono",
      message: "Por favor, dinos por qué te gustaría acceder al sitio?",
      submit: "Enviar Solicitud",
      back: "Volver al Inicio de Sesión",
      thankYouTitle: "¡Gracias!",
      thankYouMessage: "Tu solicitud de acceso ha sido enviada exitosamente. Nuestro equipo revisará tu solicitud y te contactará pronto.",
      submitting: "Enviando...",
      requiredField: "Este campo es requerido",
      invalidEmail: "Por favor ingresa un correo válido"
    }
  };

  const t = content[language];

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: t.requiredField + ": " + t.firstName,
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.email.trim()) {
      toast({
        title: "Error", 
        description: t.requiredField + ": " + t.email,
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: t.invalidEmail,
        variant: "destructive",
      });
      return false;
    }

    if (!formData.message.trim()) {
      toast({
        title: "Error",
        description: t.requiredField + ": Message",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('access_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message,
          status: 'pending'
        });

      if (error) throw error;

      setShowThankYou(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      
    } catch (error: any) {
      console.error('Error submitting access request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{
           // NEUTRALIZED: Global CSS background enforced
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat',
           backgroundAttachment: 'fixed'
         }}>
      
      <Card className="w-full max-w-md border-2 border-black bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-funko-orange">
            {t.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                {t.firstName} *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-2 border-gray-300 focus:border-funko-orange"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                {t.email} *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-2 border-gray-300 focus:border-funko-orange"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                {t.phone}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-2 border-gray-300 focus:border-funko-orange"
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-sm font-medium">
                {t.message} *
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="border-2 border-gray-300 focus:border-funko-orange min-h-20"
                placeholder="Please provide details about why you need access..."
                required
              />
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-funko-orange hover:bg-funko-orange/90 text-white font-semibold py-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  t.submitting
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t.submit}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-gray-300 hover:bg-gray-50"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.back}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-funko-orange">
              {t.thankYouTitle}
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              {t.thankYouMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => {
                setShowThankYou(false);
                onBack();
              }}
              className="bg-funko-orange hover:bg-funko-orange/90"
            >
              {t.back}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessRequestForm;