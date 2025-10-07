import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import BetStoryViewer from './BetStoryViewer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import BetImageUpload from './BetImageUpload';
import BetConfirmation from './BetConfirmation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BetStory {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  winRate?: number;
  betDetails: {
    sport: string;
    eventName: string;
    selection: string;
    odds: number;
    stake: number;
    notes?: string;
  };
  timestamp: string;
}

const getPerformanceRing = (winRate?: number) => {
  if (!winRate || winRate < 25) {
    return "from-gray-400 via-gray-500 to-gray-400"; // Below 25% - gray
  } else if (winRate >= 70) {
    return "from-orange-500 via-red-500 to-orange-600 animate-pulse"; // 70%+ - Flame 🔥
  } else if (winRate >= 60) {
    return "from-red-500 via-red-600 to-red-500"; // 60%+ - Red
  } else if (winRate >= 50) {
    return "from-green-500 via-green-600 to-green-500"; // 50%+ - Green
  } else if (winRate >= 35) {
    return "from-yellow-500 via-yellow-600 to-yellow-500"; // 35%+ - Yellow
  } else {
    return "from-blue-400 via-cyan-400 to-blue-500"; // 25-35% - Ice ❄️
  }
};

const BetStoriesBar = () => {
  const { user, userProfile } = useAuth();
  const [stories, setStories] = useState<BetStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<BetStory | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadStep, setUploadStep] = useState<'upload' | 'confirm'>('upload');
  const [extractedBetDetails, setExtractedBetDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const userAvatarUrl = userProfile?.avatar_url;
  const userDisplayName = userProfile?.display_name || userProfile?.username || user?.email?.split('@')[0] || 'You';

  useEffect(() => {
    if (user) {
      loadStories();
      
      // Subscribe to new stories
      const channel = supabase
        .channel('bet-stories-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bet_stories'
          },
          () => {
            loadStories();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadUserProfile = async () => {
    // Profile is now loaded in AuthContext - this function is no longer needed
    // Keeping empty function to avoid breaking changes
  };

  const loadStories = async () => {
    try {
      setLoading(true);
      
      // Clean up expired stories first
      await supabase.rpc('delete_expired_stories');

      // Get story IDs
      const { data: storiesData, error: storiesError } = await supabase
        .from('bet_stories')
        .select('id, user_id, bet_id, created_at')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      if (!storiesData || storiesData.length === 0) {
        setStories([]);
        setLoading(false);
        return;
      }

      // Get user IDs and bet IDs
      const userIds = [...new Set(storiesData.map(s => s.user_id))];
      const betIds = storiesData.map(s => s.bet_id);
      
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      // Fetch user records for win rates
      const { data: userRecords } = await supabase
        .from('user_records')
        .select('user_id, wins, losses')
        .in('user_id', userIds);

      // Fetch bets
      const { data: bets } = await supabase
        .from('bets')
        .select('id, sport, event_name, selection, odds, stake_units, notes')
        .in('id', betIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const betsMap = new Map(bets?.map(b => [b.id, b]) || []);
      const recordsMap = new Map(userRecords?.map(r => [r.user_id, r]) || []);

      // Format stories
      const formattedStories: BetStory[] = storiesData
        .map((story) => {
          const profile = profilesMap.get(story.user_id);
          const bet = betsMap.get(story.bet_id);
          const record = recordsMap.get(story.user_id);
          
          if (!profile || !bet) return null;

          // Calculate win rate
          let winRate = 0;
          if (record && (record.wins + record.losses) > 0) {
            winRate = (record.wins / (record.wins + record.losses)) * 100;
          }

          return {
            id: story.id,
            userId: story.user_id,
            userName: profile.display_name || profile.username || 'Unknown User',
            avatarUrl: profile.avatar_url,
            timestamp: story.created_at,
            winRate,
            betDetails: {
              sport: bet.sport,
              eventName: bet.event_name,
              selection: bet.selection,
              odds: bet.odds,
              stake: bet.stake_units,
              notes: bet.notes,
            },
          };
        })
        .filter(Boolean) as BetStory[];

      setStories(formattedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                <div className="h-16 w-16 rounded-full bg-muted" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <>
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 p-4">
            {/* Add Bet Story Button */}
            <button
              onClick={() => setShowUploadDialog(true)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-dashed border-primary/50 group-hover:border-primary transition-colors">
                  <AvatarImage src={userAvatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1">
                  <Plus className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                Your Bet
              </span>
            </button>

            {/* Friends' Bet Stories */}
            {stories.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <p className="text-sm">No stories yet. Add a bet to share with friends!</p>
              </div>
            ) : (
              stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="flex flex-col items-center gap-2 flex-shrink-0 group"
                >
                  <div className="relative">
                    <div className={`p-[3px] rounded-full bg-gradient-to-tr ${getPerformanceRing(story.winRate)} shadow-lg`}>
                      <Avatar className="h-16 w-16 border-[3px] border-background">
                        <AvatarImage src={story.avatarUrl} />
                        <AvatarFallback className="bg-muted">
                          {story.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Performance indicator */}
                    {story.winRate && story.winRate >= 70 && (
                      <div className="absolute -top-1 -right-1 text-lg">🔥</div>
                    )}
                    {story.winRate && story.winRate >= 25 && story.winRate < 35 && (
                      <div className="absolute -top-1 -right-1 text-lg">❄️</div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground max-w-[80px] truncate">
                    {story.userName.split(' ')[0]}
                  </span>
                </button>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Bet Story Viewer */}
      {selectedStory && (
        <BetStoryViewer
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          onNext={() => {
            const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
            if (currentIndex < stories.length - 1) {
              setSelectedStory(stories[currentIndex + 1]);
            }
          }}
          onPrevious={() => {
            const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
            if (currentIndex > 0) {
              setSelectedStory(stories[currentIndex - 1]);
            }
          }}
        />
      )}

      {/* Upload Bet Dialog */}
      <Dialog 
        open={showUploadDialog} 
        onOpenChange={(open) => {
          setShowUploadDialog(open);
          if (!open) {
            setUploadStep('upload');
            setExtractedBetDetails(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {uploadStep === 'upload' ? (
            <BetImageUpload
              onBetExtracted={(details) => {
                setExtractedBetDetails(details);
                setUploadStep('confirm');
              }}
              onCancel={() => {
                setShowUploadDialog(false);
                setUploadStep('upload');
                setExtractedBetDetails(null);
              }}
            />
          ) : (
            <BetConfirmation
              betDetails={extractedBetDetails}
              onCancel={() => {
                setUploadStep('upload');
                setExtractedBetDetails(null);
              }}
              onSuccess={() => {
                setShowUploadDialog(false);
                setUploadStep('upload');
                setExtractedBetDetails(null);
                loadStories(); // Reload stories after adding a new one
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BetStoriesBar;
