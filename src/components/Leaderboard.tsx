import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Snowflake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url?: string;
  units: string;
  streak: string;
  winRate: string;
  roi: string;
}

export const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("public");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboardData(activeTab);
  }, [activeTab]);

  const loadLeaderboardData = async (tab: string) => {
    setLoading(true);
    try {
      let query = supabase
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
        .limit(20);

      // For sport-specific tabs, we need to filter by sport
      // This would require joining with bets table, but for now we'll show all
      
      const { data, error } = await query;

      if (error) throw error;

      const formatted: LeaderboardEntry[] = (data || []).map((entry: any, index: number) => {
        const totalBets = entry.wins + entry.losses + entry.pushes;
        const winRate = totalBets > 0 ? ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(0) : "0";
        const unitsWon = Number(entry.units_won) || 0;
        const roi = totalBets > 0 ? ((unitsWon / totalBets) * 100).toFixed(1) : "0.0";
        
        const streak = entry.current_streak;
        const streakStr = streak > 0 ? `${Math.abs(streak)}W` : streak < 0 ? `${Math.abs(streak)}L` : "0";
        
        return {
          rank: index + 1,
          user_id: entry.user_id,
          name: entry.profiles?.display_name || entry.profiles?.username || "Anonymous",
          avatar_url: entry.profiles?.avatar_url,
          units: unitsWon >= 0 ? `+${unitsWon.toFixed(1)}` : unitsWon.toFixed(1),
          streak: streakStr,
          winRate: `${winRate}%`,
          roi: `${Number(roi) >= 0 ? '+' : ''}${roi}%`
        };
      });

      setLeaderboardData(formatted);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No betting data available yet. Start tracking your bets!
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {data.map((user, index) => {
        const streakInfo = getStreakInfo(user.streak);
        
        return (
          <Card key={user.rank} className={`p-6 transition-all duration-300 hover:scale-[1.02] ${
            index < 3 ? 'bg-gradient-to-r from-card to-primary/5 border-primary/20' : 'bg-card'
          }`}>
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
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg flex items-center gap-2">
                    {user.name}
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
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
            <TabsTrigger value="public">Public</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
            <TabsTrigger value="celebrity">Celebrity</TabsTrigger>
            <TabsTrigger value="football">Football</TabsTrigger>
            <TabsTrigger value="basketball">Basketball</TabsTrigger>
            <TabsTrigger value="props">Props</TabsTrigger>
          </TabsList>

          <TabsContent value="public">
            {renderLeaderboardList(leaderboardData)}
          </TabsContent>

          <TabsContent value="private">
            {renderLeaderboardList(leaderboardData)}
          </TabsContent>

          <TabsContent value="celebrity">
            {renderLeaderboardList(leaderboardData)}
          </TabsContent>

          <TabsContent value="football">
            {renderLeaderboardList(leaderboardData)}
          </TabsContent>

          <TabsContent value="basketball">
            {renderLeaderboardList(leaderboardData)}
          </TabsContent>

          <TabsContent value="props">
            {renderLeaderboardList(leaderboardData)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};