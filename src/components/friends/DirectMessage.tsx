import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface DirectMessageProps {
  friend: Friend;
}

const DirectMessage: React.FC<DirectMessageProps> = ({ friend }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [channelId, setChannelId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !friend) return;
    initializeChannel();
  }, [user, friend]);

  useEffect(() => {
    if (!channelId) return;
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`dm-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const initializeChannel = async () => {
    if (!user) return;

    try {
      // Find existing DM channel between these users
      // For DM channels, we need to check both user orders
      const { data: existingChannel } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', user.id)
        .single();

      // This is simplified - in production you'd need to check for channels
      // with exactly 2 members (this user and the friend)
      // For now, create a new channel for each conversation
      
      const { data: newChannel, error: channelError } = await supabase
        .from('channels')
        .insert([
          {
            name: `DM-${user.id}-${friend.id}`,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (channelError) throw channelError;

      // Add both users as members
      const { error: memberError } = await supabase
        .from('channel_members')
        .insert([
          { channel_id: newChannel.id, user_id: user.id, role: 'admin' },
          { channel_id: newChannel.id, user_id: friend.id, role: 'member' },
        ]);

      if (memberError) throw memberError;

      setChannelId(newChannel.id);
    } catch (error) {
      console.error('Error initializing channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async () => {
    if (!channelId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !channelId || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            channel_id: channelId,
            sender_id: user.id,
            content: newMessage.trim(),
          },
        ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend.avatar_url} />
          <AvatarFallback>
            {friend.display_name?.charAt(0) || friend.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{friend.display_name || friend.username}</p>
          <p className="text-xs text-muted-foreground">@{friend.username}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={sending}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
