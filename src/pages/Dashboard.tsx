import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ProfileSidebar from '@/components/ProfileSidebar';
import { DiscordChat } from '@/components/DiscordChat';
import { FeedContent } from '@/components/FeedContent';
import { BottomNav } from '@/components/BottomNav';
import BetStoriesBar from '@/components/BetStoriesBar';
import LiveOddsBar from '@/components/LiveOddsBar';
import { BettingStats } from '@/components/BettingStats';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('chat');

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

  const renderView = () => {
    switch (activeView) {
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <ProfileSidebar />
          </div>
        );
      case 'feed':
        return (
          <div className="h-full">
            <FeedContent />
          </div>
        );
      case 'chat':
        return <DiscordChat />;
      case 'groups':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Groups</h2>
              <p className="text-muted-foreground">Group management coming soon</p>
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <BettingStats userId={user.id} />
          </div>
        );
      default:
        return <DiscordChat />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <main>
        {/* Top Bars - Stories & Live Odds */}
        <div className="flex-shrink-0">
          <BetStoriesBar />
          <LiveOddsBar />
        </div>

        {/* Full Screen Content Area */}
        <div className="h-[calc(100vh-10rem)] overflow-hidden">
          {renderView()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
};

export default Dashboard;