import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ProfileSidebar from '@/components/ProfileSidebar';
import BettingFeed from '@/components/BettingFeed';
import GroupChat from '@/components/GroupChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, TrendingUp, User } from 'lucide-react';

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
          <div className="w-80 flex-shrink-0 overflow-y-auto">
            <ProfileSidebar />
          </div>
          
          {/* Main Content - Tabs */}
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="bets" className="flex-1 flex flex-col">
              <div className="border-b bg-card">
                <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0">
                  <TabsTrigger 
                    value="leaderboard" 
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="friends" 
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Friends
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bets" 
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Bets
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profile" 
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="leaderboard" className="h-full m-0 p-6">
                  <div className="text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Leaderboard Coming Soon</h3>
                    <p>See how you rank against other bettors</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="friends" className="h-full m-0 p-6">
                  <div className="text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Friends Coming Soon</h3>
                    <p>Connect with other bettors and follow their picks</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="bets" className="h-full m-0">
                  <BettingFeed />
                </TabsContent>
                
                <TabsContent value="profile" className="h-full m-0 p-6">
                  <div className="text-center text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Profile Settings Coming Soon</h3>
                    <p>Manage your account and preferences</p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          {/* Right Sidebar - Group Chat */}
          <div className="w-80 flex-shrink-0 border-l bg-muted/20 p-4">
            <GroupChat />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;