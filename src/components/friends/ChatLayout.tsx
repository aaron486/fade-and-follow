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

interface ChatLayoutProps {
  fullscreen?: boolean;
}

const ChatLayout = ({ fullscreen = false }: ChatLayoutProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = React.useRef(false);

  useEffect(() => {
    // Only load if we have a user and aren't already loading
    if (user && !loadingRef.current) {
      loadConversations();
    }
    
    // Clean up on unmount
    return () => {
      setConversations([]);
      setSelectedConversation(null);
      loadingRef.current = false;
    };
  }, [user?.id]);

  const loadConversations = async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current || !user) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);

      // Load all channels where user is a member - simplified query
      const { data: channelMemberships, error: channelsError } = await supabase
        .from('channel_members')
        .select('channel_id, channels!inner(id, name, type)')
        .eq('user_id', user.id);

      if (channelsError) {
        console.error('Error loading channel memberships:', channelsError);
        throw channelsError;
      }

      if (!channelMemberships || channelMemberships.length === 0) {
        setConversations([]);
        return;
      }

      const allConversations: Conversation[] = [];
      
      // Get all channel IDs
      const channelIds = channelMemberships.map(m => m.channel_id);
      
      // Get all other members in ONE query
      const { data: allMembers } = await supabase
        .from('channel_members')
        .select('channel_id, user_id')
        .in('channel_id', channelIds)
        .neq('user_id', user.id);

      // Get all unique user IDs for profiles in ONE query
      const userIds = [...new Set(allMembers?.map(m => m.user_id) || [])];
      const { data: profiles } = userIds.length > 0 ? await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds) : { data: [] };

      interface ProfileData {
        user_id: string;
        username: string;
        display_name: string;
        avatar_url?: string;
      }

      const profilesMap = new Map<string, ProfileData>(
        (profiles as ProfileData[] || []).map(p => [p.user_id, p])
      );

      // Process each channel
      for (const membership of channelMemberships) {
        const channel = membership.channels;
        if (!channel) continue;

        if (channel.type === 'direct') {
          // Find the other user in this channel
          const otherMember = allMembers?.find(m => m.channel_id === channel.id);
          if (otherMember) {
            const profile = profilesMap.get(otherMember.user_id);
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
      loadingRef.current = false;
    }
  };

  const createGroupChannel = async (name: string) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          name,
          type: 'group',
          created_by: user.id,
        })
        .select()
        .single();

      if (channelError) {
        console.error('Channel creation error:', channelError);
        throw channelError;
      }

      const { error: memberError } = await supabase
        .from('channel_members')
        .insert({
          channel_id: channel.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) {
        console.error('Member addition error:', memberError);
        throw memberError;
      }

      toast({
        title: "Success",
        description: "Group channel created successfully",
      });

      // Reset loading flag before reload
      loadingRef.current = false;
      await loadConversations();
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
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to start chatting",
          variant: "destructive",
        });
        return null;
      }

      // Check if DM already exists between these two users
      const { data: myChannels } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', user.id);

      if (myChannels && myChannels.length > 0) {
        for (const { channel_id } of myChannels) {
          const { data: channelData } = await supabase
            .from('channels')
            .select('type')
            .eq('id', channel_id)
            .eq('type', 'direct')
            .single();

          if (channelData) {
            const { data: members } = await supabase
              .from('channel_members')
              .select('user_id')
              .eq('channel_id', channel_id);

            const memberIds = members?.map(m => m.user_id) || [];
            if (memberIds.length === 2 && memberIds.includes(friendUserId)) {
              // Found existing DM
              loadingRef.current = false;
              await loadConversations();
              const existingConv = conversations.find(c => c.channelId === channel_id);
              if (existingConv) {
                setSelectedConversation(existingConv);
              }
              return channel_id;
            }
          }
        }
      }

      // Create new DM channel
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          name: 'DM',
          type: 'direct',
          created_by: user.id,
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Add both users to channel_members in one operation
      const { error: membersError } = await supabase
        .from('channel_members')
        .insert([
          { channel_id: channel.id, user_id: user.id, role: 'admin' },
          { channel_id: channel.id, user_id: friendUserId, role: 'member' }
        ]);

      if (membersError) throw membersError;

      // Reset loading flag before reload
      loadingRef.current = false;
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
    <div className={fullscreen 
      ? "flex h-[calc(100vh-10rem)] overflow-hidden bg-card" 
      : "flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden bg-card"
    }>
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
