import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ProfileSidebar from '@/components/ProfileSidebar';
import BettingFeed from '@/components/BettingFeed';
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
          {/* Left Sidebar - Profile & Quick Stats */}
          <div className="w-80 flex-shrink-0 overflow-y-auto border-r">
            <ProfileSidebar />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Instagram Stories Feature */}
            <BetStoriesBar />
            
            {/* Live Betting Lines */}
            <LiveOddsBar />
            
            {/* Friend Activity Feed */}
            <div className="flex-1 overflow-y-auto">
              <BettingFeed />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;