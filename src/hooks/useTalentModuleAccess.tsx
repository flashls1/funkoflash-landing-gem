import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ModuleAccess {
  id: string;
  talent_id: string;
  module_id: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export const useTalentModuleAccess = (talentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: moduleAccess, isLoading, error, refetch } = useQuery({
    queryKey: ["talent-module-access", talentId],
    queryFn: async () => {
      if (!talentId) return new Map<string, boolean>();

      const { data, error } = await supabase
        .from("talent_module_access")
        .select("*")
        .eq("talent_id", talentId);

      if (error) throw error;

      // Convert to Map for easy lookup
      const accessMap = new Map<string, boolean>();
      data?.forEach((item) => {
        accessMap.set(item.module_id, item.is_locked);
      });

      return accessMap;
    },
    enabled: !!talentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateModuleAccess = useMutation({
    mutationFn: async ({
      talentId,
      moduleId,
      isLocked,
    }: {
      talentId: string;
      moduleId: string;
      isLocked: boolean;
    }) => {
      const { data, error } = await supabase
        .from("talent_module_access")
        .upsert(
          {
            talent_id: talentId,
            module_id: moduleId,
            is_locked: isLocked,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "talent_id,module_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-module-access"] });
      toast({
        title: "Module access updated",
        description: "The module access has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating module access",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    moduleAccess: moduleAccess || new Map<string, boolean>(),
    isLoading,
    error,
    refetch,
    updateModuleAccess,
  };
};
