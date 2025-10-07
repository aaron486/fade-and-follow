import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBetSettlement = () => {
  const { toast } = useToast();

  const settleBets = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('settle-bets');
      
      if (error) {
        console.error('Error settling bets:', error);
        return;
      }

      if (data?.settled > 0) {
        toast({
          title: "Bets Settled",
          description: `${data.settled} bet(s) have been automatically settled.`,
        });
      }
    } catch (error) {
      console.error('Error in bet settlement:', error);
    }
  }, [toast]);

  useEffect(() => {
    // Check for bet settlements every 5 minutes
    const interval = setInterval(() => {
      settleBets();
    }, 300000);

    // Run immediately on mount
    settleBets();

    return () => clearInterval(interval);
  }, [settleBets]);

  return { settleBets };
};
