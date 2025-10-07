import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Snowflake, Lock, TrendingUp, Target, Zap, Star, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  units: string;
  streak: string;
  winRate: string;
  roi: string;
  wins: number;
  losses: number;
  isCelebrity?: boolean;
}

export const Leaderboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("public");
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [userLeaderboard, setUserLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [celebrityLeaderboard, setCelebrityLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      // Fetch user leaderboard
      const { data: userData, error: userError } = await supabase
        .from('user_records')
        .select(`
          user_id,
          wins,
          losses,
          pushes,
          units_won,
          current_streak,
          profiles!inner(username, display_name, avatar_url)
        `)
        .order('units_won', { ascending: false })
        .limit(50);

      if (userError) throw userError;

      // Fetch celebrity leaderboard
      const { data: celebrityData, error: celebrityError } = await supabase
        .from('public_bettor_records')
        .select(`
          bettor_id,
          wins,
          losses,
          pushes,
          units_won,
          current_streak,
          public_bettors!inner(username, display_name, avatar_url)
        `)
        .order('units_won', { ascending: false })
        .limit(50);

      if (celebrityError) throw celebrityError;

      // Format user leaderboard
      const formattedUsers: LeaderboardEntry[] = (userData || []).map((record: any, index) => {
        const totalBets = record.wins + record.losses;
        const winRate = totalBets > 0 ? ((record.wins / totalBets) * 100).toFixed(0) : '0';
        const roi = totalBets > 0 ? ((record.units_won / totalBets) * 100).toFixed(1) : '0';
        const roiNum = parseFloat(roi);
        
        return {
          rank: index + 1,
          id: record.user_id,
          name: record.profiles.display_name || record.profiles.username,
          username: record.profiles.username,
          avatar_url: record.profiles.avatar_url,
          units: Number(record.units_won) >= 0 ? `+${Number(record.units_won).toFixed(1)}` : Number(record.units_won).toFixed(1),
          streak: `${Math.abs(record.current_streak)}${record.current_streak >= 0 ? 'W' : 'L'}`,
          winRate: `${winRate}%`,
          roi: `${roiNum >= 0 ? '+' : ''}${roi}%`,
          wins: record.wins,
          losses: record.losses,
          isCelebrity: false,
        };
      });

      // Format celebrity leaderboard
      const formattedCelebrities: LeaderboardEntry[] = (celebrityData || []).map((record: any, index) => {
        const totalBets = record.wins + record.losses;
        const winRate = totalBets > 0 ? ((record.wins / totalBets) * 100).toFixed(0) : '0';
        const roi = totalBets > 0 ? ((record.units_won / totalBets) * 100).toFixed(1) : '0';
        const roiNum = parseFloat(roi);
        
        return {
          rank: index + 1,
          id: record.bettor_id,
          name: record.public_bettors.display_name,
          username: record.public_bettors.username,
          avatar_url: record.public_bettors.avatar_url,
          units: Number(record.units_won) >= 0 ? `+${Number(record.units_won).toFixed(1)}` : Number(record.units_won).toFixed(1),
          streak: `${Math.abs(record.current_streak)}${record.current_streak >= 0 ? 'W' : 'L'}`,
          winRate: `${winRate}%`,
          roi: `${roiNum >= 0 ? '+' : ''}${roi}%`,
          wins: record.wins,
          losses: record.losses,
          isCelebrity: true,
        };
      });

      setUserLeaderboard(formattedUsers);
      setCelebrityLeaderboard(formattedCelebrities);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leaderboards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshCelebrityPicks = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-celebrity-picks');
      
      if (error) throw error;

      toast({
        title: 'Scraping Started',
        description: data.message || `Processing ${data.accounts || 100} celebrity accounts. This will take a few minutes - check back soon!`,
      });

      // Refresh after a delay to show any immediate results
      setTimeout(async () => {
        await loadLeaderboards();
      }, 5000);
    } catch (error) {
      console.error('Error refreshing picks:', error);
      toast({
        title: 'Error',
        description: 'Failed to start celebrity pick scraping',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStreakInfo = (streak: string) => {
    const isWinning = streak.includes('W');
    const streakNumber = parseInt(streak.replace(/[WL]/g, ''));
    const isHotStreak = isWinning && streakNumber >= 5;
    const isColdStreak = !isWinning && streakNumber >= 3;
    
    return {
      isWinning,
      streakNumber,
      isHotStreak,
      isColdStreak,
      isOnFire: streakNumber >= 10 && isWinning,
      isIceCold: streakNumber >= 5 && !isWinning
    };
  };

  const renderLeaderboardList = (data: LeaderboardEntry[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No data available yet</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {data.map((user, index) => {
        const streakInfo = getStreakInfo(user.streak);
        
        return (
          <Card 
            key={user.rank} 
            onClick={() => setSelectedUser(user)}
            className={`p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
              index < 3 ? 'bg-gradient-to-r from-card to-primary/5 border-primary/20' : 'bg-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-accent text-accent-foreground' :
                  index === 1 ? 'bg-primary text-primary-foreground' :
                  index === 2 ? 'bg-destructive text-destructive-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {user.rank}
                </div>
                <Avatar className="w-12 h-12">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg flex items-center gap-2">
                    {user.name}
                    {user.isCelebrity && (
                      <Star className="w-4 h-4 text-accent fill-accent" />
                    )}
                    {streakInfo.isOnFire && (
                      <span className="text-orange-500 animate-pulse" title="On Fire! 🔥">
                        🔥
                      </span>
                    )}
                    {streakInfo.isIceCold && (
                      <span className="text-blue-400" title="Ice Cold ❄️">
                        ❄️
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.winRate} Win Rate • {user.roi} ROI
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-2xl font-bold text-accent">
                    {user.units}
                  </div>
                  <div className="text-sm text-muted-foreground">Units</div>
                </div>
                <div className="flex items-center gap-2">
                  {streakInfo.isHotStreak && !streakInfo.isOnFire && (
                    <Flame className="w-4 h-4 text-orange-500" />
                  )}
                  {streakInfo.isColdStreak && !streakInfo.isIceCold && (
                    <Snowflake className="w-4 h-4 text-blue-400" />
                  )}
                  <Badge 
                    variant={streakInfo.isWinning ? "default" : "destructive"}
                    className={`${
                      streakInfo.isWinning ? 'bg-accent hover:bg-accent/80' : ''
                    } ${
                      streakInfo.isOnFire ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse' :
                      streakInfo.isIceCold ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                      streakInfo.isHotStreak ? 'bg-gradient-to-r from-accent to-orange-400 text-white' :
                      streakInfo.isColdStreak ? 'bg-gradient-to-r from-destructive to-blue-500 text-white' : ''
                    }`}
                  >
                    {user.streak}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Leaderboards
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See where you rank against the best bettors in the community
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
            <TabsTrigger value="public">All Users</TabsTrigger>
            <TabsTrigger value="celebrity" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Celebrities
            </TabsTrigger>
            <TabsTrigger value="football">Football</TabsTrigger>
            <TabsTrigger value="basketball">Basketball</TabsTrigger>
          </TabsList>

          <TabsContent value="public">
            {renderLeaderboardList(userLeaderboard)}
          </TabsContent>

          <TabsContent value="celebrity">
            <div className="mb-4 flex justify-end">
              <Button 
                onClick={refreshCelebrityPicks} 
                disabled={refreshing}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating...' : 'Refresh Picks'}
              </Button>
            </div>
            {renderLeaderboardList(celebrityLeaderboard)}
          </TabsContent>

          <TabsContent value="football">
            {renderLeaderboardList(userLeaderboard.slice(1, 7))}
          </TabsContent>

          <TabsContent value="basketball">
            {renderLeaderboardList(userLeaderboard.slice(2, 8))}
          </TabsContent>
        </Tabs>
      </div>

      {/* User Profile / Purchase Modal */}
      <Dialog open={selectedUser !== null} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Unlock Premium Picks</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* User Profile Header */}
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                  <Avatar className="h-20 w-20 border-4 border-primary">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-xl">
                      {selectedUser.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{selectedUser.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        <span className="font-semibold">{selectedUser.units}</span> Units
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-accent" />
                        <span className="font-semibold">{selectedUser.winRate}</span> Win Rate
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-accent" />
                        <span className="font-semibold">{selectedUser.roi}</span> ROI
                      </span>
                    </div>
                  </div>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    #{selectedUser.rank}
                  </Badge>
                </div>

                {/* Pricing Options */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Choose Your Plan
                  </h4>
                  
                  <div className="grid gap-4">
                    {/* Daily Picks */}
                    <Card className="p-4 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-lg">Daily Picks</h5>
                          <p className="text-sm text-muted-foreground">Get today's premium picks</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-accent">$4.99</div>
                          <Button className="mt-2">Unlock Now</Button>
                        </div>
                      </div>
                    </Card>

                    {/* Weekly Picks */}
                    <Card className="p-4 hover:border-primary transition-colors cursor-pointer border-2 border-primary">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-lg">Weekly Picks</h5>
                            <Badge variant="default">Popular</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">7 days of winning picks</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-accent">$24.99</div>
                          <Button className="mt-2">Unlock Now</Button>
                        </div>
                      </div>
                    </Card>

                    {/* Monthly Subscription */}
                    <Card className="p-4 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-lg">Monthly VIP</h5>
                            <Badge className="bg-gradient-to-r from-accent to-primary">Best Value</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">All picks + exclusive analysis</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground line-through">$119.99</div>
                          <div className="text-2xl font-bold text-accent">$79.99</div>
                          <Button className="mt-2 bg-gradient-to-r from-accent to-primary">Unlock Now</Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Stats Preview */}
                <div className="p-4 bg-muted rounded-lg">
                  <h5 className="font-semibold mb-3">What You Get:</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                      Real-time pick notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                      Detailed analysis and reasoning
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                      Access to winning streak picks
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                      Money-back guarantee if under 55% win rate
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};