import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ConversationsList from './ConversationsList';
import ChatWindow from './ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  channelId: string;
  type: 'dm' | 'group';
  name: string;
  avatar_url?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  otherUserId?: string;
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
    
    // Clean up on unmount
    return () => {
      setConversations([]);
      setSelectedConversation(null);
    };
  }, [user?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);

      // Load all channels where user is a member
      const { data: channelMemberships, error: channelsError } = await supabase
        .from('channel_members')
        .select(`
          channel_id,
          channels (
            id,
            name,
            type,
            created_at
          )
        `)
        .eq('user_id', user?.id);

      if (channelsError) throw channelsError;

      const allConversations: Conversation[] = [];

      // Process each channel
      for (const membership of channelMemberships || []) {
        if (!membership.channels) continue;

        const channel = membership.channels;

        if (channel.type === 'direct') {
          // For direct chats, get the other user's info
          const { data: members } = await supabase
            .from('channel_members')
            .select('user_id')
            .eq('channel_id', channel.id)
            .neq('user_id', user?.id);

          if (members && members.length > 0) {
            const otherUserId = members[0].user_id;
            
            // Fetch the other user's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, username, display_name, avatar_url')
              .eq('user_id', otherUserId)
              .single();

            if (profile) {
              allConversations.push({
                id: `dm-${channel.id}`,
                channelId: channel.id,
                type: 'dm',
                name: profile.display_name || profile.username || 'Unknown User',
                avatar_url: profile.avatar_url,
                otherUserId: profile.user_id,
              });
            }
          }
        } else {
          // For group chats
          allConversations.push({
            id: `group-${channel.id}`,
            channelId: channel.id,
            type: 'group',
            name: channel.name,
          });
        }
      }

      setConversations(allConversations);
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
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          name,
          type: 'group',
          created_by: user?.id,
        })
        .select()
        .single();

      if (channelError) throw channelError;

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

  const createDirectChat = async (friendUserId: string) => {
    try {
      // Check if direct chat already exists
      const { data: existingChats } = await supabase
        .from('channel_members')
        .select('channel_id, channels!inner(type)')
        .eq('user_id', user?.id);

      if (existingChats) {
        for (const chat of existingChats) {
          if (chat.channels?.type === 'direct') {
            // Check if this direct chat includes the friend
            const { data: members } = await supabase
              .from('channel_members')
              .select('user_id')
              .eq('channel_id', chat.channel_id);

            const memberIds = members?.map(m => m.user_id) || [];
            if (memberIds.includes(friendUserId) && memberIds.includes(user?.id)) {
              // Direct chat already exists, just return its ID
              return chat.channel_id;
            }
          }
        }
      }

      // Create new direct chat
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          name: `DM-${user?.id}-${friendUserId}`,
          type: 'direct',
          created_by: user?.id,
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Add both users as members
      const { error: membersError } = await supabase
        .from('channel_members')
        .insert([
          { channel_id: channel.id, user_id: user?.id, role: 'member' },
          { channel_id: channel.id, user_id: friendUserId, role: 'member' },
        ]);

      if (membersError) throw membersError;

      await loadConversations();
      return channel.id;
    } catch (error: any) {
      console.error('Error creating direct chat:', error);
      toast({
        title: "Error",
        description: "Failed to create direct chat",
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden bg-card">
      <ConversationsList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        onCreateGroup={createGroupChannel}
        onStartDirectChat={createDirectChat}
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
