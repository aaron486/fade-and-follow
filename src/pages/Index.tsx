import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import fadeLogo from "@/assets/fade-logo.png";

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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-4xl mx-auto animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center animate-scale-in">
          <img 
            src={fadeLogo} 
            alt="FADE" 
            className="h-48 md:h-64 lg:h-80 hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Headline */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-logo fade-text-gradient tracking-wider leading-none">
            Bet Together
          </h1>
          <p className="text-2xl md:text-3xl lg:text-4xl text-muted-foreground font-light">
            The social sports betting platform where friends fade or follow
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            className="text-lg md:text-xl px-8 md:px-12 py-6 md:py-8 h-auto font-semibold fade-gradient hover:opacity-90 transition-all duration-300 hover:scale-105 fade-glow"
          >
            Get Started
          </Button>
        </div>

        {/* Subtle tagline */}
        <p className="text-sm text-muted-foreground pt-8">
          Track picks • Follow friends • Build your record
        </p>
      </div>
    </div>
  );
};

export default Index;
