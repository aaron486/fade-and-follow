import { useAuth } from '@/contexts/AuthContext';
import { PicksFeed } from '@/components/PicksFeed';
import { TrendingFriends } from '@/components/TrendingFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Sparkles } from 'lucide-react';

export const FeedContent = () => {
  const { user } = useAuth();

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Feed</h2>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4 max-w-2xl mx-auto">
          {/* Trending Friends */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Hot Picks
            </h3>
            <TrendingFriends />
          </div>

          {/* AI Insights Placeholder */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Insights
            </h3>
            <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    🏀 NBA
                  </Badge>
                  Lakers vs Warriors - Matchup Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Based on your betting history and recent team performance, here's what our AI suggests:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">High</Badge>
                    <div>
                      <p className="font-medium">Lakers -5.5 @ -110</p>
                      <p className="text-muted-foreground">Strong home record (12-3) and Warriors missing key defenders</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 mt-3">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    🏈 NFL
                  </Badge>
                  Chiefs vs Bills - Game Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Your favorite team is playing! Here's the AI recommendation:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Medium</Badge>
                    <div>
                      <p className="font-medium">Over 52.5 @ -105</p>
                      <p className="text-muted-foreground">Both offenses ranked top 5, expect high-scoring affair</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Friends & Celebrity Picks */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Friends & Celebrity Picks</h3>
            <PicksFeed />
          </div>
        </div>
      </div>
    </div>
  );
};
