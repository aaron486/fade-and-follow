import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import BetConfirmation from './BetConfirmation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  recent_bet: {
    event: string;
    selection: string;
    odds: number;
    stake: number;
  };
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
    trend: 'hot',
    recent_bet: {
      event: 'Lakers vs Warriors',
      selection: 'Lakers -5.5',
      odds: -110,
      stake: 2.5
    }
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
    trend: 'hot',
    recent_bet: {
      event: 'Cowboys vs Eagles',
      selection: 'Over 48.5',
      odds: -115,
      stake: 3.0
    }
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
    trend: 'cold',
    recent_bet: {
      event: 'Red Sox vs Yankees',
      selection: 'Red Sox ML',
      odds: +145,
      stake: 2.0
    }
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
    trend: 'hot',
    recent_bet: {
      event: 'Celtics vs Heat',
      selection: 'Celtics -3.5',
      odds: -105,
      stake: 4.0
    }
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
    trend: 'hot',
    recent_bet: {
      event: 'Chiefs vs Bills',
      selection: 'Mahomes Over 275.5 Yards',
      odds: -120,
      stake: 2.0
    }
  }
];

export const TrendingFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const trendingFriends = mockTrendingFriends;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'tail' | 'fade' | null>(null);

  const nextFriend = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingFriends.length);
  };

  const prevFriend = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingFriends.length) % trendingFriends.length);
  };

  const currentFriend = trendingFriends[currentIndex];

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds;
  };

  const handleTail = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'You need to be signed in to tail bets',
        variant: 'destructive',
      });
      return;
    }
    setActionType('tail');
    setShowConfirmDialog(true);
  };

  const handleFade = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'You need to be signed in to fade bets',
        variant: 'destructive',
      });
      return;
    }
    setActionType('fade');
    setShowConfirmDialog(true);
  };

  const getBetDetailsForAction = () => {
    if (actionType === 'tail') {
      return {
        sport: currentFriend.best_bet_sport,
        event_name: currentFriend.recent_bet.event,
        market: 'ML',
        selection: currentFriend.recent_bet.selection,
        odds: currentFriend.recent_bet.odds.toString(),
        stake_units: currentFriend.recent_bet.stake.toString(),
        notes: `Tailing ${currentFriend.display_name}'s pick`,
      };
    } else {
      const invertedOdds = currentFriend.recent_bet.odds > 0 
        ? -currentFriend.recent_bet.odds 
        : Math.abs(currentFriend.recent_bet.odds);
      
      return {
        sport: currentFriend.best_bet_sport,
        event_name: currentFriend.recent_bet.event,
        market: 'ML',
        selection: `Against: ${currentFriend.recent_bet.selection}`,
        odds: invertedOdds.toString(),
        stake_units: currentFriend.recent_bet.stake.toString(),
        notes: `Fading ${currentFriend.display_name}'s pick`,
      };
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="p-0">
          {/* Header with Navigation */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarImage src={currentFriend.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10">
                  {(currentFriend.display_name || currentFriend.username || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-sm">{currentFriend.display_name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>🏆 {currentFriend.team}</span>
                  <span>•</span>
                  <span>{currentFriend.best_bet_sport}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={prevFriend}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={nextFriend}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bet Details */}
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm rounded-2xl p-4 border border-primary/20">
              <Badge className="mb-3 text-xs">{currentFriend.best_bet_sport}</Badge>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Latest Pick</p>
                  <p className="text-sm font-medium text-muted-foreground">{currentFriend.recent_bet.event}</p>
                </div>
                
                <div>
                  <p className="text-lg font-bold">{currentFriend.recent_bet.selection}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-background/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Odds</p>
                    <p className="text-base font-bold">{formatOdds(currentFriend.recent_bet.odds)}</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Stake</p>
                    <p className="text-base font-bold">{currentFriend.recent_bet.stake}u</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-around text-center text-xs">
              <div>
                <p className="font-bold">
                  <span className="text-accent">{currentFriend.wins}</span>
                  <span className="text-muted-foreground mx-0.5">-</span>
                  <span className="text-destructive">{currentFriend.losses}</span>
                </p>
                <p className="text-muted-foreground">Record</p>
              </div>
              <div>
                <p className={`font-bold ${currentFriend.win_rate >= 60 ? 'text-accent' : ''}`}>
                  {currentFriend.win_rate.toFixed(0)}%
                </p>
                <p className="text-muted-foreground">Win Rate</p>
              </div>
              <div>
                <p className={`font-bold ${currentFriend.units_won > 0 ? 'text-accent' : 'text-destructive'}`}>
                  {currentFriend.units_won > 0 ? '+' : ''}{currentFriend.units_won.toFixed(1)}u
                </p>
                <p className="text-muted-foreground">Units</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={handleTail}
                className="flex-1 flex flex-col items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl p-3 transition-colors group"
              >
                <TrendingUp className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">Tail</span>
              </button>
              <button 
                onClick={handleFade}
                className="flex-1 flex flex-col items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl p-3 transition-colors group"
              >
                <TrendingDown className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Fade</span>
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 pt-1">
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
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <BetConfirmation
            betDetails={getBetDetailsForAction()}
            onCancel={() => {
              setShowConfirmDialog(false);
              setActionType(null);
            }}
            onSuccess={() => {
              setShowConfirmDialog(false);
              setActionType(null);
              toast({
                title: actionType === 'tail' ? 'Tailed!' : 'Faded!',
                description: `Successfully ${actionType === 'tail' ? 'tailed' : 'faded'} ${currentFriend.display_name}'s pick`,
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
