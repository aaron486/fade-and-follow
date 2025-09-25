import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Share2, TrendingUp, Clock, Check, X } from 'lucide-react';
import { formatDistance } from 'date-fns';

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
  const [newComment, setNewComment] = useState('');

  // Mock feed data - this will come from API later
  const feedPosts: BetPost[] = [
    {
      id: '1',
      user: {
        username: 'johndoe',
        displayName: 'John Doe',
      },
      bet: {
        sport: 'NBA',
        event: 'Lakers vs Warriors',
        market: 'Moneyline',
        selection: 'Lakers',
        odds: 150,
        stake: 5,
        status: 'win'
      },
      caption: 'Lakers looking strong tonight! LeBron is going to dominate 🔥',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      likes: 12,
      comments: 4,
      isLiked: false
    },
    {
      id: '2',
      user: {
        username: 'sportsmike',
        displayName: 'Sports Mike',
      },
      bet: {
        sport: 'NFL',
        event: 'Chiefs vs Bills',
        market: 'Over/Under',
        selection: 'Over 47.5',
        odds: -110,
        stake: 10,
        status: 'pending'
      },
      caption: 'Both offenses are elite. This is going over easy money 💰',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      likes: 8,
      comments: 2,
      isLiked: true
    },
    {
      id: '3',
      user: {
        username: 'alexluck',
        displayName: 'Alex Lucky',
      },
      bet: {
        sport: 'NBA',
        event: 'Celtics vs Heat',
        market: 'Player Props',
        selection: 'Jayson Tatum Over 25.5 Points',
        odds: -115,
        stake: 3,
        status: 'loss'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      likes: 3,
      comments: 1,
      isLiked: false
    }
  ];

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

  return (
    <div className="flex-1 p-4 max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Create Post */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input 
                  placeholder="Share your latest pick..." 
                  className="mb-3"
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Share your betting insight with friends
                  </div>
                  <Button size="sm">Post Pick</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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