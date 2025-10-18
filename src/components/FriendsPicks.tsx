import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FriendPick {
  id: string;
  sport: string;
  event_name: string;
  selection: string;
  market: string;
  odds: number;
  stake_units: number;
  confidence: string;
  reasoning?: string;
  created_at: string;
  user: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export const FriendsPicks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [picks, setPicks] = useState<FriendPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchFriendsPicks();
  }, [user]);

  const fetchFriendsPicks = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's friendships
      const { data: friendships, error: friendshipError } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (friendshipError) throw friendshipError;

      // Extract friend IDs
      const friendIds = friendships?.map(f => 
        f.user1_id === user.id ? f.user2_id : f.user1_id
      ) || [];

      if (friendIds.length === 0) {
        setPicks([]);
        setLoading(false);
        return;
      }

      // Fetch picks from friends
      const { data: picksData, error: picksError } = await supabase
        .from('picks')
        .select(`
          id,
          sport,
          event_name,
          selection,
          market,
          odds,
          stake_units,
          confidence,
          reasoning,
          created_at,
          user_id
        `)
        .in('user_id', friendIds)
        .eq('is_public', true)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (picksError) throw picksError;

      // Fetch user profiles for the picks
      const userIds = [...new Set(picksData?.map(p => p.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine picks with user data
      const enrichedPicks = picksData?.map(pick => {
        const profile = profiles?.find(p => p.user_id === pick.user_id);
        return {
          ...pick,
          user: profile || {
            user_id: pick.user_id,
            username: 'Unknown',
            display_name: 'Unknown User',
            avatar_url: null
          }
        };
      }) || [];

      setPicks(enrichedPicks);
    } catch (error) {
      console.error('Error fetching friends picks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load friends picks',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const handleTailPick = (pick: FriendPick) => {
    toast({
      title: 'Tailing Pick',
      description: `You're tailing ${pick.user.display_name}'s pick!`
    });
  };

  const handleFadePick = (pick: FriendPick) => {
    toast({
      title: 'Fading Pick',
      description: `You're fading ${pick.user.display_name}'s pick!`
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (picks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No picks from friends yet. Add friends to see their picks here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {picks.map((pick) => (
        <Card key={pick.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={pick.user.avatar_url || undefined} />
                  <AvatarFallback>
                    {pick.user.display_name?.[0] || pick.user.username?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">
                    {pick.user.display_name || pick.user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(pick.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {pick.sport}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">{pick.event_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">{pick.market}</p>
                <span className="text-xs text-muted-foreground">•</span>
                <p className="text-sm font-semibold">{pick.selection}</p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="text-xs">{formatOdds(pick.odds)}</Badge>
                <Badge variant="secondary" className="text-xs">
                  {pick.stake_units}U
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    pick.confidence === 'high' ? 'border-green-500 text-green-600' :
                    pick.confidence === 'medium' ? 'border-yellow-500 text-yellow-600' :
                    'border-blue-500 text-blue-600'
                  }`}
                >
                  {pick.confidence.toUpperCase()}
                </Badge>
              </div>
            </div>

            {pick.reasoning && (
              <p className="text-xs text-muted-foreground italic">
                "{pick.reasoning}"
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => handleTailPick(pick)}
              >
                <TrendingUp className="h-3 w-3" />
                Tail
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => handleFadePick(pick)}
              >
                <TrendingDown className="h-3 w-3" />
                Fade
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};