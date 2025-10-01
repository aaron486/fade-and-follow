import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, X, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

const FriendRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchFriendRequests();
  }, [user]);

  const fetchFriendRequests = async () => {
    if (!user) return;

    try {
      // First get the requests
      const { data: requests, error: requestsError } = await supabase
        .from('friend_requests')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Then fetch sender profiles
      if (requests && requests.length > 0) {
        const senderIds = requests.map(r => r.sender_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', senderIds);

        if (profilesError) throw profilesError;

        // Combine data
        const requestsWithProfiles = requests.map(request => ({
          ...request,
          sender_profile: profiles?.find(p => p.user_id === request.sender_id) || {
            username: 'Unknown',
            display_name: 'Unknown User',
          }
        }));

        setIncomingRequests(requestsWithProfiles as any);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Friend request accepted',
        description: 'You are now friends!',
      });

      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Friend request rejected',
      });

      fetchFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject friend request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {incomingRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No pending friend requests</p>
          </div>
        ) : (
          incomingRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.sender_profile?.avatar_url} />
                <AvatarFallback>
                  {request.sender_profile?.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {request.sender_profile?.display_name || request.sender_profile?.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAccept(request.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default FriendRequests;
