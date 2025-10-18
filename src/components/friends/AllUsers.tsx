import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Check, Clock, Users, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bettor_level?: string;
}

interface FriendRequest {
  receiver_id: string;
  status: string;
}

const AllUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [friendships, setFriendships] = useState<Set<string>>(new Set());
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [receivedRequests, setReceivedRequests] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch all user profiles except current user
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bettor_level')
        .neq('user_id', user.id)
        .order('display_name');

      if (profilesError) throw profilesError;

      // Fetch existing friendships
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (friendshipsError) throw friendshipsError;

      const friendIds = new Set(
        friendshipsData?.map(f => 
          f.user1_id === user.id ? f.user2_id : f.user1_id
        ) || []
      );

      // Fetch sent friend requests
      const { data: sentRequestsData, error: sentError } = await supabase
        .from('friend_requests')
        .select('receiver_id, status')
        .eq('sender_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      const sentIds = new Set(
        sentRequestsData?.map(r => r.receiver_id) || []
      );

      // Fetch received friend requests
      const { data: receivedRequestsData, error: receivedError } = await supabase
        .from('friend_requests')
        .select('sender_id, status')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      const receivedIds = new Set(
        receivedRequestsData?.map(r => r.sender_id) || []
      );

      setUsers(profiles || []);
      setFriendships(friendIds);
      setSentRequests(sentIds);
      setReceivedRequests(receivedIds);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending',
        });

      if (error) throw error;

      setSentRequests(prev => new Set([...prev, receiverId]));
      
      toast({
        title: 'Friend Request Sent',
        description: 'Your friend request has been sent!',
      });
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send friend request',
        variant: 'destructive',
      });
    }
  };

  const getButtonState = (userId: string) => {
    if (friendships.has(userId)) {
      return { icon: Check, text: 'Friends', disabled: true, variant: 'outline' as const };
    }
    if (sentRequests.has(userId)) {
      return { icon: Clock, text: 'Pending', disabled: true, variant: 'outline' as const };
    }
    if (receivedRequests.has(userId)) {
      return { icon: Clock, text: 'Respond', disabled: true, variant: 'outline' as const };
    }
    return { icon: UserPlus, text: 'Add Friend', disabled: false, variant: 'default' as const };
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
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
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No users found' : 'No users available'}
              </p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const buttonState = getButtonState(u.user_id);
              const ButtonIcon = buttonState.icon;

              return (
                <div
                  key={u.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback>
                      {u.display_name?.charAt(0) || u.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {u.display_name || u.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{u.username}
                    </p>
                    {u.bettor_level && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {u.bettor_level}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={buttonState.variant}
                    disabled={buttonState.disabled}
                    onClick={() => sendFriendRequest(u.user_id)}
                  >
                    <ButtonIcon className="h-4 w-4 mr-1" />
                    {buttonState.text}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AllUsers;
