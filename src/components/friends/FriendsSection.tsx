import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, MessageSquare } from 'lucide-react';
import FriendsList from './FriendsList';
import FriendRequests from './FriendRequests';
import AddFriend from './AddFriend';
import DirectMessage from './DirectMessage';

interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

const FriendsSection = () => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  if (selectedFriend) {
    return <DirectMessage friend={selectedFriend} />;
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger 
            value="all" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Users className="w-4 h-4 mr-2" />
            All Friends
          </TabsTrigger>
          <TabsTrigger 
            value="requests"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger 
            value="add"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friend
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="flex-1 m-0">
          <FriendsList 
            onSelectFriend={setSelectedFriend}
            selectedFriendId={selectedFriend?.id}
          />
        </TabsContent>
        
        <TabsContent value="requests" className="flex-1 m-0">
          <FriendRequests />
        </TabsContent>
        
        <TabsContent value="add" className="flex-1 m-0">
          <AddFriend />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FriendsSection;
