import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Snowflake, Lock, TrendingUp, Target, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [selectedUser, setSelectedUser] = useState<typeof mockLeaderboardData[0] | null>(null);

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