import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Edit, 
  Trophy, 
  Target, 
  TrendingUp, 
  MapPin, 
  Heart,
  Instagram,
  MessageCircle,
  Twitter,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import { BettingStats } from '@/components/BettingStats';

interface UserProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  favorite_team: string | null;
  state: string | null;
  preferred_sportsbook: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  x_url: string | null;
  discord_url: string | null;
  total_bets: number | null;
  wins: number | null;
  losses: number | null;
  current_streak: number | null;
  streak_type: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    favorite_team: '',
    state: '',
    preferred_sportsbook: '',
    instagram_url: '',
    tiktok_url: '',
    x_url: '',
    discord_url: ''
  });

  const isOwnProfile = !userId || userId === user?.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfile();
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
          preferred_sportsbook: data.preferred_sportsbook || '',
          instagram_url: data.instagram_url || '',
          tiktok_url: data.tiktok_url || '',
          x_url: data.x_url || '',
          discord_url: data.discord_url || ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      loadProfile(); // Reload to get updated data
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
    if (!profile || !profile.total_bets || profile.total_bets === 0) return 0;
    return Math.round(((profile.wins || 0) / profile.total_bets) * 100);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'tiktok': return <MessageCircle className="w-4 h-4" />;
      case 'x': return <Twitter className="w-4 h-4" />;
      case 'discord': return <Users className="w-4 h-4" />;
      default: return null;
    }
  };

  if (!user) return null;

  if (loading) {
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-2xl">
                  {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">
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
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <User className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Trophy className="w-4 h-4 mr-2" />
              Betting Stats
            </TabsTrigger>
            <TabsTrigger value="social">
              <Users className="w-4 h-4 mr-2" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Basic profile details</CardDescription>
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

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Betting performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {profile.total_bets || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Bets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {calculateWinRate()}%
                      </div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {profile.current_streak || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {profile.wins || 0}-{profile.losses || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">W-L Record</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <BettingStats userId={profile.user_id} />
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>
                  {isOwnProfile ? 'Manage your social media presence' : 'Connect on social media'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && isOwnProfile ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="instagram_url">Instagram</Label>
                      <Input
                        id="instagram_url"
                        type="url"
                        value={formData.instagram_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                        placeholder="https://instagram.com/yourusername"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok_url">TikTok</Label>
                      <Input
                        id="tiktok_url"
                        type="url"
                        value={formData.tiktok_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, tiktok_url: e.target.value }))}
                        placeholder="https://tiktok.com/@yourusername"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="x_url">X (Twitter)</Label>
                      <Input
                        id="x_url"
                        type="url"
                        value={formData.x_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, x_url: e.target.value }))}
                        placeholder="https://x.com/yourusername"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discord_url">Discord</Label>
                      <Input
                        id="discord_url"
                        value={formData.discord_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, discord_url: e.target.value }))}
                        placeholder="your_discord_username#1234"
                      />
                    </div>
                    <Button onClick={handleSave} className="w-full" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    {[
                      { platform: 'instagram', url: profile.instagram_url, label: 'Instagram' },
                      { platform: 'tiktok', url: profile.tiktok_url, label: 'TikTok' },
                      { platform: 'x', url: profile.x_url, label: 'X (Twitter)' },
                      { platform: 'discord', url: profile.discord_url, label: 'Discord' }
                    ].map(({ platform, url, label }) => (
                      <div key={platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSocialIcon(platform)}
                          <span className="font-medium">{label}</span>
                        </div>
                        {url ? (
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={platform === 'discord' ? `#` : url} 
                              target={platform === 'discord' ? '_self' : '_blank'}
                              rel="noopener noreferrer"
                            >
                              {platform === 'discord' ? url : 'Visit'}
                            </a>
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;