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
    <div className="w-80 border-r flex flex-col bg-muted/30">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Friends</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                New Group
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends to chat..."
            value={friendSearchQuery}
            onChange={(e) => setFriendSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Friend Search Results */}
        {friendSearchQuery.length > 0 && (
          <div className="mt-2 border rounded-lg bg-card max-h-48 overflow-y-auto">
            {loadingFriends ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            ) : friends.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No friends found
              </div>
            ) : (
              friends.map((friend) => (
                <button
                  key={friend.user_id}
                  onClick={() => handleStartChat(friend.user_id)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-accent transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={friend.avatar_url} />
                    <AvatarFallback>
                      {(friend.display_name || friend.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-sm truncate">
                      {friend.display_name || friend.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{friend.username}
                    </div>
                  </div>
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : (
          <>
            {/* Direct Messages */}
            {dmConversations.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  Direct Messages
                </div>
                {dmConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-accent ${
                      selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                    }`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversation.avatar_url} />
                      <AvatarFallback>
                        {conversation.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">{conversation.name}</div>
                      {conversation.lastMessage && (
                        <div className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </div>
                      )}
                    </div>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <div className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Group Channels */}
            {groupConversations.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  Group Channels
                </div>
                {groupConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-accent ${
                      selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">{conversation.name}</div>
                      {conversation.lastMessage && (
                        <div className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {conversations.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="mb-2">No conversations yet</p>
                <p className="text-sm">
                  Add friends to start chatting or create a group channel
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
