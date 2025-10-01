import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, Snowflake, TrendingUp, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextFriend = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingFriends.length);
  };

  const prevFriend = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingFriends.length) % trendingFriends.length);
  };

  const currentFriend = trendingFriends[currentIndex];

  const getTrendingReason = (friend: TrendingFriend) => {
    if (friend.current_streak >= 7) {
      return (
        <span className="text-xs">
          <span className="text-accent font-semibold">{friend.current_streak}</span> picks hit in a row 🔥
        </span>
      );
    } else if (friend.current_streak >= 5) {
      return (
        <span className="text-xs">
          <span className="text-accent font-semibold">{friend.current_streak}</span> picks hit in a row
        </span>
      );
    } else if (friend.current_streak <= -4) {
      return (
        <span className="text-xs">
          <span className="text-destructive font-semibold">{Math.abs(friend.current_streak)}</span> picks missed in a row
        </span>
      );
    } else if (friend.current_streak > 0) {
      return (
        <span className="text-xs">
          <span className="text-accent font-semibold">{friend.current_streak}</span> picks hit in a row
        </span>
      );
    } else if (friend.win_rate >= 65) {
      return (
        <span className="text-xs">
          <span className="text-accent font-semibold">{friend.win_rate.toFixed(0)}%</span> win rate
        </span>
      );
    } else if (friend.units_won >= 15) {
      return (
        <span className="text-xs">
          <span className="text-accent font-semibold">+{friend.units_won.toFixed(1)}</span> units won
        </span>
      );
    } else {
      return <span className="text-xs">Hot streak active</span>;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Trending Friends
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={prevFriend}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {currentIndex + 1}/{trendingFriends.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextFriend}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={currentFriend.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-2xl">
                {(currentFriend.display_name || currentFriend.username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 text-3xl">
              {currentFriend.trend === 'hot' ? '🔥' : '❄️'}
            </div>
          </div>

          {/* Name */}
          <div>
            <h3 className="text-xl font-bold">{currentFriend.display_name}</h3>
            <p className="text-sm text-muted-foreground">@{currentFriend.username}</p>
          </div>

          {/* Trending Reason */}
          <div className="text-center px-4">
            {getTrendingReason(currentFriend)}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">
                <span className="text-accent">{currentFriend.wins}</span>
                <span className="text-muted-foreground mx-1">-</span>
                <span className="text-destructive">{currentFriend.losses}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Record</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className={`text-2xl font-bold ${currentFriend.win_rate >= 60 ? 'text-accent' : 'text-foreground'}`}>
                {currentFriend.win_rate.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Win Rate</p>
            </div>

            {Math.abs(currentFriend.current_streak) >= 3 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                  currentFriend.current_streak > 0 ? 'text-accent' : 'text-destructive'
                }`}>
                  {currentFriend.current_streak > 0 ? (
                    <>
                      <Flame className="w-6 h-6" />
                      {currentFriend.current_streak}
                    </>
                  ) : (
                    <>
                      <Snowflake className="w-6 h-6" />
                      {Math.abs(currentFriend.current_streak)}
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentFriend.current_streak > 0 ? 'Win Streak' : 'Loss Streak'}
                </p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <div className={`text-2xl font-bold ${
                currentFriend.units_won > 0 ? 'text-accent' : 'text-destructive'
              }`}>
                {currentFriend.units_won > 0 ? '+' : ''}{currentFriend.units_won.toFixed(1)}u
              </div>
              <p className="text-xs text-muted-foreground mt-1">Units</p>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-2 pt-2">
            {trendingFriends.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
