import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Hash, User, MessageSquare } from 'lucide-react';
import { Conversation } from './ChatLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface ChatWindowProps {
  conversation: Conversation | null;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      setMessages([]);
      setChannelId(conversation.channelId);
      loadMessages();
    } else {
      setChannelId(null);
      setMessages([]);
    }
  }, [conversation?.id]);

  // Set up realtime subscription when channelId changes
  useEffect(() => {
    if (!channelId) return;

    console.log('🔌 Setting up realtime for channel:', channelId);
    
    // Clean up previous subscription
    if (channelRef.current) {
      console.log('🧹 Cleaning up previous subscription');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Create new subscription
    const channel = supabase
      .channel(`messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          console.log('📨 New message received');
          
          // Fetch the sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', payload.new.sender_id)
            .maybeSingle();

          const newMessage = {
            ...(payload.new as Message),
            sender_profile: profile || undefined,
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🧹 Cleaning up subscription on unmount');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadMessages = async () => {
    if (!conversation) return;

    try {
      setLoading(true);
      const currentChannelId = conversation.channelId;

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', currentChannelId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch profiles for all senders
      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', senderIds);

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const messagesWithProfiles = messagesData.map(msg => ({
          ...msg,
          sender_profile: profilesMap.get(msg.sender_id),
        }));

        setMessages(messagesWithProfiles);
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !channelId) return;

    try {
      const { error } = await supabase.from('messages').insert({
        channel_id: channelId,
        sender_id: user?.id,
        content: messageInput.trim(),
      });

      if (error) throw error;

      setMessageInput('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Welcome to Messages</p>
          <p className="text-sm">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center gap-3">
        {conversation.type === 'dm' ? (
          <>
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation.avatar_url} />
              <AvatarFallback>
                {conversation.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{conversation.name}</h3>
              <p className="text-sm text-muted-foreground">Active now</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{conversation.name}</h3>
              <p className="text-sm text-muted-foreground">Group channel</p>
            </div>
          </>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.sender_profile?.avatar_url} />
                    <AvatarFallback>
                      {(message.sender_profile?.display_name || message.sender_profile?.username || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {message.sender_profile?.display_name || message.sender_profile?.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div
                      className={`inline-block p-3 rounded-lg max-w-md ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={`Message ${conversation.name}...`}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!messageInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
