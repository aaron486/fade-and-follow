import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, TrendingUp, Trophy } from 'lucide-react';

interface TrendingFriend {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  current_streak: number;
  wins: number;
  losses: number;
  units_won: number;
  win_rate: number;
}

export const TrendingFriends = () => {
  const { user } = useAuth();
  const [trendingFriends, setTrendingFriends] = useState<TrendingFriend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadTrendingFriends();
  }, [user]);

  const loadTrendingFriends = async () => {
    if (!user) return;

    try {
      // Get user's friendships
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (friendshipsError) throw friendshipsError;

      // Extract friend IDs
      const friendIds = friendships?.map(f => 
        f.user1_id === user.id ? f.user2_id : f.user1_id
      ) || [];

      if (friendIds.length === 0) {
        setTrendingFriends([]);
        setIsLoading(false);
        return;
      }

      // Get friend profiles and their records
      const { data: friendsData, error: friendsError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          display_name,
          avatar_url
        `)
        .in('user_id', friendIds);

      if (friendsError) throw friendsError;

      // Get records for these friends
      const { data: records, error: recordsError } = await supabase
        .from('user_records')
        .select('*')
        .in('user_id', friendIds);

      if (recordsError) throw recordsError;

      // Combine and calculate trending
      const friendsWithStats = friendsData?.map(friend => {
        const record = records?.find(r => r.user_id === friend.user_id);
        const wins = record?.wins || 0;
        const losses = record?.losses || 0;
        const total = wins + losses;
        
        return {
          ...friend,
          current_streak: record?.current_streak || 0,
          wins,
          losses,
          units_won: record?.units_won || 0,
          win_rate: total > 0 ? (wins / total) * 100 : 0,
        };
      }) || [];

      // Filter and sort trending friends (hot streak >= 3 or high win rate with recent activity)
      const trending = friendsWithStats
        .filter(f => Math.abs(f.current_streak) >= 3 || (f.win_rate >= 60 && f.wins >= 5))
        .sort((a, b) => {
          // Prioritize by streak, then win rate, then units won
          if (Math.abs(b.current_streak) !== Math.abs(a.current_streak)) {
            return Math.abs(b.current_streak) - Math.abs(a.current_streak);
          }
          if (b.win_rate !== a.win_rate) {
            return b.win_rate - a.win_rate;
          }
          return b.units_won - a.units_won;
        })
        .slice(0, 5);

      setTrendingFriends(trending);
    } catch (error) {
      console.error('Error loading trending friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Trending Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendingFriends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Trending Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No trending friends yet. Add friends to see their hot streaks!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Trending Friends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trendingFriends.map((friend) => (
            <div
              key={friend.user_id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={friend.avatar_url || undefined} />
                  <AvatarFallback>
                    {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">
                    {friend.display_name || friend.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {friend.wins}W - {friend.losses}L
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {friend.current_streak >= 3 && (
                  <Badge variant="default" className="gap-1">
                    <Flame className="w-3 h-3" />
                    {friend.current_streak}W
                  </Badge>
                )}
                {friend.win_rate >= 60 && (
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {friend.win_rate.toFixed(0)}%
                  </Badge>
                )}
                {friend.units_won >= 10 && (
                  <Badge variant="outline" className="gap-1">
                    <Trophy className="w-3 h-3" />
                    +{friend.units_won.toFixed(1)}u
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
