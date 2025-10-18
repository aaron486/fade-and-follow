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

interface UserStories {
  userId: string;
  userName: string;
  avatarUrl?: string;
  stories: BetStory[];
  hasViewed?: boolean;
}

const BetStoriesBar = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<BetStory[]>([]);
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [selectedUserStories, setSelectedUserStories] = useState<UserStories | null>(null);
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
        
        // Group stories by user
        const grouped = formattedStories.reduce((acc, story) => {
          const existing = acc.find(u => u.userId === story.userId);
          if (existing) {
            existing.stories.push(story);
          } else {
            acc.push({
              userId: story.userId,
              userName: story.userName,
              avatarUrl: story.avatarUrl,
              stories: [story],
              hasViewed: false
            });
          }
          return acc;
        }, [] as UserStories[]);
        
        setUserStories(grouped);
      }
    } catch (error) {
      console.error('Error loading bet stories:', error);
    }
  };

  useEffect(() => {
    loadStories();
  }, [user]);

  const handleUserStoriesClick = (userStoriesData: UserStories, userIndex: number) => {
    setSelectedUserStories(userStoriesData);
    setCurrentStoryIndex(0);
  };

  const handleCloseStory = () => {
    setSelectedUserStories(null);
    setCurrentStoryIndex(0);
  };

  const handleNextStory = () => {
    if (!selectedUserStories) return;
    
    if (currentStoryIndex < selectedUserStories.stories.length - 1) {
      // Next story for same user
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Move to next user's stories
      const currentUserIndex = userStories.findIndex(u => u.userId === selectedUserStories.userId);
      if (currentUserIndex < userStories.length - 1) {
        const nextUser = userStories[currentUserIndex + 1];
        setSelectedUserStories(nextUser);
        setCurrentStoryIndex(0);
      } else {
        handleCloseStory();
      }
    }
  };

  const handlePrevStory = () => {
    if (!selectedUserStories) return;
    
    if (currentStoryIndex > 0) {
      // Previous story for same user
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      // Move to previous user's stories
      const currentUserIndex = userStories.findIndex(u => u.userId === selectedUserStories.userId);
      if (currentUserIndex > 0) {
        const prevUser = userStories[currentUserIndex - 1];
        setSelectedUserStories(prevUser);
        setCurrentStoryIndex(prevUser.stories.length - 1);
      }
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('bet_stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      // Reload stories
      await loadStories();
      
      // If viewing deleted story, close viewer
      if (selectedUserStories) {
        const updatedUser = userStories.find(u => u.userId === selectedUserStories.userId);
        if (!updatedUser || updatedUser.stories.length === 0) {
          handleCloseStory();
        } else {
          setSelectedUserStories(updatedUser);
          if (currentStoryIndex >= updatedUser.stories.length) {
            setCurrentStoryIndex(updatedUser.stories.length - 1);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting story:', error);
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

            {/* User Stories - Grouped by user like Instagram */}
            {userStories.map((userStory, index) => (
              <button
                key={userStory.userId}
                onClick={() => handleUserStoriesClick(userStory, index)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className="relative">
                  <Avatar className="w-16 h-16 ring-2 ring-primary ring-offset-2 ring-offset-background">
                    <AvatarImage src={userStory.avatarUrl} />
                    <AvatarFallback>{userStory.userName[0]}</AvatarFallback>
                  </Avatar>
                  {userStory.stories.length > 1 && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {userStory.stories.length}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium max-w-[70px] truncate">
                  {userStory.userName}
                </span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Story Viewer */}
      {selectedUserStories && (
        <BetStoryViewer
          story={selectedUserStories.stories[currentStoryIndex]}
          stories={selectedUserStories.stories}
          currentIndex={currentStoryIndex}
          onClose={handleCloseStory}
          onNext={handleNextStory}
          onPrevious={currentStoryIndex > 0 || userStories.findIndex(u => u.userId === selectedUserStories.userId) > 0 ? handlePrevStory : undefined}
          onDelete={handleDeleteStory}
          isOwnStory={selectedUserStories.userId === user?.id}
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
