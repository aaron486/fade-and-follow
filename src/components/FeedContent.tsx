import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeedCard } from '@/components/FeedCard';
import { TrendingFriends } from '@/components/TrendingFriends';
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

export const FeedContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const loadFeed = async () => {
    if (!user || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoadingFeed(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-feed', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data?.feedItems) {
        setFeedItems(data.feedItems);
        hasLoadedRef.current = true;
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
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    if (user && !hasLoadedRef.current && !loadingRef.current) {
      loadFeed();
    }
  }, [user]);

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Feed</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadFeed}
            disabled={isLoadingFeed}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingFeed ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingFeed ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading your feed...</p>
            </div>
          </div>
        ) : feedItems.length > 0 ? (
          <div className="space-y-4 p-4">
            {/* Trending Friends Section */}
            <div className="w-full">
              <TrendingFriends />
            </div>

            {/* Feed Items */}
            {feedItems.map((item) => (
              <div key={item.id} className="w-full">
                <FeedCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No feed items yet</h3>
              <p className="text-muted-foreground mb-4">
                Set your favorite team in your profile to get personalized insights!
              </p>
              <Button onClick={loadFeed} disabled={isLoadingFeed} size="lg">
                Generate Feed
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
