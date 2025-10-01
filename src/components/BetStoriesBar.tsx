import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import BetStoryViewer from './BetStoryViewer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import BetImageUpload from './BetImageUpload';
import BetConfirmation from './BetConfirmation';
import { useAuth } from '@/contexts/AuthContext';

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

// Mock data for now - will be replaced with real data
const mockStories: BetStory[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Doe',
    avatarUrl: undefined,
    betDetails: {
      sport: 'NBA',
      eventName: 'Lakers vs Warriors',
      selection: 'Lakers -5.5',
      odds: -110,
      stake: 100,
      notes: 'Lakers looking strong at home!'
    },
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    userId: '2',
    userName: 'Jane Smith',
    avatarUrl: undefined,
    betDetails: {
      sport: 'NFL',
      eventName: 'Chiefs vs Bills',
      selection: 'Over 52.5',
      odds: -115,
      stake: 50,
    },
    timestamp: new Date().toISOString()
  },
];

const BetStoriesBar = () => {
  const { user } = useAuth();
  const [selectedStory, setSelectedStory] = useState<BetStory | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadStep, setUploadStep] = useState<'upload' | 'confirm'>('upload');
  const [extractedBetDetails, setExtractedBetDetails] = useState<any>(null);

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
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-muted">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
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
            {mockStories.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div className="relative">
                  <div className="p-[2px] rounded-full bg-gradient-to-tr from-primary via-accent to-primary">
                    <Avatar className="h-16 w-16 border-2 border-background">
                      <AvatarImage src={story.avatarUrl} />
                      <AvatarFallback className="bg-muted">
                        {story.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground max-w-[80px] truncate">
                  {story.userName.split(' ')[0]}
                </span>
              </button>
            ))}
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
            const currentIndex = mockStories.findIndex(s => s.id === selectedStory.id);
            if (currentIndex < mockStories.length - 1) {
              setSelectedStory(mockStories[currentIndex + 1]);
            }
          }}
          onPrevious={() => {
            const currentIndex = mockStories.findIndex(s => s.id === selectedStory.id);
            if (currentIndex > 0) {
              setSelectedStory(mockStories[currentIndex - 1]);
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
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BetStoriesBar;
