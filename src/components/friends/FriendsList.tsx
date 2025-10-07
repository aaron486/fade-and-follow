import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, UserPlus, Users, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bettor_level?: string;
}

interface FriendsListProps {
  onSelectFriend: (friend: Friend) => void;
  selectedFriendId?: string;
}

const FriendsList: React.FC<FriendsListProps> = ({ onSelectFriend, selectedFriendId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchFriends();
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      // Get all friendships where user is either user1 or user2
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (friendshipsError) throw friendshipsError;

      // Get the friend user IDs
      const friendIds = friendships?.map(f => 
        f.user1_id === user.id ? f.user2_id : f.user1_id
      ) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Fetch friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bettor_level')
        .in('user_id', friendIds);

      if (profilesError) throw profilesError;

      setFriends(profiles || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: 'Error',
        description: 'Failed to load friends',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted-foreground/20" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
                <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Friends List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </p>
              {!searchQuery && (
                <p className="text-xs mt-1">Add friends to start chatting!</p>
              )}
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <button
                key={friend.user_id}
                onClick={() => onSelectFriend(friend)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left ${
                  selectedFriendId === friend.user_id ? 'bg-accent' : ''
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={friend.avatar_url} />
                  <AvatarFallback>
                    {friend.display_name?.charAt(0) || friend.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {friend.display_name || friend.username}
                  </p>
                  {friend.bettor_level && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {friend.bettor_level}
                    </Badge>
                  )}
                </div>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FriendsList;
