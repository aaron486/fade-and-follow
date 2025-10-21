import React, { useState, useEffect, useRef } from 'react';
import { Hash, Plus, Send, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';

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
  currentUserId: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  channelName,
  channelId,
  currentUserId,
}) => {
  const [messageContent, setMessageContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { messages, loading } = useRealtimeMessages(channelId);
  const { typingUsers, setTyping } = useTypingIndicator(channelId, currentUserId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageContent.trim()) return;

    const { error } = await supabase.from('messages').insert({
      channel_id: channelId,
      sender_id: currentUserId,
      content: messageContent,
      message_type: 'text',
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } else {
      setMessageContent('');
      setTyping(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('bet-screenshots')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('bet-screenshots')
      .getPublicUrl(fileName);

    const { error: messageError } = await supabase.from('messages').insert({
      channel_id: channelId,
      sender_id: currentUserId,
      content: 'Image',
      message_type: 'image',
      image_url: publicUrl,
    });

    if (messageError) {
      toast({
        title: 'Error',
        description: 'Failed to send image',
        variant: 'destructive',
      });
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageContent(e.target.value);
    setTyping(e.target.value.length > 0);
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
          {loading ? (
            <div className="text-center text-[#949ba4] mt-8">Loading messages...</div>
          ) : messages.length === 0 ? (
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
                    {message.message_type === 'image' && message.image_url ? (
                      <img
                        src={message.image_url}
                        alt="Uploaded image"
                        className="max-w-md rounded-lg mt-1 cursor-pointer hover:opacity-90"
                        onClick={() => window.open(message.image_url, '_blank')}
                      />
                    ) : (
                      <p className="text-[#dbdee1] text-sm break-words">{message.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {typingUsers.length > 0 && (
            <div className="text-sm text-[#949ba4] italic pl-4">
              {typingUsers.map((u) => u.profiles?.display_name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4">
        <div className="bg-[#383a40] rounded-lg flex items-center gap-2 px-4 py-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-6 w-6 text-[#b5bac1] hover:text-white"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Input
            value={messageContent}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={`Message #${channelName}`}
            disabled={uploading}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-[#6d6f78]"
          />
          <Button
            onClick={handleSend}
            disabled={!messageContent.trim() || uploading}
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
