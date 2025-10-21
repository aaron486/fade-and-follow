import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ServerList } from './discord/ServerList';
import { ChannelList } from './discord/ChannelList';
import { ChatArea } from './discord/ChatArea';
import { MemberList } from './discord/MemberList';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Server {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  user_role?: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'group' | 'direct';
  created_by: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile: {
    display_name: string;
    avatar_url?: string;
    username: string;
  };
}

const DiscordChat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
  
  // Refs to track subscriptions for proper cleanup
  const messageChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  
  // Dialog states
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerDescription, setNewServerDescription] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');

  // Load servers
  useEffect(() => {
    loadServers();
  }, [user]);

  // Load channels when server selected
  useEffect(() => {
    if (selectedServerId) {
      loadChannels(selectedServerId);
      loadMembers(selectedServerId);
      subscribeToPresence(selectedServerId);
    }
  }, [selectedServerId]);

  // Load messages when channel selected
  useEffect(() => {
    if (selectedChannelId) {
      loadMessages(selectedChannelId);
      subscribeToMessages(selectedChannelId);
    }
  }, [selectedChannelId]);

  const loadServers = async () => {
    try {
      const { data: memberships } = await supabase
        .from('group_memberships')
        .select('group_id, role')
        .eq('user_id', user?.id);

      if (!memberships?.length) {
        setServers([]);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);
      const { data: groups } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      const serversWithRole = groups?.map(group => ({
        ...group,
        user_role: memberships.find(m => m.group_id === group.id)?.role
      })) || [];

      setServers(serversWithRole);
      
      if (serversWithRole.length > 0 && !selectedServerId) {
        setSelectedServerId(serversWithRole[0].id);
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    }
  };

  const loadChannels = async (serverId: string) => {
    try {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('created_by', serverId)
        .order('created_at');

      setChannels(data || []);
      
      if (data && data.length > 0) {
        setSelectedChannelId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at');

      if (!messagesData) {
        setMessages([]);
        return;
      }

      // Fetch profiles separately
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', senderIds);

      const messagesWithProfiles = messagesData.map(msg => ({
        ...msg,
        profiles: profilesData?.find(p => p.user_id === msg.sender_id) || {
          display_name: 'Unknown',
          avatar_url: ''
        }
      }));

      setMessages(messagesWithProfiles as any);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadMembers = async (serverId: string) => {
    try {
      const { data: memberships } = await supabase
        .from('group_memberships')
        .select('*')
        .eq('group_id', serverId);

      const memberIds = memberships?.map(m => m.user_id) || [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', memberIds);

      const membersWithProfiles = memberships?.map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id) || {
          user_id: m.user_id,
          username: 'Unknown',
          display_name: 'Unknown',
          avatar_url: ''
        }
      })) || [];

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const subscribeToMessages = (channelId: string) => {
    // Clean up existing subscription first
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
    }
    
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', payload.new.sender_id)
            .single();

          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            sender_id: payload.new.sender_id,
            created_at: payload.new.created_at,
            profiles: profile || { display_name: 'Unknown', avatar_url: '' }
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    messageChannelRef.current = channel;

    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
    };
  };

  const subscribeToPresence = (serverId: string) => {
    // Clean up existing presence subscription
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
    }
    
    const channel = supabase.channel(`server:${serverId}`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = Object.keys(state);
        setOnlineMembers(online);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineMembers(prev => [...prev, key]);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineMembers(prev => prev.filter(id => id !== key));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user?.id, online_at: new Date().toISOString() });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  };

  const createServer = async () => {
    if (!newServerName.trim()) return;

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newServerName,
          description: newServerDescription,
          creator_id: user?.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      await supabase.from('group_memberships').insert({
        group_id: group.id,
        user_id: user?.id,
        role: 'admin'
      });

      // Create default general channel
      await supabase.from('channels').insert({
        name: 'general',
        type: 'group',
        created_by: group.id
      });

      toast({ title: 'Server created!', description: `${newServerName} is ready.` });
      
      setNewServerName('');
      setNewServerDescription('');
      setShowCreateServer(false);
      loadServers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !selectedServerId) return;

    try {
      await supabase.from('channels').insert({
        name: newChannelName,
        type: 'group',
        created_by: selectedServerId
      });

      toast({ title: 'Channel created!', description: `#${newChannelName} is ready.` });
      
      setNewChannelName('');
      setShowCreateChannel(false);
      loadChannels(selectedServerId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const sendMessage = async (content: string) => {
    if (!selectedChannelId || !user) return;

    try {
      await supabase.from('messages').insert({
        channel_id: selectedChannelId,
        sender_id: user.id,
        content
      });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };

  const selectedServer = servers.find(s => s.id === selectedServerId);
  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const isAdmin = selectedServer?.user_role === 'admin';

  return (
    <>
      <div className="flex h-screen bg-[#313338]">
        <ServerList
          servers={servers}
          selectedServerId={selectedServerId}
          onSelectServer={setSelectedServerId}
          onCreateServer={() => setShowCreateServer(true)}
        />
        
        {selectedServer && (
          <ChannelList
            serverName={selectedServer.name}
            channels={channels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
            onCreateChannel={() => setShowCreateChannel(true)}
            isAdmin={isAdmin}
          />
        )}
        
        {selectedChannel && (
          <ChatArea
            channelName={selectedChannel.name}
            channelId={selectedChannel.id}
            currentUserId={user?.id || ''}
          />
        )}
        
        {selectedServer && (
          <MemberList 
            members={members} 
            channelId={selectedChannel?.id || ''} 
            currentUserId={user?.id || ''} 
          />
        )}
      </div>

      {/* Create Server Dialog */}
      <Dialog open={showCreateServer} onOpenChange={setShowCreateServer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Server</DialogTitle>
            <DialogDescription>Set up your new betting community</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Server Name</Label>
              <Input
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                placeholder="My Betting Server"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newServerDescription}
                onChange={(e) => setNewServerDescription(e.target.value)}
                placeholder="Describe your server..."
              />
            </div>
            <Button onClick={createServer} disabled={!newServerName.trim()} className="w-full">
              Create Server
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
            <DialogDescription>Add a new channel to {selectedServer?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Channel Name</Label>
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="general"
              />
            </div>
            <Button onClick={createChannel} disabled={!newChannelName.trim()} className="w-full">
              Create Channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DiscordChat;
