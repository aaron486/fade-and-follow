import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Odds {
  name: string;
  price: number;
  point?: number;
}

interface Market {
  key: string;
  outcomes: Odds[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
  scores?: {
    home_score: number;
    away_score: number;
  };
  completed?: boolean;
}

const SPORTS = [
  { value: 'upcoming', label: 'All Games' },
  { value: 'americanfootball_nfl', label: 'NFL' },
  { value: 'basketball_nba', label: 'NBA' },
  { value: 'baseball_mlb', label: 'MLB' },
  { value: 'americanfootball_ncaaf', label: 'College Football' },
];

interface LiveOddsBarProps {
  onBetClick?: (betDetails: {
    sport: string;
    event_name: string;
    market: string;
    selection: string;
    odds: string;
    stake_units: string;
  }) => void;
}

const LiveOddsBar = ({ onBetClick }: LiveOddsBarProps) => {
  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('upcoming');
  const [error, setError] = useState<string | null>(null);

  const fetchOdds = async (sport: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'https://btteqktyhnyeycmognox.supabase.co/functions/v1/get-betting-odds',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sport })
        }
      );

      if (!response.ok) {
        console.error('Error fetching odds:', response.status);
        setError('Failed to load odds');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data?.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Error fetching odds:', err);
      setError('Failed to load odds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Small delay, then fetch. Function is public so no auth needed.
    const timer = setTimeout(() => {
      fetchOdds(selectedSport);
    }, 300);
    
    // Refresh every 3 minutes for live updates
    const interval = setInterval(() => fetchOdds(selectedSport), 3 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [selectedSport]);

  const formatOdds = (price: number) => {
    return price > 0 ? `+${price}` : price;
  };

  const formatGameTime = (commenceTime: string) => {
    const gameDate = new Date(commenceTime);
    const now = new Date();
    const diffMs = gameDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    const timeStr = gameDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    if (diffHours < 0 && diffHours > -4) {
      // Game likely in progress (within 4 hours after start)
      return 'LIVE';
    } else if (diffHours < 24 && diffHours >= 0) {
      return `Today ${timeStr}`;
    } else if (diffHours < 48 && diffHours >= 24) {
      return `Tomorrow ${timeStr}`;
    } else {
      return gameDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const isGameLive = (commenceTime: string) => {
    const gameDate = new Date(commenceTime);
    const now = new Date();
    const diffMs = gameDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Game is live if it started within the last 4 hours
    return diffHours < 0 && diffHours > -4;
  };

  const getSpreadOutcome = (market: Market) => {
    return market.outcomes.find(o => o.name !== 'Over' && o.name !== 'Under');
  };

  if (loading) {
    return (
      <div className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center gap-4 mb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-64 flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  // Hide component if no events and no error (API key not configured)
  if (events.length === 0 && !error) {
    return null;
  }

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="font-semibold text-sm">Live Betting Lines</h3>
            {error && (
              <Badge variant="destructive" className="text-xs">
                {error}
              </Badge>
            )}
          </div>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPORTS.map(sport => (
                <SelectItem key={sport.value} value={sport.value}>
                  {sport.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 p-4 pt-0">
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 w-full">
              <p className="text-sm">
                {error ? 'Unable to load betting lines. Please try again.' : 'No upcoming games found for this sport'}
              </p>
            </div>
          ) : (
            events.map((event) => {
              const bookmaker = event.bookmakers[0]; // Get first bookmaker
              if (!bookmaker) return null;

              const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads');
              const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');
              const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');

              const homeSpread = spreadMarket?.outcomes.find(o => o.name === event.home_team);
              const awaySpread = spreadMarket?.outcomes.find(o => o.name === event.away_team);
              const over = totalsMarket?.outcomes.find(o => o.name === 'Over');
              const homeML = h2hMarket?.outcomes.find(o => o.name === event.home_team);
              const awayML = h2hMarket?.outcomes.find(o => o.name === event.away_team);
              const isLive = isGameLive(event.commence_time);
              const gameTime = formatGameTime(event.commence_time);

              return (
                <div
                  key={event.id}
                  className="flex-shrink-0 w-80 bg-background/50 border rounded-lg p-3 hover:bg-accent/5 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.sport_title}
                        </Badge>
                        {isLive && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${isLive ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {gameTime}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium truncate">{event.away_team}</span>
                        {isLive && event.scores && (
                          <span className="font-bold text-primary">{event.scores.away_score}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {awaySpread && (
                          <button
                            onClick={() => onBetClick?.({
                              sport: event.sport_title,
                              event_name: `${event.away_team} vs ${event.home_team}`,
                              market: 'Spread',
                              selection: `${event.away_team} ${awaySpread.point > 0 ? '+' : ''}${awaySpread.point}`,
                              odds: awaySpread.price.toString(),
                              stake_units: '1'
                            })}
                            className="font-mono bg-muted px-2 py-1 rounded hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                          >
                            {awaySpread.point > 0 ? '+' : ''}{awaySpread.point} ({formatOdds(awaySpread.price)})
                          </button>
                        )}
                        {awayML && (
                          <button
                            onClick={() => onBetClick?.({
                              sport: event.sport_title,
                              event_name: `${event.away_team} vs ${event.home_team}`,
                              market: 'Moneyline',
                              selection: event.away_team,
                              odds: awayML.price.toString(),
                              stake_units: '1'
                            })}
                            className="font-mono font-semibold text-primary hover:bg-primary hover:text-primary-foreground px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            {formatOdds(awayML.price)}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Home Team */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium truncate">{event.home_team}</span>
                        {isLive && event.scores && (
                          <span className="font-bold text-primary">{event.scores.home_score}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {homeSpread && (
                          <button
                            onClick={() => onBetClick?.({
                              sport: event.sport_title,
                              event_name: `${event.away_team} vs ${event.home_team}`,
                              market: 'Spread',
                              selection: `${event.home_team} ${homeSpread.point > 0 ? '+' : ''}${homeSpread.point}`,
                              odds: homeSpread.price.toString(),
                              stake_units: '1'
                            })}
                            className="font-mono bg-muted px-2 py-1 rounded hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                          >
                            {homeSpread.point > 0 ? '+' : ''}{homeSpread.point} ({formatOdds(homeSpread.price)})
                          </button>
                        )}
                        {homeML && (
                          <button
                            onClick={() => onBetClick?.({
                              sport: event.sport_title,
                              event_name: `${event.away_team} vs ${event.home_team}`,
                              market: 'Moneyline',
                              selection: event.home_team,
                              odds: homeML.price.toString(),
                              stake_units: '1'
                            })}
                            className="font-mono font-semibold text-primary hover:bg-primary hover:text-primary-foreground px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            {formatOdds(homeML.price)}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    {over && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t">
                        <span className="text-muted-foreground">Total</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onBetClick?.({
                              sport: event.sport_title,
                              event_name: `${event.away_team} vs ${event.home_team}`,
                              market: 'Total',
                              selection: `Over ${over.point}`,
                              odds: over.price.toString(),
                              stake_units: '1'
                            })}
                            className="font-mono hover:bg-primary hover:text-primary-foreground px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            O {over.point} ({formatOdds(over.price)})
                          </button>
                          {totalsMarket?.outcomes.find(o => o.name === 'Under') && (
                            <button
                              onClick={() => {
                                const under = totalsMarket.outcomes.find(o => o.name === 'Under');
                                if (under) {
                                  onBetClick?.({
                                    sport: event.sport_title,
                                    event_name: `${event.away_team} vs ${event.home_team}`,
                                    market: 'Total',
                                    selection: `Under ${under.point}`,
                                    odds: under.price.toString(),
                                    stake_units: '1'
                                  });
                                }
                              }}
                              className="font-mono hover:bg-primary hover:text-primary-foreground px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              U {totalsMarket.outcomes.find(o => o.name === 'Under')?.point} ({formatOdds(totalsMarket.outcomes.find(o => o.name === 'Under')!.price)})
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-1">
                      via {bookmaker.title}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default React.memo(LiveOddsBar);
