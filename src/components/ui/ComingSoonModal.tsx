import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  language: 'en' | 'es';
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose,
  featureName,
  language
}) => {
  const content = {
    en: {
      title: "Feature Coming Soon",
      message: `${featureName} is currently under development and will be available soon.`,
      button: "Got it"
    },
    es: {
      title: "Función Próximamente",
      message: `${featureName} está actualmente en desarrollo y estará disponible pronto.`,
      button: "Entendido"
    }
  };

  const t = content[language];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t.title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            {t.message}
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>
            {t.button}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};