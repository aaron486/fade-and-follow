import { Card } from "@/components/ui/card";

const features = [
  {
    title: "BetSync Integration",
    description: "Automatically track all your bets from major sportsbooks like DraftKings, FanDuel, and BetMGM. No manual entry required.",
    icon: "🔄",
    highlight: "Real-time syncing"
  },
  {
    title: "AI-Powered Expert Tracking",
    description: "Follow performance of betting influencers and experts with transparent, real-time records. See who's hot and who's not.",
    icon: "🤖",
    highlight: "Data-driven insights"
  },
  {
    title: "Community",
    description: "Share, track and communicate with all your friends bets in one place.",
    icon: "👥",
    highlight: "Community-driven"
  },
  {
    title: "Premium Picks Marketplace",
    description: "Access expert picks from top performers or sell your own. Follow hot streaks and fade cold streaks with confidence.",
    icon: "💎",
    highlight: "Monetize expertise"
  },
  {
    title: "Real-Time Odds & Data",
    description: "Get the best odds across multiple sportsbooks, track line movements, and see public betting percentages.",
    icon: "📊",
    highlight: "Live market data"
  },
  {
    title: "Skill-Based Props",
    description: "Play PrizePicks-style prop bets with flex play options. Win even when not all picks hit.",
    icon: "🎯",
    highlight: "Flexible wagering"
  }
];

export const Features = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything You Need to Win
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              FADE brings together cutting-edge technology, social features, and market intelligence 
              to give you the ultimate betting advantage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 bg-card hover:bg-card/80 transition-all duration-300 hover:scale-105 group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {feature.highlight}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Card className="p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <h3 className="text-2xl font-bold mb-4">Ready to Start Winning?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of bettors who are already using FADE to track, compare, and compete their way to bigger wins.
              </p>
              <button className="fade-gradient text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 fade-glow">
                Get Early Access
              </button>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};