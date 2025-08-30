
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'es';
}

interface AccessRequestForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const RequestAccessModal = ({ isOpen, onClose, language }: RequestAccessModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AccessRequestForm>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const { toast } = useToast();

  const content = {
    en: {
      title: "Request Access",
      description: "Fill out this form to request access to the platform",
      name: "Name",
      email: "Email",
      phone: "Phone Number",
      message: "Message",
      submit: "Submit Request",
      cancel: "Cancel",
      success: "Request submitted successfully",
      successDesc: "Your access request has been submitted. An admin will review it shortly.",
      error: "Submission Failed",
      validation: "Please fill in all required fields"
    },
    es: {
      title: "Solicitar Acceso",
      description: "Complete este formulario para solicitar acceso a la plataforma",
      name: "Nombre",
      email: "Correo Electrónico",
      phone: "Número de Teléfono",
      message: "Mensaje",
      submit: "Enviar Solicitud",
      cancel: "Cancelar",
      success: "Solicitud enviada exitosamente",
      successDesc: "Su solicitud de acceso ha sido enviada. Un administrador la revisará pronto.",
      error: "Error al Enviar",
      validation: "Por favor complete todos los campos requeridos"
    }
  };

  const t = content[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Error de Validación",
        description: t.validation,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('access_requests')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: t.success,
        description: t.successDesc,
      });

      setFormData({ name: '', email: '', phone: '', message: '' });
      onClose();
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessName">{t.name} *</Label>
            <Input
              id="accessName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder={t.name}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accessEmail">{t.email} *</Label>
            <Input
              id="accessEmail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder={t.email}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accessPhone">{t.phone}</Label>
            <Input
              id="accessPhone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder={t.phone}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accessMessage">{t.message} *</Label>
            <Textarea
              id="accessMessage"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder={t.message}
              rows={4}
              required
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              {t.cancel}
            </Button>
            <Button 
              type="submit" 
              variant="funko"
              disabled={loading}
            >
              {loading ? "..." : t.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestAccessModal;
