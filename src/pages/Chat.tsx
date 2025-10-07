import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ChatLayout from '@/components/friends/ChatLayout';
import Navigation from '@/components/Navigation';
import LiveOddsBar from '@/components/LiveOddsBar';

const Chat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Live Odds Bar */}
      <div className="border-b border-border">
        <LiveOddsBar />
      </div>

      {/* Chat Layout - Full Screen */}
      <div className="flex-1 overflow-hidden">
        <ChatLayout />
      </div>
    </div>
  );
};

export default Chat;
