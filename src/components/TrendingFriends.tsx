import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, Snowflake, TrendingUp, Trophy } from 'lucide-react';

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
  trend: 'hot' | 'cold';
}

// Mock trending friends data
const mockTrendingFriends: TrendingFriend[] = [
  {
    user_id: '1',
    username: 'sharpshooter23',
    display_name: 'Sharp Shooter',
    avatar_url: null,
    current_streak: 7,
    wins: 28,
    losses: 12,
    units_won: 18.5,
    win_rate: 70,
    trend: 'hot'
  },
  {
    user_id: '2',
    username: 'parlayking',
    display_name: 'Parlay King',
    avatar_url: null,
    current_streak: 5,
    wins: 22,
    losses: 15,
    units_won: 12.3,
    win_rate: 59.5,
    trend: 'hot'
  },
  {
    user_id: '3',
    username: 'fadetheodds',
    display_name: 'Fade Master',
    avatar_url: null,
    current_streak: -4,
    wins: 15,
    losses: 20,
    units_won: -8.2,
    win_rate: 42.9,
    trend: 'cold'
  },
  {
    user_id: '4',
    username: 'underdogbettor',
    display_name: 'Underdog Bettor',
    avatar_url: null,
    current_streak: 6,
    wins: 19,
    losses: 11,
    units_won: 15.7,
    win_rate: 63.3,
    trend: 'hot'
  },
  {
    user_id: '5',
    username: 'propmaster',
    display_name: 'Prop Master',
    avatar_url: null,
    current_streak: 4,
    wins: 25,
    losses: 18,
    units_won: 9.4,
    win_rate: 58.1,
    trend: 'hot'
  }
];

export const TrendingFriends = () => {
  const trendingFriends = mockTrendingFriends;

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
                {friend.trend === 'hot' ? (
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    🔥
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    ❄️
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">
                    {friend.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {friend.wins}W - {friend.losses}L
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {Math.abs(friend.current_streak) >= 3 && (
                  <Badge 
                    variant={friend.current_streak > 0 ? "default" : "destructive"} 
                    className="gap-1"
                  >
                    {friend.current_streak > 0 ? (
                      <>
                        <Flame className="w-3 h-3" />
                        {friend.current_streak}W
                      </>
                    ) : (
                      <>
                        <Snowflake className="w-3 h-3" />
                        {Math.abs(friend.current_streak)}L
                      </>
                    )}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {friend.win_rate.toFixed(0)}%
                </Badge>
                {Math.abs(friend.units_won) >= 10 && (
                  <Badge 
                    variant={friend.units_won > 0 ? "outline" : "destructive"}
                    className="gap-1"
                  >
                    <Trophy className="w-3 h-3" />
                    {friend.units_won > 0 ? '+' : ''}{friend.units_won.toFixed(1)}u
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
