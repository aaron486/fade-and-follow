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

// Mock bet stories data
const mockBetStories: BetStory[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Sarah Johnson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    winRate: 72,
    currentStreak: 5,
    betDetails: {
      sport: 'NBA',
      eventName: 'Lakers vs Warriors',
      selection: 'Lakers -3.5',
      odds: -110,
      stake: 2,
      notes: 'Lakers defense looking solid, Warriors missing key players 🔥'
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Mike Chen',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    winRate: 65,
    currentStreak: 3,
    betDetails: {
      sport: 'NFL',
      eventName: 'Chiefs vs Bills',
      selection: 'Mahomes Over 287.5 Passing Yards',
      odds: -115,
      stake: 3,
      notes: 'Mahomes always delivers in prime time!'
    },
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Alex Rivera',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    winRate: 58,
    currentStreak: 2,
    betDetails: {
      sport: 'MLB',
      eventName: 'Yankees vs Blue Jays',
      selection: 'Over 8 Runs',
      odds: -105,
      stake: 1.5,
      notes: 'Both bullpens struggling lately'
    },
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    userId: 'user4',
    userName: 'Emma Davis',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    winRate: 45,
    currentStreak: -2,
    betDetails: {
      sport: 'NBA',
      eventName: 'Celtics vs Heat',
      selection: 'Celtics ML',
      odds: -140,
      stake: 2,
      notes: 'Bounce back game for Boston'
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    userId: 'user5',
    userName: 'James Wilson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    winRate: 78,
    currentStreak: 7,
    betDetails: {
      sport: 'NFL',
      eventName: 'Eagles vs Cowboys',
      selection: 'Eagles -6.5',
      odds: -105,
      stake: 4,
      notes: 'Eagles run game too strong for Dallas defense 🦅'
    },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '6',
    userId: 'user6',
    userName: 'Lisa Martinez',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    winRate: 55,
    currentStreak: 1,
    betDetails: {
      sport: 'NHL',
      eventName: 'Maple Leafs vs Bruins',
      selection: 'Under 6.5 Goals',
      odds: -120,
      stake: 2,
      notes: 'Both teams playing tight defensive hockey'
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '7',
    userId: 'user7',
    userName: 'Chris Taylor',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris',
    winRate: 32,
    currentStreak: -4,
    betDetails: {
      sport: 'NBA',
      eventName: 'Suns vs Nuggets',
      selection: 'Suns +7',
      odds: -110,
      stake: 1,
      notes: 'Due for a win, right? 😅'
    },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '8',
    userId: 'user8',
    userName: 'Rachel Kim',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel',
    winRate: 69,
    currentStreak: 4,
    betDetails: {
      sport: 'NFL',
      eventName: '49ers vs Seahawks',
      selection: '49ers Team Total Over 24.5',
      odds: -115,
      stake: 3,
      notes: 'Niners offense rolling, Seattle defense vulnerable'
    },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
];

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
      // Load mock stories with a small delay
      const timer = setTimeout(() => {
        loadStories();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    // Profile is now loaded in AuthContext - this function is no longer needed
    // Keeping empty function to avoid breaking changes
  };

  const loadStories = async () => {
    try {
      setLoading(true);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Use mock data
      setStories(mockBetStories);
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
              stories.map((story) => {
                const isWinStreak = story.currentStreak && story.currentStreak > 0;
                const ringColor = isWinStreak 
                  ? "from-green-500 via-green-600 to-green-500" 
                  : "from-red-500 via-red-600 to-red-500";
                
                return (
                  <button
                    key={story.userId}
                    onClick={() => setSelectedStory(story)}
                    className="flex flex-col items-center gap-1 flex-shrink-0 group"
                  >
                    <div className="relative">
                      <div className={`p-[3px] rounded-full bg-gradient-to-tr ${ringColor} shadow-lg transition-all duration-300 group-hover:scale-110`}>
                        <Avatar className="h-16 w-16 border-[3px] border-background">
                          <AvatarImage src={story.avatarUrl} />
                          <AvatarFallback className="bg-muted">
                            {story.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border-2 border-background flex items-center justify-center shadow-lg">
                        <span className={`text-sm font-bold ${isWinStreak ? 'text-green-500' : 'text-red-500'}`}>
                          {story.currentStreak || 0}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground max-w-[80px] truncate">
                      {story.userName.split(' ')[0]}
                    </span>
                  </button>
                );
              })
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

export default React.memo(BetStoriesBar);
