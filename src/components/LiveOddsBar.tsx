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
}

const SPORTS = [
  { value: 'upcoming', label: 'All Upcoming' },
  { value: 'americanfootball_nfl', label: 'NFL' },
  { value: 'basketball_nba', label: 'NBA' },
  { value: 'baseball_mlb', label: 'MLB' },
  { value: 'icehockey_nhl', label: 'NHL' },
  { value: 'soccer_epl', label: 'EPL' },
];

const MOCK_EVENTS: OddsEvent[] = [
  {
    id: 'mock-1',
    sport_key: 'americanfootball_nfl',
    sport_title: 'NFL',
    commence_time: new Date(Date.now() + 86400000).toISOString(),
    home_team: 'Kansas City Chiefs',
    away_team: 'Buffalo Bills',
    bookmakers: [{
      key: 'draftkings',
      title: 'DraftKings',
      markets: [
        {
          key: 'h2h',
          outcomes: [
            { name: 'Kansas City Chiefs', price: -150 },
            { name: 'Buffalo Bills', price: 130 }
          ]
        },
        {
          key: 'spreads',
          outcomes: [
            { name: 'Kansas City Chiefs', price: -110, point: -3.5 },
            { name: 'Buffalo Bills', price: -110, point: 3.5 }
          ]
        },
        {
          key: 'totals',
          outcomes: [
            { name: 'Over', price: -110, point: 51.5 },
            { name: 'Under', price: -110, point: 51.5 }
          ]
        }
      ]
    }]
  },
  {
    id: 'mock-2',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: new Date(Date.now() + 172800000).toISOString(),
    home_team: 'Los Angeles Lakers',
    away_team: 'Boston Celtics',
    bookmakers: [{
      key: 'fanduel',
      title: 'FanDuel',
      markets: [
        {
          key: 'h2h',
          outcomes: [
            { name: 'Los Angeles Lakers', price: 105 },
            { name: 'Boston Celtics', price: -125 }
          ]
        },
        {
          key: 'spreads',
          outcomes: [
            { name: 'Los Angeles Lakers', price: -110, point: 2.5 },
            { name: 'Boston Celtics', price: -110, point: -2.5 }
          ]
        },
        {
          key: 'totals',
          outcomes: [
            { name: 'Over', price: -115, point: 228.5 },
            { name: 'Under', price: -105, point: 228.5 }
          ]
        }
      ]
    }]
  },
  {
    id: 'mock-3',
    sport_key: 'baseball_mlb',
    sport_title: 'MLB',
    commence_time: new Date(Date.now() + 259200000).toISOString(),
    home_team: 'New York Yankees',
    away_team: 'Houston Astros',
    bookmakers: [{
      key: 'betmgm',
      title: 'BetMGM',
      markets: [
        {
          key: 'h2h',
          outcomes: [
            { name: 'New York Yankees', price: -140 },
            { name: 'Houston Astros', price: 120 }
          ]
        },
        {
          key: 'spreads',
          outcomes: [
            { name: 'New York Yankees', price: -115, point: -1.5 },
            { name: 'Houston Astros', price: -105, point: 1.5 }
          ]
        },
        {
          key: 'totals',
          outcomes: [
            { name: 'Over', price: -110, point: 8.5 },
            { name: 'Under', price: -110, point: 8.5 }
          ]
        }
      ]
    }]
  }
];

const LiveOddsBar = () => {
  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('upcoming');
  const [useMockData, setUseMockData] = useState(false);

  const fetchOdds = async (sport: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-betting-odds', {
        body: { sport }
      });

      if (error) {
        console.error('Error fetching odds:', error);
        setUseMockData(true);
        setEvents(MOCK_EVENTS);
        setLoading(false);
        return;
      }

      if (data?.events && data.events.length > 0) {
        setEvents(data.events.slice(0, 10));
        setUseMockData(false);
      } else {
        setUseMockData(true);
        setEvents(MOCK_EVENTS);
      }
    } catch (error) {
      console.error('Error fetching odds:', error);
      setUseMockData(true);
      setEvents(MOCK_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOdds(selectedSport);
    // Refresh every 5 minutes
    const interval = setInterval(() => fetchOdds(selectedSport), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedSport]);

  const formatOdds = (price: number) => {
    return price > 0 ? `+${price}` : price;
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

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="font-semibold text-sm">Live Betting Lines</h3>
            {useMockData && (
              <Badge variant="outline" className="text-xs">
                Demo Data
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
              <p className="text-sm">No upcoming games found for this sport</p>
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

              return (
                <div
                  key={event.id}
                  className="flex-shrink-0 w-80 bg-background/50 border rounded-lg p-3 hover:bg-accent/5 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {event.sport_title}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.commence_time).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate flex-1">{event.away_team}</span>
                      <div className="flex items-center gap-2 text-xs">
                        {awaySpread && (
                          <span className="font-mono bg-muted px-2 py-1 rounded">
                            {awaySpread.point > 0 ? '+' : ''}{awaySpread.point} ({formatOdds(awaySpread.price)})
                          </span>
                        )}
                        {awayML && (
                          <span className="font-mono font-semibold text-primary">
                            {formatOdds(awayML.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Home Team */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate flex-1">{event.home_team}</span>
                      <div className="flex items-center gap-2 text-xs">
                        {homeSpread && (
                          <span className="font-mono bg-muted px-2 py-1 rounded">
                            {homeSpread.point > 0 ? '+' : ''}{homeSpread.point} ({formatOdds(homeSpread.price)})
                          </span>
                        )}
                        {homeML && (
                          <span className="font-mono font-semibold text-primary">
                            {formatOdds(homeML.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    {over && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-mono">
                          O/U {over.point} ({formatOdds(over.price)})
                        </span>
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

export default LiveOddsBar;
