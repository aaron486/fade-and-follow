import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SignUpData {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
  favoriteTeam?: string;
  state?: string;
  preferredSportsbook?: string;
  bettorLevel?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  xUrl?: string;
  discordUrl?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (data: SignUpData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let refreshInterval: ReturnType<typeof setInterval>;

    // Initialize auth - get session once
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          if (session) {
            console.log('✅ Session restored:', session.user.email);
          }
        }
      } catch (error) {
        console.error('❌ Error restoring session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Refresh session periodically (every 30 minutes)
    const keepAlive = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          // Only refresh if token expires in less than 40 minutes
          const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          const fortyMinutes = 40 * 60 * 1000;

          if (timeUntilExpiry < fortyMinutes) {
            console.log('🔄 Refreshing session (expires soon)...');
            await supabase.auth.refreshSession();
          }
        }
      } catch (error) {
        console.error('❌ Error refreshing session:', error);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log('🔔 Auth event:', event);

      // Update state for all events
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Initialize
    initAuth();

    // Keep session alive - check every 30 minutes
    refreshInterval = setInterval(keepAlive, 30 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, username, displayName, favoriteTeam, state, preferredSportsbook, bettorLevel, instagramUrl, tiktokUrl, xUrl, discordUrl }: SignUpData) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            display_name: displayName || username,
            favorite_team: favoriteTeam,
            state,
            preferred_sportsbook: preferredSportsbook,
            bettor_level: bettorLevel,
            instagram_url: instagramUrl,
            tiktok_url: tiktokUrl,
            x_url: xUrl,
            discord_url: discordUrl
          }
        }
      });

      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Check your email for the confirmation link.",
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    signUp,
    signIn,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};