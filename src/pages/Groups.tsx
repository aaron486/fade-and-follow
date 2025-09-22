import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Crown, User, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  favorite_team?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  created_at: string;
  member_count?: number;
  user_role?: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: Profile;
}

interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  friend_profile: Profile;
}

const Groups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadGroups();
    loadFriends();
  }, [user, navigate]);

  const loadGroups = async () => {
    try {
      // First, get all groups where user is a member
      const { data: memberships, error: membershipError } = await supabase
        .from('group_memberships')
        .select('group_id, role')
        .eq('user_id', user?.id);

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      // Then get the group details
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      // Get member counts and format groups
      const groupsWithDetails = await Promise.all((groupsData || []).map(async (group) => {
        const { count } = await supabase
          .from('group_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        const membership = memberships.find(m => m.group_id === group.id);
        
        return {
          ...group,
          user_role: membership?.role || 'member',
          member_count: count || 0
        };
      }));
      
      setGroups(groupsWithDetails);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load groups",
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
          user1_profile:profiles!friendships_user1_id_fkey(user_id, username, display_name, avatar_url, favorite_team),
          user2_profile:profiles!friendships_user2_id_fkey(user_id, username, display_name, avatar_url, favorite_team)
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`);

      if (error) throw error;
      
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

  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_memberships')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (membershipsError) throw membershipsError;

      // Get profiles separately
      const memberIds = memberships?.map(m => m.user_id) || [];
      if (memberIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, favorite_team')
          .in('user_id', memberIds);

        if (profilesError) throw profilesError;

        const membersWithProfiles = memberships?.map(membership => ({
          ...membership,
          profile: profiles?.find(p => p.user_id === membership.user_id) || {
            user_id: membership.user_id,
            username: 'Unknown',
            display_name: 'Unknown User',
            avatar_url: ''
          }
        })) || [];

        setGroupMembers(membersWithProfiles);
      } else {
        setGroupMembers([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load group members",
        variant: "destructive",
      });
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    
    setLoading(true);
    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName,
          description: newGroupDescription,
          creator_id: user?.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: group.id,
          user_id: user?.id,
          role: 'admin'
        });

      if (membershipError) throw membershipError;

      // Add selected friends as members
      if (selectedFriends.length > 0) {
        const memberships = selectedFriends.map(friendId => ({
          group_id: group.id,
          user_id: friendId,
          role: 'member'
        }));

        const { error: friendsError } = await supabase
          .from('group_memberships')
          .insert(memberships);

        if (friendsError) throw friendsError;
      }

      toast({
        title: "Group created!",
        description: `${newGroupName} has been created successfully.`,
      });

      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedFriends([]);
      setShowCreateDialog(false);
      loadGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMembersToGroup = async () => {
    if (!selectedGroup || selectedFriends.length === 0) return;

    setLoading(true);
    try {
      const memberships = selectedFriends.map(friendId => ({
        group_id: selectedGroup.id,
        user_id: friendId,
        role: 'member'
      }));

      const { error } = await supabase
        .from('group_memberships')
        .insert(memberships);

      if (error) throw error;

      toast({
        title: "Members added!",
        description: `Added ${selectedFriends.length} members to ${selectedGroup.name}.`,
      });

      setSelectedFriends([]);
      setShowAddMembersDialog(false);
      loadGroupMembers(selectedGroup.id);
      loadGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (membershipId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Member has been removed from the group.",
      });

      if (selectedGroup) {
        loadGroupMembers(selectedGroup.id);
        loadGroups();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const availableFriends = friends.filter(friendship => 
    !groupMembers.some(member => member.user_id === friendship.friend_profile.user_id)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold fade-text-gradient mb-2">Groups</h1>
              <p className="text-muted-foreground">Create and manage your betting groups</p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>
                    Create a group and invite your friends to join your betting circle.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Group Name</label>
                    <Input
                      placeholder="Enter group name..."
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                      placeholder="Describe your group..."
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Invite Friends</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {friends.map((friendship) => (
                        <div key={friendship.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={friendship.friend_profile.user_id}
                            checked={selectedFriends.includes(friendship.friend_profile.user_id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFriends(prev => [...prev, friendship.friend_profile.user_id]);
                              } else {
                                setSelectedFriends(prev => prev.filter(id => id !== friendship.friend_profile.user_id));
                              }
                            }}
                          />
                          <label htmlFor={friendship.friend_profile.user_id} className="flex items-center gap-2 cursor-pointer">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={friendship.friend_profile.avatar_url} />
                              <AvatarFallback>
                                {(friendship.friend_profile.display_name || friendship.friend_profile.username || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {friendship.friend_profile.display_name || friendship.friend_profile.username}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={createGroup} disabled={loading || !newGroupName.trim()} className="w-full">
                    {loading ? "Creating..." : "Create Group"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="my-groups" className="w-full">
          <TabsList>
            <TabsTrigger value="my-groups">
              <Users className="w-4 h-4 mr-2" />
              My Groups ({groups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups" className="space-y-6">
            {selectedGroup ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedGroup.name}
                        {selectedGroup.user_role === 'admin' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription>{selectedGroup.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedGroup.user_role === 'admin' && (
                        <Dialog open={showAddMembersDialog} onOpenChange={setShowAddMembersDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="w-4 h-4 mr-1" />
                              Add Members
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Members to {selectedGroup.name}</DialogTitle>
                              <DialogDescription>
                                Select friends to add to this group.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {availableFriends.map((friendship) => (
                                  <div key={friendship.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`add-${friendship.friend_profile.user_id}`}
                                      checked={selectedFriends.includes(friendship.friend_profile.user_id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedFriends(prev => [...prev, friendship.friend_profile.user_id]);
                                        } else {
                                          setSelectedFriends(prev => prev.filter(id => id !== friendship.friend_profile.user_id));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`add-${friendship.friend_profile.user_id}`} className="flex items-center gap-2 cursor-pointer">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={friendship.friend_profile.avatar_url} />
                                        <AvatarFallback>
                                          {(friendship.friend_profile.display_name || friendship.friend_profile.username || 'U').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">
                                        {friendship.friend_profile.display_name || friendship.friend_profile.username}
                                      </span>
                                    </label>
                                  </div>
                                ))}
                                
                                {availableFriends.length === 0 && (
                                  <p className="text-center text-muted-foreground py-4">
                                    All your friends are already in this group or you have no friends to add.
                                  </p>
                                )}
                              </div>
                              
                              <Button 
                                onClick={addMembersToGroup} 
                                disabled={loading || selectedFriends.length === 0} 
                                className="w-full"
                              >
                                {loading ? "Adding..." : `Add ${selectedFriends.length} Members`}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                        Back to Groups
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="font-medium">Members ({groupMembers.length})</h3>
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.profile.avatar_url} />
                            <AvatarFallback>
                              {(member.profile.display_name || member.profile.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.profile.display_name || member.profile.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{member.profile.username}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {member.role === 'admin' ? (
                            <Badge variant="secondary">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <User className="w-3 h-3 mr-1" />
                              Member
                            </Badge>
                          )}
                          
                          {selectedGroup.user_role === 'admin' && member.user_id !== user?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeMember(member.id, member.user_id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <Card key={group.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                    setSelectedGroup(group);
                    loadGroupMembers(group.id);
                  }}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{group.name}</span>
                        {group.user_role === 'admin' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription>{group.description || 'No description'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {group.member_count} members
                        </div>
                        <Badge variant={group.user_role === 'admin' ? 'default' : 'secondary'}>
                          {group.user_role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {groups.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No groups yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first group to start organizing your betting activities with friends.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Group
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Groups;