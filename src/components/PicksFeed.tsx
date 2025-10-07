import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, TrendingUp, Clock, Check, X, Star } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Pick {
  id: string;
  user_id?: string;
  bettor_id?: string;
  sport: string;
  event_name: string;
  market: string;
  selection: string;
  odds: number;
  stake_units: number;
  status: 'pending' | 'win' | 'loss' | 'push';
  reasoning?: string;
  confidence: string;
  created_at?: string;
  posted_at?: string;
  // User/Bettor info
  username: string;
  display_name: string;
  avatar_url?: string;
  is_verified?: boolean;
  isCelebrity?: boolean;
}

export const PicksFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPicks, setLikedPicks] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Moderate delay for picks feed
    if (user) {
      const timer = setTimeout(() => {
        loadPicks();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  const loadPicks = async () => {
    if (!user) return;

    try {
      // Load friends' picks with proper join
      const { data: friendsData, error: friendsError } = await supabase
        .from('picks')
        .select(`
          id,
          user_id,
          sport,
          event_name,
          market,
          selection,
          odds,
          stake_units,
          status,
          reasoning,
          confidence,
          created_at,
          is_public
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (friendsError) throw friendsError;

      // Get user profiles for friends' picks
      const userIds = (friendsData || []).map(p => p.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      // Load celebrity picks
      const { data: celebData, error: celebError } = await supabase
        .from('public_picks')
        .select(`
          id,
          bettor_id,
          sport,
          event_name,
          market,
          selection,
          odds,
          stake_units,
          status,
          reasoning,
          confidence,
          posted_at
        `)
        .order('posted_at', { ascending: false })
        .limit(20);

      if (celebError) throw celebError;

      // Get bettor profiles
      const bettorIds = (celebData || []).map(p => p.bettor_id);
      const { data: bettorsData } = await supabase
        .from('public_bettors')
        .select('id, username, display_name, avatar_url, is_verified')
        .in('id', bettorIds);

      const bettorsMap = new Map(
        (bettorsData || []).map(b => [b.id, b])
      );

      // Combine and format picks
      const formattedFriendsPicks: Pick[] = (friendsData || []).map(pick => {
        const profile = profilesMap.get(pick.user_id);
        return {
          id: pick.id,
          user_id: pick.user_id,
          sport: pick.sport,
          event_name: pick.event_name,
          market: pick.market,
          selection: pick.selection,
          odds: pick.odds,
          stake_units: pick.stake_units,
          status: pick.status as 'pending' | 'win' | 'loss' | 'push',
          reasoning: pick.reasoning,
          confidence: pick.confidence,
          created_at: pick.created_at,
          username: profile?.username || 'user',
          display_name: profile?.display_name || 'User',
          avatar_url: profile?.avatar_url,
          isCelebrity: false
        };
      });

      const formattedCelebPicks: Pick[] = (celebData || []).map(pick => {
        const bettor = bettorsMap.get(pick.bettor_id);
        return {
          id: pick.id,
          bettor_id: pick.bettor_id,
          sport: pick.sport,
          event_name: pick.event_name,
          market: pick.market,
          selection: pick.selection,
          odds: pick.odds,
          stake_units: pick.stake_units || 1,
          status: pick.status as 'pending' | 'win' | 'loss' | 'push',
          reasoning: pick.reasoning,
          confidence: pick.confidence || 'medium',
          posted_at: pick.posted_at,
          username: bettor?.username || 'bettor',
          display_name: bettor?.display_name || 'Bettor',
          avatar_url: bettor?.avatar_url,
          is_verified: bettor?.is_verified,
          isCelebrity: true
        };
      });

      // Merge and sort by date
      const allPicks = [...formattedFriendsPicks, ...formattedCelebPicks].sort((a, b) => {
        const dateA = new Date(a.created_at || a.posted_at || 0).getTime();
        const dateB = new Date(b.created_at || b.posted_at || 0).getTime();
        return dateB - dateA;
      });

      setPicks(allPicks);
    } catch (error) {
      console.error('Error loading picks:', error);
      toast({
        title: "Error",
        description: "Failed to load picks feed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'win':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'loss':
        return <X className="w-4 h-4 text-red-500" />;
      case 'push':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'win':
        return <Badge className="bg-green-500 hover:bg-green-600">Won</Badge>;
      case 'loss':
        return <Badge variant="destructive">Lost</Badge>;
      case 'push':
        return <Badge variant="secondary">Push</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-accent/20 text-accent border-accent/30',
      medium: 'bg-primary/20 text-primary border-primary/30',
      low: 'bg-muted text-muted-foreground border-border',
    };
    return colors[confidence as keyof typeof colors] || colors.medium;
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const toggleLike = (pickId: string) => {
    setLikedPicks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pickId)) {
        newSet.delete(pickId);
      } else {
        newSet.add(pickId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {picks.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p>No picks yet. Check back soon!</p>
          </div>
        </Card>
      ) : (
        picks.map((pick) => (
          <Card key={pick.id} className="hover:border-primary/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={pick.avatar_url} />
                    <AvatarFallback>
                      {pick.display_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{pick.display_name}</h4>
                      {pick.isCelebrity && pick.is_verified && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{pick.username} • {formatDistance(
                        new Date(pick.created_at || pick.posted_at || Date.now()), 
                        new Date(), 
                        { addSuffix: true }
                      )}
                    </p>
                  </div>
                </div>
                {getStatusBadge(pick.status)}
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Bet Details */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(pick.status)}
                    <span className="font-medium">{pick.sport}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getConfidenceBadge(pick.confidence)}`}>
                      {pick.confidence}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {pick.stake_units}u @ {formatOdds(pick.odds)}
                    </div>
                  </div>
                </div>
                
                <h5 className="font-semibold mb-1">{pick.event_name}</h5>
                <p className="text-sm text-muted-foreground mb-1">{pick.market}</p>
                <p className="font-medium text-primary">{pick.selection}</p>
              </div>

              {/* Reasoning */}
              {pick.reasoning && (
                <p className="text-sm mb-4 text-muted-foreground leading-relaxed">
                  {pick.reasoning}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`gap-2 ${likedPicks.has(pick.id) ? 'text-red-500' : ''}`}
                  onClick={() => toggleLike(pick.id)}
                >
                  <Heart className={`w-4 h-4 ${likedPicks.has(pick.id) ? 'fill-current' : ''}`} />
                  {likedPicks.has(pick.id) ? '1' : '0'}
                </Button>
                
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  0
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto"
                >
                  Tail Pick
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};