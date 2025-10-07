import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Flame, Snowflake, TrendingUp, TrendingDown, Users, Trophy } from 'lucide-react';
import { BettingStats } from './BettingStats';
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '@/integrations/supabase/client';

const ProfileSidebar = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleAvatarUpload = (url: string) => {
    setProfile((prev: any) => ({ ...prev, avatar_url: url }));
  };

  // Mock data - this will come from actual user data/stats later
  const userStats = {
    winRate: 68,
    totalBets: 147,
    unitsWon: 23.5,
    currentStreak: 5,
    streakType: 'win' as 'win' | 'loss',
    roi: 15.8,
    rank: 12,
    totalUsers: 1250
  };

  const getStreakIcon = () => {
    if (userStats.currentStreak >= 5) {
      return <Flame className="w-4 h-4 text-orange-500" />;
    } else if (userStats.currentStreak <= -3) {
      return <Snowflake className="w-4 h-4 text-blue-500" />;
    }
    return userStats.streakType === 'win' ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getStreakBadge = () => {
    if (userStats.currentStreak >= 5) {
      return <Badge variant="destructive" className="bg-orange-500">🔥 On Fire</Badge>;
    } else if (userStats.currentStreak <= -3) {
      return <Badge variant="secondary" className="bg-blue-500">🧊 Ice Cold</Badge>;
    }
    return (
      <Badge variant={userStats.streakType === 'win' ? 'default' : 'destructive'}>
        {userStats.streakType === 'win' ? '📈 Hot' : '📉 Cold'}
      </Badge>
    );
  };

  if (!user) return null;

  return (
    <div className="w-80 p-4 space-y-4">
      {/* Profile Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center gap-4">
            <AvatarUpload 
              currentAvatarUrl={profile?.avatar_url || user.user_metadata?.avatar_url}
              username={profile?.username || user.user_metadata?.username}
              onUploadComplete={handleAvatarUpload}
            />
            <div className="text-center">
              <h3 className="font-semibold text-lg">
                {profile?.display_name || user.user_metadata?.display_name || user.user_metadata?.username || 'User'}
              </h3>
              <p className="text-sm text-muted-foreground">
                @{profile?.username || user.user_metadata?.username || 'username'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            {getStreakBadge()}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              #{userStats.rank} of {userStats.totalUsers}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userStats.winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">+{userStats.unitsWon}</div>
              <div className="text-sm text-muted-foreground">Units Won</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{userStats.totalBets}</div>
              <div className="text-sm text-muted-foreground">Total Bets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{userStats.roi}%</div>
              <div className="text-sm text-muted-foreground">ROI</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
            {getStreakIcon()}
            <span className="font-medium">
              {Math.abs(userStats.currentStreak)} {userStats.streakType} streak
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friends Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Avatar className="w-8 h-8">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <span className="font-medium">@johndoe</span> won their last 3 bets
              </div>
              <Badge variant="default" className="text-xs">🔥</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Avatar className="w-8 h-8">
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <span className="font-medium">@sportsmike</span> placed a +350 bet
              </div>
              <Badge variant="outline" className="text-xs">2h</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Avatar className="w-8 h-8">
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <span className="font-medium">@alexluck</span> joined the group
              </div>
              <Badge variant="outline" className="text-xs">5h</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSidebar;