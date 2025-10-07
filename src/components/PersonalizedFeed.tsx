import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FeedItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  sport: string;
  team_ids: string[];
  source_url: string;
  published_at: string;
}

export const PersonalizedFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, [user]);

  const loadFeed = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's favorite teams
      const { data: profile } = await supabase
        .from('profiles')
        .select('favorite_teams')
        .eq('user_id', user.id)
        .single();

      const favoriteTeams = profile?.favorite_teams || [];

      // Fetch feed items
      let query = supabase
        .from('feed_items')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20);

      // Filter by favorite teams if any selected
      if (favoriteTeams.length > 0) {
        query = query.overlaps('team_ids', favoriteTeams);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedItems(data || []);
    } catch (error) {
      console.error('Error loading feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to load personalized feed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshFeed = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-sports-news');
      
      if (error) throw error;

      toast({
        title: 'Feed Updated',
        description: data.message || 'Successfully updated your feed',
      });

      await loadFeed();
    } catch (error) {
      console.error('Error refreshing feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh feed',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading your personalized feed...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI Betting Insights</h2>
        </div>
        <Button 
          onClick={refreshFeed} 
          disabled={refreshing}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Updating...' : 'Refresh Feed'}
        </Button>
      </div>

      {feedItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No insights yet. Select your favorite teams and refresh the feed!
            </p>
            <Button onClick={refreshFeed} disabled={refreshing}>
              Generate Insights
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {feedItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.summary}</CardDescription>
                  </div>
                  <Badge variant="outline">{item.sport}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{item.content}</p>
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    View Source
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(item.published_at).toLocaleDateString()} at{' '}
                  {new Date(item.published_at).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};