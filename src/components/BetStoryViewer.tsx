import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import BetConfirmation from './BetConfirmation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface BetStory {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
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

interface BetStoryViewerProps {
  story: BetStory;
  stories: BetStory[];
  currentIndex: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onDelete: (storyId: string) => Promise<void>;
  isOwnStory: boolean;
}

const BetStoryViewer = ({ 
  story, 
  stories, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrevious,
  onDelete,
  isOwnStory 
}: BetStoryViewerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'tail' | 'fade' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const STORY_DURATION = 5000; // 5 seconds

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
  }, [story.id]);

  // Auto-progress timer
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (onNext) onNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onNext, isPaused, story.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrevious) onPrevious();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious]);

  const handleDelete = async () => {
    if (window.confirm('Delete this story? This cannot be undone.')) {
      setIsPaused(true);
      await onDelete(story.id);
      toast({
        title: "Story Deleted",
        description: "Your story has been removed",
      });
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds;
  };

  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleTail = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'You need to be signed in to tail bets',
        variant: 'destructive',
      });
      return;
    }
    setIsPaused(true);
    setActionType('tail');
    setShowConfirmDialog(true);
  };

  const handleFade = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'You need to be signed in to fade bets',
        variant: 'destructive',
      });
      return;
    }
    setIsPaused(true);
    setActionType('fade');
    setShowConfirmDialog(true);
  };

  const getBetDetailsForAction = () => {
    if (actionType === 'tail') {
      return {
        sport: story.betDetails.sport,
        event_name: story.betDetails.eventName,
        market: 'ML',
        selection: story.betDetails.selection,
        odds: story.betDetails.odds.toString(),
        stake_units: story.betDetails.stake.toString(),
        notes: `Tailing ${story.userName}'s pick`,
      };
    } else {
      const invertedOdds = story.betDetails.odds > 0 
        ? -story.betDetails.odds 
        : Math.abs(story.betDetails.odds);
      
      return {
        sport: story.betDetails.sport,
        event_name: story.betDetails.eventName,
        market: 'ML',
        selection: `Against: ${story.betDetails.selection}`,
        odds: invertedOdds.toString(),
        stake_units: story.betDetails.stake.toString(),
        notes: `Fading ${story.userName}'s pick`,
      };
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-pointer"
      onClick={handleBackgroundClick}
    >
      {/* Story Indicators */}
      <div className="absolute top-2 left-4 right-4 flex gap-1 z-20">
        {stories.map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            {idx === currentIndex && (
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            )}
            {idx < currentIndex && (
              <div className="h-full bg-white w-full" />
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={story.avatarUrl} />
            <AvatarFallback>{story.userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">{story.userName}</p>
            <p className="text-white/70 text-xs">{timeAgo(story.timestamp)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwnStory && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-white hover:bg-red-500/20 bg-black/30 backdrop-blur-sm"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {onPrevious && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {onNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Bet Details Card */}
      <div className="max-w-md w-full mx-4 cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="space-y-6">
            {/* Sport Badge */}
            <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-1">
              {story.betDetails.sport}
            </Badge>

            {/* Event */}
            <div>
              <h3 className="text-white/70 text-sm font-medium mb-2">Event</h3>
              <p className="text-white text-2xl font-bold">{story.betDetails.eventName}</p>
            </div>

            {/* Selection */}
            <div>
              <h3 className="text-white/70 text-sm font-medium mb-2">Pick</h3>
              <p className="text-white text-3xl font-bold">{story.betDetails.selection}</p>
            </div>

            {/* Odds & Stake */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/70 text-xs font-medium mb-1">Odds</p>
                <p className="text-white text-2xl font-bold">{formatOdds(story.betDetails.odds)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/70 text-xs font-medium mb-1">Stake</p>
                <p className="text-white text-2xl font-bold">${story.betDetails.stake}</p>
              </div>
            </div>

            {/* Notes */}
            {story.betDetails.notes && (
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/90 text-sm italic">"{story.betDetails.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwnStory && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={handleTail} className="flex flex-col items-center gap-1 group">
              <div className="bg-green-500/20 border border-green-500/50 p-3 rounded-full group-hover:bg-green-500/30 transition-colors">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-white text-xs font-semibold">Tail</span>
            </button>
            <button onClick={handleFade} className="flex flex-col items-center gap-1 group">
              <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-full group-hover:bg-red-500/30 transition-colors">
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
              <span className="text-white text-xs font-semibold">Fade</span>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-white text-xs">Like</span>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-white text-xs">Comment</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        setShowConfirmDialog(open);
        if (!open) {
          setActionType(null);
          setIsPaused(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <BetConfirmation
            betDetails={getBetDetailsForAction()}
            onCancel={() => {
              setShowConfirmDialog(false);
              setActionType(null);
              setIsPaused(false);
            }}
            onSuccess={() => {
              setShowConfirmDialog(false);
              setActionType(null);
              toast({
                title: actionType === 'tail' ? 'Tailed!' : 'Faded!',
                description: `Successfully ${actionType === 'tail' ? 'tailed' : 'faded'} ${story.userName}'s pick`,
              });
              onClose();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BetStoryViewer;
