import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileSidebar from '@/components/ProfileSidebar';
import { TeamPicker } from '@/components/TeamPicker';
import FriendsSection from '@/components/friends/FriendsSection';
import { Leaderboard } from '@/components/Leaderboard';
import { User, Users, Trophy } from 'lucide-react';

export const FadeSection = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-14 px-4">
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="friends"
            className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Users className="h-4 w-4" />
            Friends
          </TabsTrigger>
          <TabsTrigger 
            value="leaderboard"
            className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex-1 overflow-y-auto mt-0">
          <div className="max-w-2xl mx-auto p-4 pb-8 space-y-4">
            <ProfileSidebar />
            <TeamPicker />
          </div>
        </TabsContent>

        <TabsContent value="friends" className="flex-1 overflow-hidden mt-0">
          <FriendsSection />
        </TabsContent>

        <TabsContent value="leaderboard" className="flex-1 overflow-y-auto mt-0">
          <div className="pb-8">
            <Leaderboard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
