import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecureImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
  talentId: string;
  birthYear: number | null;
  failedAttempts: number;
  isLocked: boolean;
  lockedUntil: string | null;
  lockedByAdmin: boolean;
  documentType: 'passport' | 'visa' | null;
  iv: string | null;
}

export const SecureImageViewer: React.FC<SecureImageViewerProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  talentId,
  birthYear,
  failedAttempts,
  isLocked,
  lockedUntil,
  lockedByAdmin,
  documentType,
  iv,
}) => {
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [decryptedImageUrl, setDecryptedImageUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const { toast } = useToast();

  // Auto-hide image after 5 minutes (300 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showImage && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setShowImage(false);
            toast({
              title: 'Session Expired',
              description: 'Image viewing session has expired. Please enter passcode again.',
              variant: 'destructive'
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showImage, timeLeft, toast]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setShowImage(false);
      setTimeLeft(0);
      setDecryptedImageUrl(null);
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!birthYear) {
      toast({
        title: 'Access Denied',
        description: 'Authentication credentials not configured. Please contact admin.',
        variant: 'destructive'
      });
      return;
    }

    if (passcode !== birthYear.toString()) {
      setIsVerifying(true);
      
      try {
        // Increment failed attempts
        const newFailedAttempts = failedAttempts + 1;
        const shouldLock = newFailedAttempts >= 3;
        
        const { error } = await supabase
          .from('talent_quick_view')
          .update({
            image_view_failed_attempts: newFailedAttempts,
            image_view_locked_until: shouldLock ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null // 24 hour lockout
          })
          .eq('id', talentId);

        if (error) throw error;

        toast({
          title: 'Incorrect Passcode',
          description: shouldLock 
            ? 'Too many failed attempts. Account locked for 24 hours. Contact admin to reset.'
            : `Incorrect passcode. ${3 - newFailedAttempts} attempts remaining.`,
          variant: 'destructive'
        });

        if (shouldLock) {
          onClose();
        }
      } catch (error) {
        console.error('Error updating failed attempts:', error);
        toast({
          title: 'Error',
          description: 'Failed to verify passcode. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsVerifying(false);
        setPasscode('');
      }
      return;
    }

    // Correct passcode - decrypt and show image
    try {
      setIsDecrypting(true);
      
      // Reset failed attempts in database
      const { error: resetError } = await supabase
        .from('talent_quick_view')
        .update({
          image_view_failed_attempts: 0,
          image_view_locked_until: null
        })
        .eq('id', talentId);

      if (resetError) throw resetError;

      // Decrypt the image
      if (imageUrl && iv && documentType) {
        // Sanitize filename by stripping query parameters
        const fileName = imageUrl.split('?')[0].split('/').pop() || imageUrl;
        console.log('SecureImageViewer - Original imageUrl:', imageUrl);
        console.log('SecureImageViewer - Sanitized fileName:', fileName);
        
        const { data: decryptData, error: decryptError } = await supabase.functions.invoke('document-encryption', {
          body: {
            action: 'decrypt',
            fileName,
            talentId,
            documentType,
            iv
          }
        });

        if (decryptError) {
          console.error('Supabase function error in SecureImageViewer:', decryptError);
          throw decryptError;
        }

        if (decryptData.success) {
          setDecryptedImageUrl(decryptData.decryptedDataUrl);
        } else {
          console.error('Decryption function returned error in SecureImageViewer:', decryptData);
          throw new Error(decryptData.error || 'Decryption failed');
        }
      }

      setShowImage(true);
      setTimeLeft(300); // 5 minutes
      setPasscode('');
      
      toast({
        title: '🔒 Access Granted - Military-Grade Security',
        description: 'AES-256-GCM encrypted document unlocked. You can view this secure document for 5 minutes.',
      });
    } catch (error) {
      console.error('Error during decryption:', error);
      toast({
        title: 'Error',
        description: 'Authentication successful but failed to decrypt document.',
        variant: 'destructive'
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  const isCurrentlyLocked = isLocked || lockedByAdmin || (lockedUntil && new Date(lockedUntil) > new Date());

  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-black/95 border-white/20 
                               landscape:max-w-[95vw] landscape:max-h-[95vh]
                               transition-all duration-300 ease-in-out">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {title}
            </DialogTitle>
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
          {isCurrentlyLocked ? (
            <div className="text-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
              <div className="text-white">
                <h3 className="text-lg font-semibold mb-2">Access Locked</h3>
                <p className="text-white/80">
                  {lockedByAdmin 
                    ? 'This account has been locked by an administrator. Please contact admin to unlock.'
                    : 'Too many failed attempts. Account is temporarily locked. Please contact admin to reset.'}
                </p>
              </div>
            </div>
          ) : showImage ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-white/80 mb-2">
                  Time remaining: <span className="font-mono text-orange-400">{formatTime(timeLeft)}</span>
                </p>
              </div>
              <div className="flex justify-center items-center min-h-0 
                           landscape:min-h-0 landscape:flex landscape:items-center landscape:justify-center">
                <img
                  src={decryptedImageUrl || imageUrl}
                  alt={title}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg 
                           landscape:max-h-[45vh] landscape:max-w-[85vw] landscape:object-contain
                           transition-all duration-300 ease-in-out"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-md">
              <div className="text-center">
                <Lock className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Secure Document Access</h3>
                <p className="text-white/80 text-sm">
                  Enter the 4-digit passcode to view this sensitive document
                </p>
                {failedAttempts > 0 && (
                  <p className="text-red-400 text-sm mt-2">
                    {3 - failedAttempts} attempts remaining
                  </p>
                )}
              </div>

              <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passcode" className="text-white">Passcode</Label>
                  <Input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="bg-white/10 border-white/20 text-white text-center text-lg tracking-widest"
                    placeholder="••••"
                    autoFocus
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={passcode.length !== 4 || isVerifying || isDecrypting}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {isDecrypting ? 'Decrypting...' : isVerifying ? 'Verifying...' : 'View Document'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};