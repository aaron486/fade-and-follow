import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { FeedCard } from '@/components/FeedCard';
import { TrendingFriends } from '@/components/TrendingFriends';
import { PicksFeed } from '@/components/PicksFeed';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedItem {
  id: string;
  headline: string;
  summary: string;
  suggestedPicks: Array<{
    team: string;
    market: string;
    odds: number;
    reasoning: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
  timestamp: string;
  category: string;
}

const Feed = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  const loadFeed = async () => {
    if (!user) return;

    setIsLoadingFeed(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-feed', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data?.feedItems) {
        setFeedItems(data.feedItems);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      toast({
        title: "Error Loading Feed",
        description: "Failed to load your personalized feed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your feed...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-4xl font-bold fade-text-gradient">Your Feed</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFeed}
                disabled={isLoadingFeed}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingFeed ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <p className="text-muted-foreground">
              AI-curated betting insights based on your favorite teams and betting history
            </p>
          </div>

          {/* Feed Items */}
          <div className="space-y-6">
            {/* Friends Activity */}
            <TrendingFriends />
            
            {/* Friends Picks */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Friends & Celebrity Picks</h2>
              <PicksFeed />
            </div>

            {/* AI Generated Feed */}
            <div>
              <h2 className="text-2xl font-bold mb-4">AI Insights</h2>
              {isLoadingFeed ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-card rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : feedItems.length > 0 ? (
                <div className="space-y-4">
                  {feedItems.map((item) => (
                    <FeedCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-lg border border-border">
                  <p className="text-muted-foreground mb-4">
                    No AI insights yet. Set your favorite team in your profile to get personalized insights!
                  </p>
                  <Button onClick={loadFeed} disabled={isLoadingFeed}>
                    Generate AI Insights
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feed;
