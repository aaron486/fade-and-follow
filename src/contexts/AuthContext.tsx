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
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let refreshCount = 0;
    const MAX_REFRESHES = 5;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Prevent infinite refresh loops
      if (event === 'TOKEN_REFRESHED') {
        refreshCount++;
        if (refreshCount > MAX_REFRESHES) {
          console.warn('⚠️ Too many token refreshes, stopping to prevent loop');
          return;
        }
      }
      
      console.log('🔐 Auth event:', event);
      
      // Only synchronous state updates
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        refreshCount = 0; // Reset counter on successful sign in
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        refreshCount = 0;
      }
    });

    // THEN check for existing session (only once)
    if (!isInitialized) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setIsInitialized(true);
          
          if (session) {
            console.log('✅ Session restored:', session.user.email);
          }
        }
      }).catch((error) => {
        console.error('❌ Session restore error:', error);
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isInitialized]);

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