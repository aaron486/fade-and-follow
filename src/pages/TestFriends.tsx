import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';

const testFriends = [
  { email: 'samir@test.com', password: 'test123456', username: 'samir', displayName: 'Samir' },
  { email: 'george@test.com', password: 'test123456', username: 'george', displayName: 'George' },
  { email: 'bigant@test.com', password: 'test123456', username: 'bigant', displayName: 'Big Ant' },
  { email: 'peyton@test.com', password: 'test123456', username: 'peyton', displayName: 'Peyton' },
  { email: 'dave@test.com', password: 'test123456', username: 'dave', displayName: 'Dave' },
  { email: 'unclerich@test.com', password: 'test123456', username: 'unclerich', displayName: 'Uncle Rich' },
];

const TestFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const createTestFriends = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setProgress('Creating test accounts...');

    try {
      const createdUserIds: string[] = [];

      // Create each test account
      for (const friend of testFriends) {
        setProgress(`Creating ${friend.displayName}...`);

        // Try to create the account (will fail if already exists, which is fine)
        const { data, error } = await supabase.auth.signUp({
          email: friend.email,
          password: friend.password,
          options: {
            data: {
              username: friend.username,
              display_name: friend.displayName,
              bettor_level: 'Pro',
            }
          }
        });

        if (data?.user?.id) {
          createdUserIds.push(data.user.id);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setProgress('Creating friendships...');

      // Now create friendships with all test accounts
      // First, get all test user IDs from profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .in('username', testFriends.map(f => f.username));

      if (profiles) {
        // Create friendships
        const friendships = profiles.map(profile => ({
          user1_id: user.id < profile.user_id ? user.id : profile.user_id,
          user2_id: user.id < profile.user_id ? profile.user_id : user.id,
        }));

        const { error: friendshipError } = await supabase
          .from('friendships')
          .upsert(friendships, { onConflict: 'user1_id,user2_id' });

        if (friendshipError) {
          console.error('Friendship error:', friendshipError);
        }
      }

      toast({
        title: "Success!",
        description: "Test friends created and added to your account",
      });

      setProgress('Done!');
    } catch (error: any) {
      console.error('Error creating test friends:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create test friends",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(''), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Friends Setup</CardTitle>
            <CardDescription>
              Create test friend accounts and automatically add them as friends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Accounts:</h3>
              <ul className="space-y-1 text-sm">
                {testFriends.map(friend => (
                  <li key={friend.email}>
                    {friend.displayName} (@{friend.username})
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Password for all: test123456
              </p>
            </div>

            {progress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress}
              </div>
            )}

            <Button 
              onClick={createTestFriends} 
              disabled={loading || !user}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Test Friends
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Note: This will create 6 test accounts. If they already exist, they'll just be added as friends.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestFriends;
