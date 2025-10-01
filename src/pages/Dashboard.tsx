import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ProfileSidebar from '@/components/ProfileSidebar';
import { DiscordChat } from '@/components/DiscordChat';
import { FeedContent } from '@/components/FeedContent';
import BetStoriesBar from '@/components/BetStoriesBar';
import LiveOddsBar from '@/components/LiveOddsBar';

const Dashboard = () => {
  const { user, loading } = useAuth();

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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Sidebar - Profile & Stats */}
          <div className="w-72 flex-shrink-0 overflow-y-auto border-r p-4">
            <ProfileSidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bars - Stories & Live Odds */}
            <div className="flex-shrink-0">
              <BetStoriesBar />
              <LiveOddsBar />
            </div>
            
            {/* Chat and Feed Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Chat (Expanded Main Focus) */}
              <div className="flex-[2] flex flex-col overflow-hidden border-r">
                <DiscordChat />
              </div>
              
              {/* Right - AI Feed */}
              <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden p-4">
                <FeedContent />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;