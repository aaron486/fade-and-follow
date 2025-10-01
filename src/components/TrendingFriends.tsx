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
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sharpshooter',
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
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=parlayking',
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
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fadetheodds',
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
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=underdogbettor',
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
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=propmaster',
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

  const getTrendingReason = (friend: TrendingFriend) => {
    if (friend.current_streak >= 7) {
      return '7-game winning streak 🔥';
    } else if (friend.current_streak >= 5) {
      return `${friend.current_streak}-game win streak`;
    } else if (friend.current_streak <= -4) {
      return `${Math.abs(friend.current_streak)}-game losing streak`;
    } else if (friend.win_rate >= 65) {
      return `${friend.win_rate.toFixed(0)}% win rate this week`;
    } else if (friend.units_won >= 15) {
      return `+${friend.units_won.toFixed(1)} units won`;
    } else {
      return 'Hot streak active';
    }
  };

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
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarImage src={friend.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10">
                    {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-sm truncate">
                      {friend.display_name}
                    </p>
                    <span className="text-base flex-shrink-0">
                      {friend.trend === 'hot' ? '🔥' : '❄️'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {getTrendingReason(friend)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {friend.wins}W - {friend.losses}L
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 items-end flex-shrink-0">
                {Math.abs(friend.current_streak) >= 3 && (
                  <Badge 
                    variant={friend.current_streak > 0 ? "default" : "destructive"} 
                    className="gap-1 text-xs"
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
                <Badge variant="secondary" className="gap-1 text-xs">
                  <TrendingUp className="w-3 h-3" />
                  {friend.win_rate.toFixed(0)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
