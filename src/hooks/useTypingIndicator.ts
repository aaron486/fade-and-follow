import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TypingUser {
  user_id: string;
  profiles?: {
    display_name: string;
  };
}

export const useTypingIndicator = (channelId: string | null, currentUserId: string) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!channelId) return;

    let channel: RealtimeChannel;

    // Subscribe to typing status changes
    channel = supabase
      .channel(`typing:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new.is_typing && payload.new.user_id !== currentUserId) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('user_id', payload.new.user_id)
                .single();

              setTypingUsers((prev) => {
                const exists = prev.find((u) => u.user_id === payload.new.user_id);
                if (exists) return prev;
                return [...prev, { user_id: payload.new.user_id, profiles: profile }];
              });
            } else {
              setTypingUsers((prev) =>
                prev.filter((u) => u.user_id !== payload.new.user_id)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setTypingUsers((prev) =>
              prev.filter((u) => u.user_id !== payload.old.user_id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [channelId, currentUserId]);

  const setTyping = async (isTyping: boolean) => {
    if (!channelId) return;

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (isTyping) {
      await supabase.from('typing_status').upsert(
        {
          channel_id: channelId,
          user_id: currentUserId,
          is_typing: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'channel_id,user_id' }
      );

      const timeout = setTimeout(() => {
        supabase.from('typing_status').delete().match({
          channel_id: channelId,
          user_id: currentUserId,
        });
      }, 3000);

      setTypingTimeout(timeout);
    } else {
      await supabase.from('typing_status').delete().match({
        channel_id: channelId,
        user_id: currentUserId,
      });
    }
  };

  return { typingUsers, setTyping };
};
