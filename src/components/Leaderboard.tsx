import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Snowflake } from "lucide-react";

const mockLeaderboardData = [
  { rank: 1, name: "Aaron Hackett", units: "+52.8", streak: "10W", winRate: "78%", roi: "+15.2%" },
  { rank: 2, name: "Samir Bouhmaid", units: "+47.2", streak: "8W", winRate: "73%", roi: "+12.3%" },
  { rank: 3, name: "George Cemovich", units: "+41.8", streak: "5W", winRate: "69%", roi: "+9.8%" },
  { rank: 4, name: "Anthony Hackett", units: "+38.5", streak: "12W", winRate: "71%", roi: "+11.1%" },
  { rank: 5, name: "Dave Portnoy", units: "+35.2", streak: "3L", winRate: "66%", roi: "+8.2%" },
  { rank: 6, name: "Lee Corso", units: "+32.1", streak: "7W", winRate: "68%", roi: "+7.9%" },
  { rank: 7, name: "Urban Meyer", units: "+29.8", streak: "2W", winRate: "64%", roi: "+6.5%" },
  { rank: 8, name: "Speedy Laroche", units: "+27.3", streak: "4W", winRate: "62%", roi: "+5.8%" },
];

export const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("public");

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

  const renderLeaderboardList = (data: typeof mockLeaderboardData) => (
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
            {renderLeaderboardList(mockLeaderboardData)}
          </TabsContent>

          <TabsContent value="private">
            {renderLeaderboardList(mockLeaderboardData.slice(0, 5))}
          </TabsContent>

          <TabsContent value="celebrity">
            {renderLeaderboardList(mockLeaderboardData.slice(0, 6))}
          </TabsContent>

          <TabsContent value="football">
            {renderLeaderboardList(mockLeaderboardData.slice(1, 7))}
          </TabsContent>

          <TabsContent value="basketball">
            {renderLeaderboardList(mockLeaderboardData.slice(2, 8))}
          </TabsContent>

          <TabsContent value="props">
            {renderLeaderboardList(mockLeaderboardData.slice(0, 7))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};