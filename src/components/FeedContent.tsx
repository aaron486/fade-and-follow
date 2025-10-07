import { useAuth } from '@/contexts/AuthContext';
import { PicksFeed } from '@/components/PicksFeed';

export const FeedContent = () => {
  const { user } = useAuth();

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Feed</h2>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4 max-w-2xl mx-auto">
          {/* Picks Feed */}
          <PicksFeed />
        </div>
      </div>
    </div>
  );
};
