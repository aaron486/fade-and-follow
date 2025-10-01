import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Edit, 
  Trophy, 
  TrendingUp, 
  MapPin, 
  Heart,
  Users,
  UserPlus,
  Camera,
  Crown,
  Target,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface UserProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  favorite_team: string | null;
  state: string | null;
  preferred_sportsbook: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total_bets: number;
  wins: number;
  losses: number;
  pushes: number;
  units_won: number;
  current_streak: number;
}

interface FriendStats {
  friend_count: number;
  friend_percentile: number;
  world_percentile: number;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [friendStats, setFriendStats] = useState<FriendStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    favorite_team: '',
    state: '',
    preferred_sportsbook: ''
  });

  const isOwnProfile = !userId || userId === user?.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, authLoading, navigate]);

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfile();
      loadUserStats();
      loadFriendStats();
    }
  }, [user, userId]);

  const loadProfile = async () => {
    try {
      const targetUserId = userId || user?.id;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) throw error;
      
      setProfile(data);
      
      // Initialize form data if it's own profile
      if (isOwnProfile && data) {
        setFormData({
          display_name: data.display_name || '',
          username: data.username || '',
          favorite_team: data.favorite_team || '',
          state: data.state || '',
          preferred_sportsbook: data.preferred_sportsbook || ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const targetUserId = userId || user?.id;
      
      const { data, error } = await supabase
        .from('user_records')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Calculate total_bets from wins + losses + pushes
        const total = (data.wins || 0) + (data.losses || 0) + (data.pushes || 0);
        setUserStats({
          total_bets: total,
          wins: data.wins || 0,
          losses: data.losses || 0,
          pushes: data.pushes || 0,
          units_won: data.units_won || 0,
          current_streak: data.current_streak || 0
        });
      } else {
        setUserStats({
          total_bets: 0,
          wins: 0,
          losses: 0,
          pushes: 0,
          units_won: 0,
          current_streak: 0
        });
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadFriendStats = async () => {
    try {
      const targetUserId = userId || user?.id;
      
      // Get friend count
      const { count: friendCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`);

      // Get total users for world percentile
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Mock percentiles for now - would need more complex queries
      setFriendStats({
        friend_count: friendCount || 0,
        friend_percentile: 75,
        world_percentile: 68
      });
    } catch (error: any) {
      console.error('Error loading friend stats:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated.",
      });

      loadProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!isOwnProfile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });

      setIsEditing(false);
      loadProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateWinRate = () => {
    if (!userStats || userStats.total_bets === 0) return 0;
    return Math.round((userStats.wins / userStats.total_bets) * 100);
  };

  const getBestSport = () => {
    // This would come from actual data - for now return placeholder
    return "NBA";
  };

  if (!user) return null;

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* Avatar with upload */}
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-4xl">
                    {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">
                      {profile.display_name || profile.username || 'Anonymous User'}
                    </h1>
                    {profile.username && (
                      <p className="text-muted-foreground">@{profile.username}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      {profile.favorite_team && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {profile.favorite_team}
                        </span>
                      )}
                      {profile.state && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {profile.state}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant={isEditing ? "outline" : "default"}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  )}
                </div>

                {/* Social Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{userStats?.total_bets || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Bets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {userStats?.units_won ? `${userStats.units_won > 0 ? '+' : ''}${userStats.units_won.toFixed(1)}u` : '0u'}
                    </div>
                    <div className="text-xs text-muted-foreground">$ Won</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{calculateWinRate()}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{friendStats?.friend_count || 0}</div>
                    <div className="text-xs text-muted-foreground">Friends</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Among Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                Top {friendStats?.friend_percentile || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Better than {friendStats?.friend_percentile || 0}% of your friends
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Among Everyone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                Top {friendStats?.world_percentile || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Better than {friendStats?.world_percentile || 0}% of all users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Best Sport
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getBestSport()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Most profitable picks
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <User className="w-4 h-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="w-4 h-4 mr-2" />
              Detailed Stats
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && isOwnProfile ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="How others see you"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Your unique username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favorite_team">Favorite Team</Label>
                      <Input
                        id="favorite_team"
                        value={formData.favorite_team}
                        onChange={(e) => setFormData(prev => ({ ...prev, favorite_team: e.target.value }))}
                        placeholder="Your favorite sports team"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Your state (e.g., CA, NY, TX)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred_sportsbook">Preferred Sportsbook</Label>
                      <Input
                        id="preferred_sportsbook"
                        value={formData.preferred_sportsbook}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferred_sportsbook: e.target.value }))}
                        placeholder="Your go-to sportsbook"
                      />
                    </div>
                    <Button onClick={handleSave} className="w-full" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Display Name: </span>
                      <span>{profile.display_name || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Username: </span>
                      <span>{profile.username || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Favorite Team: </span>
                      <span>{profile.favorite_team || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="font-medium">State: </span>
                      <span>{profile.state || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Preferred Sportsbook: </span>
                      <span>{profile.preferred_sportsbook || 'Not set'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Win/Loss
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {userStats?.wins || 0}-{userStats?.losses || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userStats?.pushes || 0} pushes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Units Won
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${(userStats?.units_won || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(userStats?.units_won || 0) > 0 ? '+' : ''}{userStats?.units_won?.toFixed(2) || '0.00'}u
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total profit/loss
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Current Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.abs(userStats?.current_streak || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(userStats?.current_streak || 0) >= 0 ? 'Win' : 'Loss'} streak
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="friends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Friends & Connections</CardTitle>
                <CardDescription>Connect with other bettors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold">{friendStats?.friend_count || 0}</div>
                    <p className="text-sm text-muted-foreground">Total Friends</p>
                  </div>
                  {isOwnProfile && (
                    <Button onClick={() => navigate('/friends')}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Find Friends
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  View and manage your friends in the Friends section
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;