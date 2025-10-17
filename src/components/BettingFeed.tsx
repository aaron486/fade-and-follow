import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Share2, TrendingUp, Clock, Check, X } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BetPost {
  id: string;
  user: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  bet: {
    sport: string;
    event: string;
    market: string;
    selection: string;
    odds: number;
    stake: number;
    status: 'pending' | 'win' | 'loss' | 'push';
  };
  caption?: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
}

const BettingFeed = () => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [feedPosts, setFeedPosts] = useState<BetPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      if (!user) return;

      try {
        const { data: bets, error } = await supabase
          .from('bets')
          .select(`
            *,
            profiles!bets_user_id_fkey (
              username,
              display_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (bets) {
          const posts: BetPost[] = bets.map((bet: any) => ({
            id: bet.id,
            user: {
              username: bet.profiles?.username || 'user',
              displayName: bet.profiles?.display_name || 'User',
              avatar: bet.profiles?.avatar_url
            },
            bet: {
              sport: bet.sport,
              event: bet.event_name,
              market: bet.market,
              selection: bet.selection,
              odds: bet.odds,
              stake: bet.stake_units || bet.units || 0,
              status: bet.status as 'pending' | 'win' | 'loss' | 'push'
            },
            caption: bet.notes,
            timestamp: new Date(bet.created_at),
            likes: 0,
            comments: 0,
            isLiked: false
          }));

          setFeedPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [user]);

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
        return <Badge variant="default" className="bg-green-500">Won</Badge>;
      case 'loss':
        return <Badge variant="destructive">Lost</Badge>;
      case 'push':
        return <Badge variant="secondary">Push</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 max-w-2xl mx-auto">
        <div className="text-center text-muted-foreground">Loading feed...</div>
      </div>
    );
  }

  if (feedPosts.length === 0) {
    return (
      <div className="flex-1 p-4 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No bets to show yet. Start placing bets to see them here!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Feed Posts */}
        {feedPosts.map((post) => (
          <Card key={post.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback>
                      {post.user.displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{post.user.displayName}</h4>
                    <p className="text-sm text-muted-foreground">
                      @{post.user.username} • {formatDistance(post.timestamp, new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(post.bet.status)}
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Bet Details */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(post.bet.status)}
                    <span className="font-medium">{post.bet.sport}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {post.bet.stake} units @ {formatOdds(post.bet.odds)}
                  </div>
                </div>
                
                <h5 className="font-semibold mb-1">{post.bet.event}</h5>
                <p className="text-sm text-muted-foreground mb-1">{post.bet.market}</p>
                <p className="font-medium">{post.bet.selection}</p>
              </div>

              {/* Caption */}
              {post.caption && (
                <p className="mb-4">{post.caption}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`gap-2 ${post.isLiked ? 'text-red-500' : ''}`}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                  {post.likes}
                </Button>
                
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {post.comments}
                </Button>
                
                <Button variant="ghost" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>

              {/* Comment Input */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input 
                    placeholder="Add a comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BettingFeed;
