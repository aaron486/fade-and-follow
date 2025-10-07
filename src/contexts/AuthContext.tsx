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
  avatarUrl?: string;
}

interface UserProfile {
  avatar_url: string | null;
  display_name: string | null;
  username: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  signUp: (data: SignUpData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user profile with debouncing to prevent excessive requests
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, display_name, username')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }
      
      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let profileLoadTimeout: NodeJS.Timeout;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Completely ignore token refresh events
      if (event === 'TOKEN_REFRESHED') {
        return;
      }
      
      console.log('🔐 Auth event:', event);
      
      // Always update session state
      setSession(session);
      setUser(session?.user ?? null);
      
      // Clear any pending profile loads
      if (profileLoadTimeout) {
        clearTimeout(profileLoadTimeout);
      }
      
      // Handle sign in - load profile once after a delay
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        profileLoadTimeout = setTimeout(() => {
          if (mounted && session?.user) {
            loadUserProfile(session.user.id);
          }
        }, 200);
      } 
      // Handle sign out
      else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUserProfile(null);
      }
      // Handle initial session - load profile once
      else if (event === 'INITIAL_SESSION' && session?.user) {
        profileLoadTimeout = setTimeout(() => {
          if (mounted && session?.user) {
            loadUserProfile(session.user.id);
          }
        }, 200);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('❌ Session error:', error);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      if (profileLoadTimeout) {
        clearTimeout(profileLoadTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, username, displayName, favoriteTeam, state, preferredSportsbook, bettorLevel, instagramUrl, tiktokUrl, xUrl, discordUrl, avatarUrl }: SignUpData) => {
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
            discord_url: discordUrl,
            avatar_url: avatarUrl
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
          title: "Account Created!",
          description: "You're all set. Signing you in...",
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};