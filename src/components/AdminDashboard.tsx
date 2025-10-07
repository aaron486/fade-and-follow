import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Users, TrendingUp, Database, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AdminDashboard = () => {
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBets: 0,
    totalInfluencers: 0,
    totalPicks: 0,
  });
  const { toast } = useToast();

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
      
      // Reload stats after a delay
      setTimeout(loadStats, 5000);
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
    <div className="container mx-auto p-6 space-y-6">
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

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scrape Celebrity Picks</CardTitle>
            <CardDescription>
              Fetch latest picks from all {stats.totalInfluencers} influencers on Twitter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleScrapeCelebrityPicks}
              disabled={scraping}
              className="w-full"
            >
              {scraping ? (
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
            <p className="text-xs text-muted-foreground mt-2">
              Takes ~3 seconds per influencer. Check logs for progress.
            </p>
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
    </div>
  );
};
