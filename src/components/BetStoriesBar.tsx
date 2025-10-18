import React, { useState, useEffect } from 'react';
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
  currentStreak?: number;
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

const BetStoriesBar = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<BetStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<BetStory | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [extractedBet, setExtractedBet] = useState<any>(null);

  const loadStories = async () => {
    if (!user) return;

    try {
      // Query bet_stories with joins - use simple column references
      const { data: betStories, error } = await supabase
        .from('bet_stories')
        .select(`
          id,
          user_id,
          bet_id,
          created_at,
          expires_at,
          bets!inner (
            sport,
            event_name,
            selection,
            odds,
            stake_units,
            notes
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (betStories) {
        // Fetch user profiles separately to avoid FK issues
        const userIds = [...new Set(betStories.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const formattedStories: BetStory[] = betStories.map((story: any) => {
          const profile = profileMap.get(story.user_id);
          return {
            id: story.id,
            userId: story.user_id,
            userName: profile?.display_name || profile?.username || 'User',
            avatarUrl: profile?.avatar_url,
            betDetails: {
              sport: story.bets?.sport || '',
              eventName: story.bets?.event_name || '',
              selection: story.bets?.selection || '',
              odds: story.bets?.odds || 0,
              stake: story.bets?.stake_units || 0,
              notes: story.bets?.notes
            },
            timestamp: story.created_at
          };
        });

        setStories(formattedStories);
      }
    } catch (error) {
      console.error('Error loading bet stories:', error);
    }
  };

  useEffect(() => {
    loadStories();
  }, [user]);

  const handleStoryClick = (story: BetStory, index: number) => {
    setSelectedStory(story);
    setCurrentStoryIndex(index);
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
  };

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setSelectedStory(stories[nextIndex]);
    } else {
      handleCloseStory();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      setSelectedStory(stories[prevIndex]);
    }
  };

  const handleBetExtracted = (betDetails: any) => {
    setExtractedBet(betDetails);
    setShowUpload(false);
    setShowConfirm(true);
  };

  const handleBetConfirmed = async () => {
    setShowConfirm(false);
    setExtractedBet(null);
    await loadStories();
  };

  if (!user) return null;

  return (
    <>
      <div className="mb-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 p-2">
            {/* Add Story Button */}
            <button
              onClick={() => setShowUpload(true)}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-dashed border-primary/50">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user.user_metadata?.display_name?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
              <span className="text-xs font-medium">Add Story</span>
            </button>

            {/* Friend Stories */}
            {stories.map((story, index) => (
              <button
                key={story.id}
                onClick={() => handleStoryClick(story, index)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className="relative">
                  <Avatar className="w-16 h-16 ring-2 ring-primary ring-offset-2 ring-offset-background">
                    <AvatarImage src={story.avatarUrl} />
                    <AvatarFallback>{story.userName[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs font-medium max-w-[70px] truncate">
                  {story.userName}
                </span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Story Viewer */}
      {selectedStory && (
        <BetStoryViewer
          story={selectedStory}
          onClose={handleCloseStory}
          onNext={currentStoryIndex < stories.length - 1 ? handleNextStory : undefined}
          onPrevious={currentStoryIndex > 0 ? handlePrevStory : undefined}
        />
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <BetImageUpload
            onBetExtracted={handleBetExtracted}
            onCancel={() => setShowUpload(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {extractedBet && (
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <BetConfirmation
              betDetails={extractedBet}
              onCancel={() => {
                setShowConfirm(false);
                setExtractedBet(null);
              }}
              onSuccess={handleBetConfirmed}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default BetStoriesBar;
