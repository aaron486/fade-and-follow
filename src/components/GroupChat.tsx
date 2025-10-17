import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

const GroupChat = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .eq('type', 'group');

        if (error) throw error;
        setChannels(data || []);
      } catch (error) {
        console.error('Error fetching channels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [user]);

  useEffect(() => {
    if (!selectedChannel) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (
              display_name,
              avatar_url
            )
          `)
          .eq('channel_id', selectedChannel)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data as any || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedChannel]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || !user) return;

    try {
      await supabase.from('messages').insert({
        channel_id: selectedChannel,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading channels...</p>
        </CardContent>
      </Card>
    );
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No group chats available. Create one to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full">
      {/* Channels Sidebar */}
      <div className="w-64 border-r">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full p-3 text-left rounded-lg transition-colors ${
                  selectedChannel === channel.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <h4 className="font-medium">{channel.name}</h4>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar>
                      <AvatarImage src={message.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        {message.profiles.display_name[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">
                        {message.profiles.display_name}
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a channel to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChat;