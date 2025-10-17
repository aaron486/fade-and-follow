import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ProfileSidebar from '@/components/ProfileSidebar';
import { TeamPicker } from '@/components/TeamPicker';
import FriendsSection from '@/components/friends/FriendsSection';
import { Leaderboard } from '@/components/Leaderboard';
import { User, Users, Trophy, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const FadeSection = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
            
            {/* Logout Button */}
            <div className="pt-4">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
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
