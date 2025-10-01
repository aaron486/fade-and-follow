import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserSearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bettor_level?: string;
}

const AddFriend = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bettor_level, user_id')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    setSending(receiverId);
    try {
      // Check if friendship already exists
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingFriendship) {
        toast({
          title: 'Already Connected',
          description: 'You are already friends',
          variant: 'destructive',
        });
        setSending(null);
        return;
      }

      // Auto-accept: Create friend request as accepted
      const { error: requestError } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'accepted',
        });

      if (requestError) throw requestError;

      // Create friendship immediately
      const user1Id = user.id < receiverId ? user.id : receiverId;
      const user2Id = user.id < receiverId ? receiverId : user.id;

      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
        });

      if (friendshipError) throw friendshipError;

      toast({
        title: 'Friend Added!',
        description: 'You can now start chatting',
      });

      setSearchResults(prev => prev.filter(u => u.id !== receiverId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send friend request',
        variant: 'destructive',
      });
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <Label htmlFor="search">Search for friends</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="search"
            placeholder="Enter username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
          />
          <Button onClick={searchUsers} disabled={searching}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {searchResults.map((result) => (
          <div
            key={result.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={result.avatar_url} />
              <AvatarFallback>
                {result.display_name?.charAt(0) || result.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {result.display_name || result.username}
              </p>
              <p className="text-xs text-muted-foreground">@{result.username}</p>
            </div>
            <Button
              size="sm"
              onClick={() => sendFriendRequest(result.id)}
              disabled={sending === result.id}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddFriend;
