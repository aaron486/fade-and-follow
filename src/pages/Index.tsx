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
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Button 
        onClick={() => navigate('/auth')}
        variant="outline"
        className="text-white border-white hover:bg-white hover:text-black text-4xl px-12 py-8 h-auto font-bold"
      >
        FADE - Bet Together
      </Button>
    </div>
  );
};

export default Index;
