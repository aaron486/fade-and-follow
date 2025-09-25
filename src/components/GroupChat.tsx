import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, Send, Plus, Settings, Users, Volume2, VolumeX } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface ChatMessage {
  id: string;
  user: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  message: string;
  timestamp: Date;
}

interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  unreadCount: number;
  lastMessage?: ChatMessage;
}

const GroupChat = () => {
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Mock channels data
  const channels: ChatChannel[] = [
    {
      id: 'general',
      name: 'general',
      description: 'General discussion',
      unreadCount: 0,
      lastMessage: {
        id: '1',
        user: { username: 'johndoe', displayName: 'John Doe' },
        message: 'Anyone watching the game tonight?',
        timestamp: new Date(Date.now() - 1000 * 60 * 5)
      }
    },
    {
      id: 'picks',
      name: 'daily-picks',
      description: 'Share your daily picks',
      unreadCount: 3,
      lastMessage: {
        id: '2',
        user: { username: 'sportsmike', displayName: 'Sports Mike' },
        message: 'Lakers -5.5 is free money tonight',
        timestamp: new Date(Date.now() - 1000 * 60 * 15)
      }
    },
    {
      id: 'nba',
      name: 'nba-talk',
      description: 'NBA discussion',
      unreadCount: 1,
      lastMessage: {
        id: '3',
        user: { username: 'hoopsfan', displayName: 'Hoops Fan' },
        message: 'Curry is out tonight, Warriors spread looking juicy',
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      }
    }
  ];

  // Mock messages for selected channel
  const messages: ChatMessage[] = [
    {
      id: '1',
      user: { username: 'johndoe', displayName: 'John Doe' },
      message: 'Anyone watching the game tonight?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: '2',
      user: { username: 'sportsmike', displayName: 'Sports Mike' },
      message: 'Yeah! Lakers vs Warriors should be fire 🔥',
      timestamp: new Date(Date.now() - 1000 * 60 * 25)
    },
    {
      id: '3',
      user: { username: 'alexluck', displayName: 'Alex Lucky' },
      message: 'I got Lakers -5.5, what do you guys think?',
      timestamp: new Date(Date.now() - 1000 * 60 * 20)
    },
    {
      id: '4',
      user: { username: 'johndoe', displayName: 'John Doe' },
      message: 'That spread is solid, Lakers have been covering at home',
      timestamp: new Date(Date.now() - 1000 * 60 * 15)
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // This will be handled by your chat system later
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-80 h-[600px] flex flex-col">
      <Card className="flex-1 flex flex-col">
        {/* Chat Header */}
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="w-5 h-5" />
              {channels.find(c => c.id === selectedChannel)?.name}
            </CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {channels.find(c => c.id === selectedChannel)?.description}
          </p>
        </CardHeader>

        {/* Channel List */}
        <div className="border-b p-3">
          <div className="space-y-1">
            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant={selectedChannel === channel.id ? "secondary" : "ghost"}
                className="w-full justify-between h-auto p-2"
                onClick={() => setSelectedChannel(channel.id)}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm">{channel.name}</span>
                </div>
                {channel.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs h-5 min-w-5">
                    {channel.unreadCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Join Channel
          </Button>
        </div>

        {/* Messages */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-3">
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isFirstFromUser = index === 0 || messages[index - 1].user.username !== message.user.username;
                
                return (
                  <div key={message.id} className={`flex gap-3 ${!isFirstFromUser ? 'pl-12' : ''}`}>
                    {isFirstFromUser && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {message.user.displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      {isFirstFromUser && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.user.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistance(message.timestamp, new Date(), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                      <p className="text-sm break-words">{message.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Input
              placeholder={`Message #${channels.find(c => c.id === selectedChannel)?.name}`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Online Users */}
      <Card className="mt-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Online (4)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {['johndoe', 'sportsmike', 'alexluck', 'hoopsfan'].map((username) => (
              <div key={username} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">@{username}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupChat;