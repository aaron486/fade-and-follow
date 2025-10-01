import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Clock,
  Plus
} from 'lucide-react';
import { BetForm } from '@/components/BetForm';
import BetConfirmation from '@/components/BetConfirmation';

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

interface FriendPick {
  id: string;
  friend_name: string;
  friend_avatar?: string;
  event_name: string;
  selection: string;
  odds: number;
  stake_units: number;
  type: 'tail' | 'fade';
  placed_at: string;
}

interface UserBet {
  id: string;
  sport: string;
  event_name: string;
  market: string;
  selection: string;
  odds: number;
  stake_units: number;
  status: string;
  notes?: string;
  placed_at: string;
  resolved_at?: string;
}

export const BetsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [friendPicks, setFriendPicks] = useState<FriendPick[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBetForm, setShowBetForm] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{
    sport: string;
    event_name: string;
    market: string;
    selection: string;
    odds: string;
    stake_units: string;
    notes?: string;
  } | null>(null);

  useEffect(() => {
    loadGames();
    loadFriendPicks();
    loadUserBets();
  }, [user]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-betting-odds', {
        body: { sport: 'upcoming' }
      });

      if (error) throw error;
      
      if (data?.events) {
        setGames(data.events.slice(0, 20)); // Limit to 20 games
      }
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        title: "Error",
        description: "Failed to load games. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserBets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('placed_at', { ascending: false });

      if (error) throw error;
      setUserBets(data || []);
    } catch (error) {
      console.error('Error loading user bets:', error);
    }
  };

  const loadFriendPicks = async () => {
    if (!user) return;

    try {
      // Get user's friends
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (friendError) throw friendError;

      const friendIds = friendships?.map(f => 
        f.user1_id === user.id ? f.user2_id : f.user1_id
      ) || [];

      if (friendIds.length === 0) {
        setFriendPicks([]);
        return;
      }

      // Get recent bets from friends with profile data
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .in('user_id', friendIds)
        .eq('status', 'pending')
        .order('placed_at', { ascending: false })
        .limit(10);

      if (betsError) throw betsError;

      // Get profiles for the friends
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', friendIds);

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, p]) || []
      );

      const picks: FriendPick[] = (bets || []).map(bet => {
        const profile = profileMap.get(bet.user_id);
        return {
          id: bet.id,
          friend_name: profile?.display_name || profile?.username || 'Friend',
          friend_avatar: profile?.avatar_url,
          event_name: bet.event_name,
          selection: bet.selection,
          odds: bet.odds,
          stake_units: bet.stake_units,
          type: 'tail', // Default to tail
          placed_at: bet.placed_at,
        };
      });

      setFriendPicks(picks);
    } catch (error) {
      console.error('Error loading friend picks:', error);
    }
  };

  const handleQuickBet = (game: Game, selection: string, odds: number, market: string) => {
    setSelectedBet({
      sport: game.sport_title,
      event_name: `${game.away_team} @ ${game.home_team}`,
      market,
      selection,
      odds: odds.toString(),
      stake_units: '1.0',
    });
  };

  const handleBetSuccess = () => {
    setSelectedBet(null);
    setShowBetForm(false);
    loadUserBets(); // Refresh user's bets
    toast({
      title: "Bet Placed!",
      description: "Your bet has been recorded successfully.",
    });
  };

  const handleTailFade = (pick: FriendPick, action: 'tail' | 'fade') => {
    const selection = action === 'fade' ? `Fade ${pick.selection}` : pick.selection;
    const odds = action === 'fade' ? '100' : pick.odds.toString();
    
    setSelectedBet({
      sport: 'Various',
      event_name: pick.event_name,
      market: 'ML',
      selection,
      odds,
      stake_units: pick.stake_units.toString(),
    });
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Place Bets</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadGames}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBetForm(!showBetForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Manual Bet Form */}
          {showBetForm && (
            <Card>
              <CardHeader>
                <CardTitle>Manual Bet Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <BetForm 
                  onCancel={() => setShowBetForm(false)}
                  onSuccess={() => {
                    setShowBetForm(false);
                    toast({
                      title: "Bet Placed!",
                      description: "Your bet has been recorded.",
                    });
                  }}
                />
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="my-bets" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="my-bets">
                My Bets ({userBets.length})
              </TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="friends">
                Friends ({friendPicks.length})
              </TabsTrigger>
            </TabsList>

            {/* My Bets Tab */}
            <TabsContent value="my-bets" className="space-y-3 mt-4">
              {userBets.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-2">No bets yet</p>
                    <p className="text-sm text-muted-foreground">
                      Place your first bet to get started!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                userBets.map((bet) => (
                  <Card key={bet.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{bet.sport}</Badge>
                            <Badge 
                              variant={
                                bet.status === 'win' ? 'default' :
                                bet.status === 'loss' ? 'destructive' :
                                bet.status === 'push' ? 'secondary' :
                                'outline'
                              }
                            >
                              {bet.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="font-semibold mb-1">{bet.event_name}</p>
                          <p className="text-sm text-muted-foreground mb-1">
                            {bet.market}: {bet.selection}
                          </p>
                          {bet.notes && (
                            <p className="text-xs text-muted-foreground italic mt-1">
                              "{bet.notes}"
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatOdds(bet.odds)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bet.stake_units}u
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(bet.placed_at)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Available Games Tab */}
            <TabsContent value="games" className="space-y-3 mt-4">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading games...</p>
                </div>
              ) : games.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No games available</p>
                    <Button onClick={loadGames} variant="outline" size="sm" className="mt-4">
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                games.map((game) => {
                  const bookmaker = game.bookmakers?.[0];
                  const h2hMarket = bookmaker?.markets?.find(m => m.key === 'h2h');
                  const spreadsMarket = bookmaker?.markets?.find(m => m.key === 'spreads');
                  
                  return (
                    <Card key={game.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{game.sport_title}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(game.commence_time)}
                          </span>
                        </div>
                        <CardTitle className="text-base mt-2">
                          {game.away_team} @ {game.home_team}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {h2hMarket && (
                          <div className="grid grid-cols-2 gap-2">
                            {h2hMarket.outcomes.map((outcome) => (
                              <Button
                                key={outcome.name}
                                variant="outline"
                                size="sm"
                                className="w-full justify-between"
                                onClick={() => handleQuickBet(game, outcome.name, outcome.price, 'Moneyline')}
                              >
                                <span className="truncate">{outcome.name}</span>
                                <span className="font-semibold ml-2">
                                  {formatOdds(outcome.price)}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                        {spreadsMarket && (
                          <div className="text-xs text-muted-foreground text-center pt-1">
                            Spread available • Tap to place bet
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Friend Picks Tab */}
            <TabsContent value="friends" className="space-y-3 mt-4">
              {friendPicks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-2">No friend picks yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add friends to see their recent bets
                    </p>
                  </CardContent>
                </Card>
              ) : (
                friendPicks.map((pick) => (
                  <Card key={pick.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{pick.friend_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {formatOdds(pick.odds)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {pick.event_name}
                          </p>
                          <p className="font-medium">{pick.selection}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {pick.stake_units} units • {formatTime(pick.placed_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleTailFade(pick, 'tail')}
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Tail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleTailFade(pick, 'fade')}
                        >
                          <TrendingDown className="w-4 h-4 mr-1" />
                          Fade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Bet Confirmation Dialog */}
      {selectedBet && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <BetConfirmation
              betDetails={selectedBet}
              onCancel={() => setSelectedBet(null)}
              onSuccess={handleBetSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};
