import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ConversationsList from './ConversationsList';
import ChatWindow from './ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string;
  avatar_url?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  otherUserId?: string; // For DMs
}

const ChatLayout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoading(true);

      // Load friendships (DM conversations)
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          *,
          user1_profile:profiles!friendships_user1_id_fkey(user_id, username, display_name, avatar_url),
          user2_profile:profiles!friendships_user2_id_fkey(user_id, username, display_name, avatar_url)
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`);

      if (friendshipsError) throw friendshipsError;

      // Load group channels
      const { data: channelMemberships, error: channelsError } = await supabase
        .from('channel_members')
        .select(`
          channel_id,
          channels (
            id,
            name
          )
        `)
        .eq('user_id', user?.id);

      if (channelsError) throw channelsError;

      // Format friendships as DM conversations
      const dmConversations: Conversation[] = (friendships || []).map(friendship => {
        const friendProfile = friendship.user1_id === user?.id 
          ? friendship.user2_profile 
          : friendship.user1_profile;
        
        return {
          id: `dm-${friendship.id}`,
          type: 'dm' as const,
          name: friendProfile?.display_name || friendProfile?.username || 'Unknown User',
          avatar_url: friendProfile?.avatar_url,
          otherUserId: friendProfile?.user_id,
        };
      });

      // Format channels as group conversations
      const groupConversations: Conversation[] = (channelMemberships || [])
        .filter(membership => membership.channels)
        .map(membership => ({
          id: `group-${membership.channels.id}`,
          type: 'group' as const,
          name: membership.channels.name,
        }));

      setConversations([...dmConversations, ...groupConversations]);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroupChannel = async (name: string) => {
    try {
      // Create the channel
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          name,
          created_by: user?.id,
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('channel_members')
        .insert({
          channel_id: channel.id,
          user_id: user?.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: "Group channel created successfully",
      });

      loadConversations();
    } catch (error: any) {
      console.error('Error creating channel:', error);
      toast({
        title: "Error",
        description: "Failed to create group channel",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden bg-card">
      <ConversationsList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        onCreateGroup={createGroupChannel}
        loading={loading}
      />
      <ChatWindow
        conversation={selectedConversation}
        onClose={() => setSelectedConversation(null)}
      />
    </div>
  );
};

export default ChatLayout;
