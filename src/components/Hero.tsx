import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="FADE sports betting platform dashboard"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black fade-text-gradient animate-fade-pulse">
              FADE
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              The social sports betting platform where your picks matter and your streak speaks louder than words
            </p>
          </div>
          
          {/* Key Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="text-2xl font-bold text-accent mb-2">Track</div>
              <p className="text-sm text-muted-foreground">Auto-sync your bets with BetSync technology</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="text-2xl font-bold text-primary mb-2">Compare</div>
              <p className="text-sm text-muted-foreground">See how you stack up against influencers and friends</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="text-2xl font-bold text-accent mb-2">Compete</div>
              <p className="text-sm text-muted-foreground">Join leaderboards and prove your betting prowess</p>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="fade-gradient fade-glow text-lg px-8 py-6 transition-all duration-300 hover:scale-105">
              Join the Waitlist
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10">
              Watch Demo
            </Button>
          </div>
          
          {/* Social Proof */}
          <div className="pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-4">Trusted by serious bettors</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-2xl font-bold">10K+</div>
              <div className="w-px h-6 bg-border"></div>
              <div className="text-2xl font-bold">$2M+</div>
              <div className="w-px h-6 bg-border"></div>
              <div className="text-2xl font-bold">98%</div>
            </div>
            <div className="flex justify-center items-center space-x-8 text-xs text-muted-foreground mt-2">
              <div>Early Users</div>
              <div className="w-px h-4 bg-border"></div>
              <div>Tracked Volume</div>
              <div className="w-px h-4 bg-border"></div>
              <div>Accuracy Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};