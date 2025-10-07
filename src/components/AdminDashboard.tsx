import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Users, TrendingUp, Database, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  bettor_level: string | null;
}

interface Influencer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  follower_count: number | null;
  is_verified: boolean | null;
}

interface ScrapingJob {
  id: string;
  status: string;
  total_accounts: number;
  processed_accounts: number;
  successful_picks: number;
  failed_accounts: number;
  current_account: string | null;
  started_at: string;
  completed_at: string | null;
}

export const AdminDashboard = () => {
  const [scraping, setScraping] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [currentJob, setCurrentJob] = useState<ScrapingJob | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBets: 0,
    totalInfluencers: 0,
    totalPicks: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
    loadUsers();
    loadInfluencers();
    loadLatestScrapingJob();
    
    // Poll for scraping job updates every 3 seconds
    const interval = setInterval(() => {
      if (currentJob?.status === 'running') {
        loadLatestScrapingJob();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentJob?.status]);

  const loadLatestScrapingJob = async () => {
    try {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setCurrentJob(data);
      }
    } catch (error) {
      console.error('Error loading scraping job:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url, created_at, bettor_level')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadInfluencers = async () => {
    try {
      const { data, error } = await supabase
        .from('public_bettors')
        .select('id, username, display_name, avatar_url, follower_count, is_verified')
        .order('follower_count', { ascending: false })
        .limit(100);

      if (error) throw error;
      setInfluencers(data || []);
    } catch (error) {
      console.error('Error loading influencers:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, betsRes, influencersRes, picksRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bets').select('id', { count: 'exact', head: true }),
        supabase.from('public_bettors').select('id', { count: 'exact', head: true }),
        supabase.from('public_picks').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalBets: betsRes.count || 0,
        totalInfluencers: influencersRes.count || 0,
        totalPicks: picksRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleScrapeCelebrityPicks = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-celebrity-picks');
      
      if (error) throw error;

      toast({
        title: "Scraping Started!",
        description: `Scraping ${stats.totalInfluencers} influencers in the background. This may take several minutes.`,
      });
      
      // Reload job status immediately
      setTimeout(loadLatestScrapingJob, 1000);
    } catch (error) {
      console.error('Error triggering scrape:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start scraping",
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your betting platform</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Activity className="mr-2 h-4 w-4" />
          Admin
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Influencers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInfluencers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celebrity Picks</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPicks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Users and Influencers */}
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scrape Celebrity Picks</CardTitle>
                <CardDescription>
                  Fetch latest picks from all {stats.totalInfluencers} influencers on Twitter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleScrapeCelebrityPicks}
                  disabled={scraping || currentJob?.status === 'running'}
                  className="w-full"
                >
                  {scraping || currentJob?.status === 'running' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Start Scraping
                    </>
                  )}
                </Button>
                
                {currentJob && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={currentJob.status === 'completed' ? 'default' : 'secondary'}>
                        {currentJob.status}
                      </Badge>
                    </div>
                    
                    {currentJob.status === 'running' && currentJob.current_account && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Processing:</span>
                        <span className="ml-2 font-medium">{currentJob.current_account}</span>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-medium">
                          {currentJob.processed_accounts} / {currentJob.total_accounts}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${currentJob.total_accounts > 0 
                              ? (currentJob.processed_accounts / currentJob.total_accounts) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Picks found:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {currentJob.successful_picks}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failed:</span>
                        <span className="ml-2 font-medium text-red-600">
                          {currentJob.failed_accounts}
                        </span>
                      </div>
                    </div>
                    
                    {currentJob.completed_at && (
                      <div className="text-xs text-muted-foreground">
                        Completed {new Date(currentJob.completed_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Edge functions and automation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bet Settlement</span>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Celebrity Scraper</span>
                  <Badge variant="outline" className="text-green-600">Ready</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Odds API</span>
                  <Badge variant="outline" className="text-green-600">Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users ({users.length})</CardTitle>
              <CardDescription>Complete list of registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(user.display_name || user.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.display_name || user.username || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground truncate">@{user.username || 'no-username'}</p>
                      </div>
                      <div className="text-right">
                        {user.bettor_level && (
                          <Badge variant="outline" className="mb-1">
                            {user.bettor_level}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="influencers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Influencers ({influencers.length})</CardTitle>
              <CardDescription>Celebrity bettors being tracked</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {influencers.map((influencer) => (
                    <div key={influencer.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={influencer.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {influencer.display_name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{influencer.display_name}</p>
                          {influencer.is_verified && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">@{influencer.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{influencer.follower_count?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-muted-foreground">followers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
