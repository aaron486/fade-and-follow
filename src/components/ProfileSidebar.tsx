import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Snowflake, TrendingUp, TrendingDown, Trophy, LogOut } from 'lucide-react';
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProfileSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

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

    const fetchStats = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('user_records')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setStats(data);
      }
    };

    fetchProfile();
    fetchStats();
  }, [user?.id]);

  const handleAvatarUpload = (url: string) => {
    setProfile((prev: any) => ({ ...prev, avatar_url: url }));
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStreakIcon = () => {
    if (!stats) return null;
    if (stats.current_streak >= 5) {
      return <Flame className="w-4 h-4 text-orange-500" />;
    } else if (stats.current_streak <= -3) {
      return <Snowflake className="w-4 h-4 text-blue-500" />;
    }
    return stats.current_streak > 0 ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getStreakBadge = () => {
    if (!stats) return null;
    if (stats.current_streak >= 5) {
      return <Badge variant="destructive" className="bg-orange-500">🔥 On Fire</Badge>;
    } else if (stats.current_streak <= -3) {
      return <Badge variant="secondary" className="bg-blue-500">🧊 Ice Cold</Badge>;
    }
    return (
      <Badge variant={stats.current_streak > 0 ? 'default' : 'destructive'}>
        {stats.current_streak > 0 ? '📈 Hot' : '📉 Cold'}
      </Badge>
    );
  };

  const calculateWinRate = () => {
    if (!stats || (stats.wins + stats.losses) === 0) return 0;
    return Math.round((stats.wins / (stats.wins + stats.losses)) * 100);
  };

  const calculateROI = () => {
    if (!stats || (stats.wins + stats.losses) === 0) return 0;
    const totalBets = stats.wins + stats.losses + stats.pushes;
    if (totalBets === 0) return 0;
    return ((stats.units_won / totalBets) * 100).toFixed(1);
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
              
              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="mt-3 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="mr-2 h-3 w-3" />
                Log Out
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center">
            {getStreakBadge()}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{calculateWinRate()}%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {stats.units_won > 0 ? '+' : ''}{stats.units_won.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Units Won</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.wins + stats.losses + stats.pushes}</div>
                  <div className="text-sm text-muted-foreground">Total Bets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{calculateROI()}%</div>
                  <div className="text-sm text-muted-foreground">ROI</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                {getStreakIcon()}
                <span className="font-medium">
                  {Math.abs(stats.current_streak)} {stats.current_streak > 0 ? 'win' : 'loss'} streak
                </span>
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No betting stats yet. Place your first bet!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
