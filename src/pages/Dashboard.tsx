import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ProfileSidebar from '@/components/ProfileSidebar';
import BettingFeed from '@/components/BettingFeed';
import GroupChat from '@/components/GroupChat';

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
      
      <main className="pt-16"> {/* Account for fixed navigation */}
        <div className="flex h-[calc(100vh-4rem)]"> {/* Full height minus nav */}
          {/* Left Sidebar - Profile & Stats */}
          <div className="flex-shrink-0">
            <ProfileSidebar />
          </div>
          
          {/* Main Content - Betting Feed */}
          <div className="flex-1 overflow-y-auto">
            <BettingFeed />
          </div>
          
          {/* Right Sidebar - Group Chat */}
          <div className="flex-shrink-0 p-4 border-l bg-muted/20">
            <GroupChat />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;