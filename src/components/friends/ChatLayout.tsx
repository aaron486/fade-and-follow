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
      // Verify authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      console.log('Creating direct chat:', {
        currentUserId: session.user.id,
        friendUserId,
        sessionExists: !!session
      });

      // Verify friendship exists
      const { data: friendship, error: friendshipError } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${friendUserId}),and(user1_id.eq.${friendUserId},user2_id.eq.${session.user.id})`)
        .maybeSingle();

      if (friendshipError) {
        console.error('Error checking friendship:', friendshipError);
        throw friendshipError;
      }

      if (!friendship) {
        toast({
          title: "Not Friends",
          description: "You can only chat with your friends. Send them a friend request first!",
          variant: "destructive",
        });
        return null;
      }

      // Check if direct chat already exists
      const { data: existingChats } = await supabase
        .from('channel_members')
        .select('channel_id, channels!inner(type)')
        .eq('user_id', session.user.id);

      if (existingChats) {
        for (const chat of existingChats) {
          if (chat.channels?.type === 'direct') {
            // Check if this direct chat includes the friend
            const { data: members } = await supabase
              .from('channel_members')
              .select('user_id')
              .eq('channel_id', chat.channel_id);

            const memberIds = members?.map(m => m.user_id) || [];
            if (memberIds.includes(friendUserId) && memberIds.includes(session.user.id)) {
              // Direct chat already exists, select it
              console.log('Found existing direct chat:', chat.channel_id);
              const existingConv = conversations.find(c => c.id === chat.channel_id);
              if (existingConv) {
                setSelectedConversation(existingConv);
              }
              return chat.channel_id;
            }
          }
        }
      }

      // Create new direct chat using session user ID
      console.log('Creating new channel with user:', session.user.id);
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          name: `DM-${session.user.id}-${friendUserId}`,
          type: 'direct',
          created_by: session.user.id,
        })
        .select()
        .single();

      if (channelError) {
        console.error('Channel creation error:', channelError);
        throw channelError;
      }

      console.log('Channel created successfully:', channel.id);

      // Add creator as admin first, then add the friend
      console.log('Adding creator as admin...');
      const { error: creatorError } = await supabase
        .from('channel_members')
        .insert({ 
          channel_id: channel.id, 
          user_id: session.user.id, 
          role: 'admin' 
        });

      if (creatorError) {
        console.error('Creator member error:', creatorError);
        throw creatorError;
      }

      console.log('Creator added successfully');

      // Now add the friend as a member
      const { error: friendError } = await supabase
        .from('channel_members')
        .insert({ 
          channel_id: channel.id, 
          user_id: friendUserId, 
          role: 'member' 
        });

      if (friendError) {
        console.error('Friend member error:', friendError);
        throw friendError;
      }

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
