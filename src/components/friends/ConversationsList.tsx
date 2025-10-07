import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Hash, Plus, Search, UserPlus } from 'lucide-react';
import { Conversation } from './ChatLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateGroup: (name: string) => void;
  onStartDirectChat: (friendUserId: string) => Promise<string | null>;
  loading: boolean;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  onCreateGroup,
  onStartDirectChat,
  loading,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchingRef = useRef(false);

  const searchFriends = useCallback(async (query: string, userId: string) => {
    if (!userId || query.length < 2 || searchingRef.current) return;

    try {
      searchingRef.current = true;
      setLoadingFriends(true);

      // Get all friendships
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (friendshipsError) throw friendshipsError;

      const friendIds = friendships?.map(f => 
        f.user1_id === userId ? f.user2_id : f.user1_id
      ) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      // Search friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', friendIds)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(5);

      if (profilesError) throw profilesError;

      setFriends(profiles || []);
    } catch (error) {
      console.error('Error searching friends:', error);
    } finally {
      setLoadingFriends(false);
      searchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!user) {
      setFriends([]);
      return;
    }

    if (friendSearchQuery.length === 0) {
      setFriends([]);
      return;
    }

    if (friendSearchQuery.length < 2) {
      return;
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(() => {
      searchFriends(friendSearchQuery, user.id);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [friendSearchQuery, user?.id, searchFriends]);

  const handleStartChat = async (friendUserId: string) => {
    const channelId = await onStartDirectChat(friendUserId);
    if (channelId) {
      setFriendSearchQuery('');
      setFriends([]);
    }
  };

  const handleCreateGroup = () => {
    if (groupName.trim()) {
      onCreateGroup(groupName.trim());
      setGroupName('');
      setDialogOpen(false);
    }
  };

  const dmConversations = conversations.filter(c => c.type === 'dm');
  const groupConversations = conversations.filter(c => c.type === 'group');

  return (
    <div className="w-60 flex flex-col bg-[#2b2d31]">
      <div className="p-3 border-b border-[#1e1f22] shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-white">Messages</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-2 hover:bg-[#404249] text-gray-300">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Group Channel</DialogTitle>
                <DialogDescription>
                  Create a new group channel to chat with multiple friends
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGroup} disabled={!groupName.trim()}>
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Friend Search */}
        <div className="relative">
          <Input
            placeholder="Find or start a conversation"
            value={friendSearchQuery}
            onChange={(e) => setFriendSearchQuery(e.target.value)}
            className="bg-[#1e1f22] border-none text-sm text-gray-200 placeholder:text-gray-500 h-7"
          />
        </div>

        {/* Friend Search Results */}
        {friendSearchQuery.length > 0 && (
          <div className="mt-2 rounded-md bg-[#1e1f22] max-h-48 overflow-y-auto">
            {loadingFriends ? (
              <div className="p-3 text-sm text-gray-400 text-center">
                Searching...
              </div>
            ) : friends.length === 0 ? (
              <div className="p-3 text-sm text-gray-400 text-center">
                No friends found
              </div>
            ) : (
              friends.map((friend) => (
                <button
                  key={friend.user_id}
                  onClick={() => handleStartChat(friend.user_id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#404249] rounded transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={friend.avatar_url} />
                    <AvatarFallback className="text-xs bg-[#5865f2] text-white">
                      {(friend.display_name || friend.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-sm truncate text-white">
                      {friend.display_name || friend.username}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : (
          <>
            {/* Direct Messages */}
            {dmConversations.length > 0 && (
              <div className="px-2 py-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Direct Messages
                </div>
                {dmConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                      selectedConversation?.id === conversation.id 
                        ? 'bg-[#404249] text-white' 
                        : 'text-gray-300 hover:bg-[#35373c]'
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={conversation.avatar_url} />
                      <AvatarFallback className="text-xs bg-[#5865f2] text-white">
                        {conversation.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm truncate">{conversation.name}</div>
                    </div>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <div className="bg-[#f23f42] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Group Channels */}
            {groupConversations.length > 0 && (
              <div className="px-2 py-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Groups
                </div>
                {groupConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                      selectedConversation?.id === conversation.id 
                        ? 'bg-[#404249] text-white' 
                        : 'text-gray-300 hover:bg-[#35373c]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#5865f2]/20 flex items-center justify-center">
                      <Hash className="w-4 h-4 text-[#5865f2]" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm truncate">{conversation.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {conversations.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-2 text-sm">No conversations yet</p>
                <p className="text-xs text-gray-500">
                  Search for friends to start chatting
                </p>
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
};

export default ConversationsList;
