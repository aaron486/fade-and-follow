import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Check, X, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import ChatLayout from '@/components/friends/ChatLayout';
import BetStoriesBar from '@/components/BetStoriesBar';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  favorite_team?: string;
  state?: string;
  preferred_sportsbook?: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: Profile;
  receiver_profile?: Profile;
}

interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_profile?: Profile;
}

const Friends = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, authLoading]);

  // Load friend requests and friends on mount
  useEffect(() => {
    if (user) {
      loadFriendRequests();
      loadFriends();
    }
  }, [user]);

  const loadFriendRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender_profile:profiles!friend_requests_sender_id_fkey(user_id, username, display_name, avatar_url, favorite_team),
          receiver_profile:profiles!friend_requests_receiver_id_fkey(user_id, username, display_name, avatar_url, favorite_team)
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .eq('status', 'pending');

      if (error) throw error;
      setFriendRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load friend requests",
        variant: "destructive",
      });
    }
  };

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          user1_profile:profiles!friendships_user1_id_fkey(user_id, username, display_name, avatar_url, favorite_team, preferred_sportsbook),
          user2_profile:profiles!friendships_user2_id_fkey(user_id, username, display_name, avatar_url, favorite_team, preferred_sportsbook)
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`);

      if (error) throw error;
      
      // Format friends data to include the friend's profile
      const formattedFriends = (data || []).map(friendship => ({
        ...friendship,
        friend_profile: friendship.user1_id === user?.id 
          ? friendship.user2_profile 
          : friendship.user1_profile
      }));
      
      setFriends(formattedFriends);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      });
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, favorite_team, state, preferred_sportsbook')
        .neq('user_id', user?.id)
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      // Check if friendship already exists
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user1_id.eq.${user?.id},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${user?.id})`)
        .maybeSingle();

      if (existingFriendship) {
        toast({
          title: "Already Connected",
          description: 'You are already friends',
          variant: "destructive",
        });
        return;
      }

      // Auto-accept: Create friend request as accepted
      const { error: requestError } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user?.id,
          receiver_id: receiverId,
          status: 'accepted',
        });

      if (requestError) throw requestError;

      // Create friendship immediately
      const user1Id = (user?.id || '') < receiverId ? user?.id : receiverId;
      const user2Id = (user?.id || '') < receiverId ? receiverId : user?.id;

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
      setSearchResults(prev => prev.filter(profile => profile.user_id !== receiverId));
      loadFriendRequests(); // Refresh requests
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message.includes('duplicate') 
          ? "Friend request already sent to this user"
          : "Failed to add friend",
        variant: "destructive",
      });
    }
  };

  const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: status === 'accepted' ? "Friend request accepted!" : "Friend request declined",
        description: status === 'accepted' 
          ? "You are now friends!" 
          : "Friend request has been declined.",
      });

      loadFriendRequests();
      if (status === 'accepted') {
        loadFriends(); // Refresh friends list if accepted
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to respond to friend request",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const sentRequests = friendRequests.filter(req => req.sender_id === user.id);
  const receivedRequests = friendRequests.filter(req => req.receiver_id === user.id);

  // Full screen chat mode
  if (activeTab === 'chat') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        
        {/* Bet Stories Bar */}
        <div className="border-b border-border">
          <BetStoriesBar />
        </div>

        {/* Chat Layout - Full Screen */}
        <div className="flex-1 overflow-hidden">
          <ChatLayout />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold fade-text-gradient mb-2">Messages & Friends</h1>
          <p className="text-muted-foreground">Chat with friends and manage your betting network</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="discover">
              <Search className="w-4 h-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UserPlus className="w-4 h-4 mr-2" />
              Requests
              {receivedRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {receivedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Friends
              <Badge variant="secondary" className="ml-2">
                {friends.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent
              {sentRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {sentRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Find Friends</CardTitle>
                <CardDescription>Search for friends by username or display name</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search for users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  />
                  <Button onClick={searchUsers} disabled={loading}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {searchResults.map((profile) => (
                    <div key={profile.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback>
                            {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile.display_name || profile.username}</p>
                          <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          {profile.favorite_team && (
                            <p className="text-xs text-muted-foreground">⭐ {profile.favorite_team}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => sendFriendRequest(profile.user_id)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                    </div>
                  ))}
                  
                  {searchTerm && searchResults.length === 0 && !loading && (
                    <p className="text-center text-muted-foreground py-8">
                      No users found matching "{searchTerm}"
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
                <CardDescription>Respond to incoming friend requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.sender_profile?.avatar_url} />
                          <AvatarFallback>
                            {(request.sender_profile?.display_name || request.sender_profile?.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.sender_profile?.display_name || request.sender_profile?.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{request.sender_profile?.username}
                          </p>
                          {request.sender_profile?.favorite_team && (
                            <p className="text-xs text-muted-foreground">
                              ⭐ {request.sender_profile.favorite_team}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => respondToFriendRequest(request.id, 'accepted')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => respondToFriendRequest(request.id, 'declined')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {receivedRequests.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No pending friend requests
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="friends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Friends</CardTitle>
                <CardDescription>Your betting buddies on FADE</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {friends.map((friendship) => (
                    <div key={friendship.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friendship.friend_profile?.avatar_url} />
                          <AvatarFallback>
                            {(friendship.friend_profile?.display_name || friendship.friend_profile?.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {friendship.friend_profile?.display_name || friendship.friend_profile?.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{friendship.friend_profile?.username}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            {friendship.friend_profile?.favorite_team && (
                              <span>⭐ {friendship.friend_profile.favorite_team}</span>
                            )}
                            {friendship.friend_profile?.preferred_sportsbook && (
                              <span>🎯 {friendship.friend_profile.preferred_sportsbook}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">Friend</Badge>
                    </div>
                  ))}
                  
                  {friends.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No friends yet. Start by discovering users above!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sent Requests</CardTitle>
                <CardDescription>Friend requests you've sent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.receiver_profile?.avatar_url} />
                          <AvatarFallback>
                            {(request.receiver_profile?.display_name || request.receiver_profile?.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.receiver_profile?.display_name || request.receiver_profile?.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{request.receiver_profile?.username}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  ))}
                  
                  {sentRequests.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No sent requests
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Friends;