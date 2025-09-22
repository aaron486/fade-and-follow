import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake } from "lucide-react";

const mockLeaderboardData = [
  { rank: 1, name: "BetKing92", units: "+47.2", streak: "8W", winRate: "73%", roi: "+12.3%" },
  { rank: 2, name: "SharpShooter", units: "+41.8", streak: "5W", winRate: "69%", roi: "+9.8%" },
  { rank: 3, name: "FadeGod", units: "+38.5", streak: "12W", winRate: "71%", roi: "+11.1%" },
  { rank: 4, name: "PropMaster", units: "+35.2", streak: "3L", winRate: "66%", roi: "+8.2%" },
  { rank: 5, name: "LineHunter", units: "+32.1", streak: "7W", winRate: "68%", roi: "+7.9%" },
  { rank: 6, name: "BankrollBoss", units: "+29.8", streak: "2W", winRate: "64%", roi: "+6.5%" },
  { rank: 7, name: "OddsWizard", units: "+27.3", streak: "1L", winRate: "62%", roi: "+5.8%" },
  { rank: 8, name: "PickGuru", units: "+24.9", streak: "4W", winRate: "65%", roi: "+7.2%" },
];

export const Leaderboard = () => {
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

  return (
    <section className="py-24 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Top Performers This Week
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See where you rank against the best bettors in the community. Every pick counts, every streak matters.
            </p>
          </div>
          
          <div className="grid gap-4">
            {mockLeaderboardData.map((user, index) => {
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
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Think you can climb the ranks? Your journey starts here.
            </p>
            <button className="text-primary hover:text-primary/80 font-semibold underline transition-colors">
              View Full Leaderboard →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};