import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useChassisLink = (chassisNumber?: string) => {
  return useQuery({
    queryKey: ['chassis-link', chassisNumber],
    queryFn: async () => {
      if (!chassisNumber) return null;
      
      const { data, error } = await supabase
        .from('chassis_master')
        .select('forrest_chz_id, chassis_status, region')
        .eq('forrest_chz_id', chassisNumber)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!chassisNumber,
  });
};
