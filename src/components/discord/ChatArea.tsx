import React, { useState, useEffect, useRef } from 'react';
import { Hash, Plus, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

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

interface ChatAreaProps {
  channelName: string;
  channelId: string;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  channelName,
  channelId,
  messages,
  currentUserId,
  onSendMessage
}) => {
  const [messageContent, setMessageContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageContent.trim()) return;
    onSendMessage(messageContent);
    setMessageContent('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338]">
      {/* Channel Header */}
      <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] shadow-sm">
        <Hash className="w-6 h-6 text-[#80848e] mr-2" />
        <h3 className="font-semibold text-white">{channelName}</h3>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-[#949ba4] mt-8">
              <Hash className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-semibold">Welcome to #{channelName}</p>
              <p className="text-sm">This is the start of your conversation.</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
              const showTimestamp = showAvatar;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 hover:bg-[#2e3035] px-4 py-0.5 -mx-4 ${
                    showAvatar ? 'mt-4' : ''
                  }`}
                >
                  {showAvatar ? (
                    <Avatar className="w-10 h-10 mt-0.5">
                      <AvatarImage src={message.profiles?.avatar_url} />
                      <AvatarFallback className="bg-[#5865f2] text-white">
                        {(message.profiles?.display_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-10 flex items-center justify-center">
                      <span className="text-xs text-[#949ba4] opacity-0 group-hover:opacity-100">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-medium text-white">
                          {message.profiles?.display_name || 'Unknown'}
                        </span>
                        <span className="text-xs text-[#949ba4]">
                          {format(new Date(message.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    )}
                    <p className="text-[#dbdee1] text-sm break-words">{message.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4">
        <div className="bg-[#383a40] rounded-lg flex items-center gap-2 px-4 py-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#b5bac1] hover:text-white"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Input
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message #${channelName}`}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-[#6d6f78]"
          />
          <Button
            onClick={handleSend}
            disabled={!messageContent.trim()}
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#b5bac1] hover:text-white disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
