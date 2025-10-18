import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Component that listens for bet settlements and shows notifications
 * Add this to your main Dashboard or App component
 */
export const BetSettlementNotifier = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Subscribe to bet status changes
    const channel = supabase
      .channel('bet-settlements')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const oldBet = payload.old;
          const newBet = payload.new;

          // Only notify when status changes from pending to settled
          if (oldBet.status === 'pending' && newBet.status !== 'pending') {
            const statusEmoji = {
              win: '✅',
              loss: '❌',
              push: '🔄'
            }[newBet.status] || '📊';

            toast({
              title: `${statusEmoji} Bet Settled!`,
              description: `${newBet.event_name}: ${newBet.selection} → ${newBet.status.toUpperCase()}`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return null; // This component doesn't render anything
};
