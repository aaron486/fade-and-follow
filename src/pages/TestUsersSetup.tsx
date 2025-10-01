import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TestUsersSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const testUsers = [
    { email: 'bigant@test.com', password: 'TestPass123!', username: 'bigant', displayName: 'Big Ant', bettorLevel: 'Legendary' },
    { email: 'peyton@test.com', password: 'TestPass123!', username: 'peyton', displayName: 'Peyton', bettorLevel: 'Advanced' },
    { email: 'dave@test.com', password: 'TestPass123!', username: 'dave', displayName: 'Dave', bettorLevel: 'Pro' },
    { email: 'unclerich@test.com', password: 'TestPass123!', username: 'unclerich', displayName: 'Uncle Rich', bettorLevel: 'Expert' },
  ];

  const createTestUsers = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-create-test-users', {
        body: {
          users: testUsers,
          currentUserId: user.id,
        },
      });

      if (error) throw error;

      if (data.errors && data.errors.length > 0) {
        console.error('Some users failed:', data.errors);
      }

      setCreated(true);
      toast({
        title: "Success!",
        description: data.message || `Created ${data.results.length} test users`,
      });
    } catch (error: any) {
      console.error('Error creating test users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create test users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Test Users Setup</CardTitle>
          <CardDescription>
            Create test friend accounts and automatically add them as your friends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!created ? (
            <>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This will create the following test accounts:
                </p>
                <div className="grid gap-2">
                  {testUsers.map((user) => (
                    <div key={user.email} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <UserPlus className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {user.bettorLevel}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Password for all accounts: <code className="px-2 py-1 rounded bg-muted">TestPass123!</code>
                </p>
              </div>

              <Button
                onClick={createTestUsers}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Test Users & Friendships
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <h3 className="text-xl font-semibold mb-2">All Set!</h3>
                <p className="text-muted-foreground">
                  Test users created and added as friends
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard')} size="lg">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestUsersSetup;
