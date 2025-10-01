import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ProfileSidebar from '@/components/ProfileSidebar';
import ChatLayout from '@/components/friends/ChatLayout';
import { FeedContent } from '@/components/FeedContent';
import BetStoriesBar from '@/components/BetStoriesBar';
import LiveOddsBar from '@/components/LiveOddsBar';
import FindFriends from '@/components/FindFriends';

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
          {/* Left Sidebar - Profile & Friends */}
          <div className="w-64 flex-shrink-0 overflow-y-auto border-r space-y-4 p-4">
            <ProfileSidebar />
            <FindFriends />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bars - Stories & Live Odds */}
            <div className="flex-shrink-0">
              <BetStoriesBar />
              <LiveOddsBar />
            </div>
            
            {/* Three Column Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Center - AI Feed (Main Focus) */}
              <div className="flex-1 flex flex-col overflow-hidden p-4 border-r">
                <FeedContent />
              </div>
              
              {/* Right - Chat */}
              <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden p-4">
                <h2 className="text-xl font-bold mb-4">Chat</h2>
                <div className="flex-1 overflow-hidden">
                  <ChatLayout />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;