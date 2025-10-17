import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user is authenticated, redirect to dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center p-4 relative">
        {/* Animated background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="text-center space-y-12 max-w-6xl mx-auto relative z-10 animate-fade-in">
          {/* Logo Text */}
          <div className="space-y-6 animate-scale-in">
            <h1 className="text-7xl md:text-8xl lg:text-[12rem] font-logo fade-text-gradient tracking-wider leading-none drop-shadow-2xl">
              FADE
            </h1>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-logo text-foreground tracking-wide">
              Bet Together
            </h2>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 text-lg md:text-xl font-logo">
            <div className="px-6 py-3 rounded-full bg-accent/10 border border-accent/30 text-accent backdrop-blur-sm hover:bg-accent/20 transition-all cursor-default">
              FADE
            </div>
            <div className="px-6 py-3 rounded-full bg-primary/10 border border-primary/30 text-primary backdrop-blur-sm hover:bg-primary/20 transition-all cursor-default">
              FOLLOW
            </div>
            <div className="px-6 py-3 rounded-full bg-gradient-to-r from-accent/10 to-primary/10 border border-white/20 text-foreground backdrop-blur-sm hover:scale-105 transition-all cursor-default">
              CASH
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="text-xl md:text-2xl px-12 md:px-16 py-8 md:py-10 h-auto font-logo tracking-wider fade-gradient hover:opacity-90 transition-all duration-300 hover:scale-110 fade-glow shadow-2xl"
            >
              GET STARTED
            </Button>
          </div>

          {/* Social Proof */}
          <div className="pt-12 space-y-4">
            <p className="text-muted-foreground text-sm uppercase tracking-widest">
              Join thousands of bettors
            </p>
            <div className="flex justify-center items-center gap-8 text-2xl md:text-3xl font-logo">
              <div className="text-center">
                <div className="text-accent">10K+</div>
                <div className="text-xs text-muted-foreground">PICKS</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-primary">5K+</div>
                <div className="text-xs text-muted-foreground">USERS</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="fade-text-gradient">95%</div>
                <div className="text-xs text-muted-foreground">WIN RATE</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
