import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}) => {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-black/95 border-white/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">{title}</DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex items-center justify-center p-4">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};