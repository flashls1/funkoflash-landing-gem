import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OptimisticUpdate<T> {
  data: T;
  updatedAt?: string;
}

export const useOptimisticConcurrency = <T extends { id: string; updated_at?: string }>() => {
  const [conflictData, setConflictData] = useState<T | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const { toast } = useToast();

  const checkConcurrency = (original: OptimisticUpdate<T>, current: T): boolean => {
    if (!original.updatedAt || !current.updated_at) return true;
    
    const originalTime = new Date(original.updatedAt);
    const currentTime = new Date(current.updated_at);
    
    return originalTime >= currentTime;
  };

  const handleConflict = (conflictingData: T, language: 'en' | 'es' = 'en') => {
    setConflictData(conflictingData);
    setShowConflictDialog(true);
    
    const message = language === 'es' 
      ? "Este evento fue actualizado en otro lugar. Recarga para continuar o sobrescribe con tus cambios."
      : "This event was updated elsewhere. Reload to continue or overwrite with your changes.";
      
    toast({
      title: language === 'es' ? "Conflicto de Concurrencia" : "Concurrency Conflict",
      description: message,
      variant: "destructive",
    });
  };

  const resolveConflict = (action: 'reload' | 'overwrite') => {
    setShowConflictDialog(false);
    setConflictData(null);
    return action;
  };

  return {
    checkConcurrency,
    handleConflict,
    resolveConflict,
    conflictData,
    showConflictDialog,
  };
};