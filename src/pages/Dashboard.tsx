import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DiscordChat from '@/components/DiscordChat';
import { FeedContent } from '@/components/FeedContent';
import { BetsPage } from '@/components/BetsPage';
import { BottomNav } from '@/components/BottomNav';
import BetStoriesBar from '@/components/BetStoriesBar';
import LiveOddsBar from '@/components/LiveOddsBar';
import BetConfirmation from '@/components/BetConfirmation';
import { useBetSettlement } from '@/hooks/useBetSettlement';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { FadeSection } from '@/components/FadeSection';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [activeView, setActiveView] = useState('feed');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{
    sport: string;
    event_name: string;
    market: string;
    selection: string;
    odds: string;
    stake_units: string;
    notes?: string;
  } | null>(null);
  
  // Auto-settle bets when games finish
  useBetSettlement();

  // Memoize callbacks to prevent unnecessary re-renders
  const handleBetClick = useCallback((betDetails: typeof selectedBet) => {
    setSelectedBet(betDetails);
  }, []);

  const handleBetSuccess = useCallback(() => {
    setSelectedBet(null);
    if (activeView === 'bets') {
      setActiveView('bets');
    }
  }, [activeView]);

  // Memoize view renderer to prevent re-creating on every render
  const renderView = useMemo(() => {
    switch (activeView) {
      case 'fade':
        return (
          <div className="h-full overflow-hidden">
            <FadeSection />
          </div>
        );
      case 'admin':
        return (
          <div className="h-full overflow-y-auto">
            <AdminDashboard />
          </div>
        );
      case 'feed':
        return (
          <div className="h-full overflow-hidden">
            <FeedContent />
          </div>
        );
      case 'bets':
        return (
          <div className="h-full overflow-hidden">
            <BetsPage />
          </div>
        );
      default:
        return (
          <div className="h-full overflow-hidden">
            <FeedContent />
          </div>
        );
    }
  }, [activeView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background pt-[env(safe-area-inset-top)]">
      {/* Top Bars - Stories & Live Odds - Hidden for admin view */}
      {activeView !== 'admin' && (
        <div className="flex-shrink-0">
          <BetStoriesBar />
          <LiveOddsBar onBetClick={handleBetClick} />
        </div>
      )}

      {/* Full Screen Content Area */}
      <main className="flex-1 overflow-hidden">
        {renderView}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeView={activeView} onViewChange={setActiveView} />

      {/* Floating Chat Button - Top Right */}
      <Button
        onClick={() => setChatOpen(!chatOpen)}
        size="icon"
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-50 h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        {chatOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </Button>

      {/* Sliding Chat Panel - Instagram Style */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full md:w-[500px] bg-background border-l shadow-2xl z-40 transition-transform duration-300 ${
          chatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-14 border-b flex items-center justify-between px-4 bg-card">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <DiscordChat />
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* Bet Confirmation Modal */}
      {selectedBet && (
        <BetConfirmation
          betDetails={selectedBet}
          onCancel={() => setSelectedBet(null)}
          onSuccess={handleBetSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;