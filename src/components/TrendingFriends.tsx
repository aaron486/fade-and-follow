import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useRef } from 'react';

interface TrendingFriend {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  team: string;
  best_bet_sport: string;
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
    team: 'Lakers',
    best_bet_sport: 'NBA',
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
    team: 'Cowboys',
    best_bet_sport: 'NFL',
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
    team: 'Red Sox',
    best_bet_sport: 'MLB',
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
    team: 'Celtics',
    best_bet_sport: 'NBA',
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
    team: 'Chiefs',
    best_bet_sport: 'NFL',
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextFriend = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingFriends.length);
  };

  const prevFriend = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingFriends.length) % trendingFriends.length);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Handle image upload to storage
      console.log('Upload image:', file);
    }
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
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar with Upload */}
          <div className="relative flex-shrink-0 group">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarImage src={currentFriend.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-lg">
                {(currentFriend.display_name || currentFriend.username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm truncate">{currentFriend.display_name}</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={prevFriend}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={nextFriend}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="truncate">🏈 {currentFriend.team}</span>
              <span>•</span>
              <span>{currentFriend.best_bet_sport}</span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span>
                <span className="text-accent font-semibold">{currentFriend.wins}</span>
                <span className="text-muted-foreground mx-0.5">-</span>
                <span className="text-destructive font-semibold">{currentFriend.losses}</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className={currentFriend.win_rate >= 60 ? 'text-accent font-semibold' : ''}>
                {currentFriend.win_rate.toFixed(0)}% WR
              </span>
              <span className="text-muted-foreground">•</span>
              <span className={currentFriend.units_won > 0 ? 'text-accent font-semibold' : 'text-destructive font-semibold'}>
                {currentFriend.units_won > 0 ? '+' : ''}{currentFriend.units_won.toFixed(1)}u
              </span>
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {trendingFriends.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-6 bg-primary' 
                  : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
