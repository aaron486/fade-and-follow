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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center space-y-12 max-w-6xl mx-auto animate-fade-in">
        {/* Logo Text */}
        <div className="space-y-4 animate-scale-in">
          <h1 className="text-8xl md:text-9xl lg:text-[14rem] font-logo fade-text-gradient tracking-wider leading-none">
            FADE
          </h1>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-logo text-foreground tracking-wide">
            Bet Together
          </h2>
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

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-muted-foreground pt-8 tracking-widest uppercase font-logo">
          fade • follow • Cash
        </p>
      </div>
    </div>
  );
};

export default Index;
