import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  favorite_team?: string;
}

const FindFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, favorite_team')
        .neq('user_id', user?.id)
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: "Search Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          title: "Already Connected",
          description: 'You are already friends',
          variant: "destructive",
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
        title: "Friend Added!",
        description: "You can now start chatting",
      });

      // Remove from search results
      setSearchResults(prev => prev.filter(p => p.user_id !== receiverId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add friend",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Find Friends</CardTitle>
        <CardDescription className="text-sm">Search and add betting buddies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Search username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            className="text-sm"
          />
          <Button onClick={searchUsers} disabled={loading} size="sm">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((profile) => (
              <div
                key={profile.user_id}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {profile.display_name || profile.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{profile.username}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => sendFriendRequest(profile.user_id)}
                  disabled={sending === profile.user_id}
                  className="shrink-0"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchTerm && searchResults.length === 0 && !loading && (
          <p className="text-center text-muted-foreground text-sm py-4">
            No users found
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FindFriends;
