import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/utils/notifications';

/**
 * Component that listens for bet settlements and creates notifications
 * This works alongside NotificationListener to show toast and push notifications
 */
export const BetSettlementNotifier = () => {
  const { user } = useAuth();

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
        async (payload) => {
          const oldBet = payload.old;
          const newBet = payload.new;

          // Only notify when status changes from pending to settled
          if (oldBet.status === 'pending' && newBet.status !== 'pending') {
            const statusEmoji = {
              win: '✅',
              loss: '❌',
              push: '🔄'
            }[newBet.status] || '📊';

            // Create notification in database (will trigger real-time toast)
            await createNotification({
              userId: user.id,
              title: `${statusEmoji} Bet Settled!`,
              message: `${newBet.event_name}: ${newBet.selection} → ${newBet.status.toUpperCase()}`,
              type: 'bet_settlement',
              link: '/bets',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null; // This component doesn't render anything
};
