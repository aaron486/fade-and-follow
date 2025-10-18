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
    // Check for bet settlements every 15 minutes (reduced frequency to avoid rate limits)
    const interval = setInterval(() => {
      settleBets();
    }, 900000); // 15 minutes instead of 5

    // Don't run immediately on mount to reduce initial load
    // Run first check after 1 minute
    const initialTimeout = setTimeout(() => {
      settleBets();
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [settleBets]);

  return { settleBets };
};
