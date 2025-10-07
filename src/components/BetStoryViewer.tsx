import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, TrendingUp, TrendingDown } from 'lucide-react';
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
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const BetStoryViewer = ({ story, onClose, onNext, onPrevious }: BetStoryViewerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'tail' | 'fade' | null>(null);
  const STORY_DURATION = 5000; // 5 seconds

  useEffect(() => {
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
  }, [onNext]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
    setActionType('fade');
    setShowConfirmDialog(true);
  };

  const getBetDetailsForAction = () => {
    if (actionType === 'tail') {
      // Tail = copy the exact same bet
      return {
        sport: story.betDetails.sport,
        event_name: story.betDetails.eventName,
        market: 'ML', // Default market type
        selection: story.betDetails.selection,
        odds: story.betDetails.odds.toString(),
        stake_units: story.betDetails.stake.toString(),
        notes: `Tailing ${story.userName}'s pick`,
      };
    } else {
      // Fade = bet against (invert the odds sign and adjust selection)
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
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Navigation */}
      {onPrevious && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {onNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
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
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <BetConfirmation
            betDetails={getBetDetailsForAction()}
            onCancel={() => {
              setShowConfirmDialog(false);
              setActionType(null);
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
