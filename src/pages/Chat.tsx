import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ChatLayout from '@/components/friends/ChatLayout';
import Navigation from '@/components/Navigation';

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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold fade-text-gradient mb-2">Messages</h1>
          <p className="text-muted-foreground">Chat with your friends</p>
        </div>

        <ChatLayout />
      </div>
    </div>
  );
};

export default Chat;
