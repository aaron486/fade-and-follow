import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import BettingFeed from "@/components/BettingFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { Footer } from "@/components/Footer";

const Index = () => {
  const { user, loading } = useAuth();

  // If user is authenticated, redirect to dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Live Betting Feed</h2>
            <p className="text-muted-foreground">See what the community is betting on right now</p>
          </div>
          <BettingFeed />
        </section>
        <Leaderboard />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
