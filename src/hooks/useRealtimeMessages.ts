import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  channel_id: string;
  created_at: string;
  image_url?: string;
  message_type: 'text' | 'image';
  profiles?: {
    display_name: string;
    avatar_url?: string;
    username?: string;
  };
}

export const useRealtimeMessages = (channelId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const fetchMessages = async () => {
      setLoading(true);
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (!error && messagesData) {
        // Fetch profiles for all sender IDs
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, username')
          .in('user_id', senderIds);

        // Map profiles to messages
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const messagesWithProfiles = messagesData.map(msg => ({
          ...msg,
          profiles: profilesMap.get(msg.sender_id),
        }));

        setMessages(messagesWithProfiles as Message[]);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch the profile data for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, username')
            .eq('user_id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            profiles: profile || undefined,
          } as Message;

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId]);

  return { messages, loading };
};
