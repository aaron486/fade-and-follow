import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeedCard } from '@/components/FeedCard';
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

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">AI Feed</h2>
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

      {/* Feed Items */}
      <div className="flex-1 overflow-y-auto">
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
              No feed items yet. Set your favorite team in your profile to get personalized insights!
            </p>
            <Button onClick={loadFeed} disabled={isLoadingFeed}>
              Generate Feed
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
