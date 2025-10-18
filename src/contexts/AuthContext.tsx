import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation schemas
export const emailSchema = z.string().email('Invalid email address').max(255);
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(72);
export const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

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
  
  // Refs to prevent duplicate operations
  const profileLoadingRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  // Load user profile with proper error handling and duplicate prevention
  const loadUserProfile = async (userId: string) => {
    // Prevent duplicate loads
    if (profileLoadingRef.current.has(userId)) {
      return;
    }

    profileLoadingRef.current.add(userId);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, display_name, username')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile load error:', error.message);
        return;
      }
      
      if (data && mountedRef.current) {
        setUserProfile(data);
      }
    } catch (error: any) {
      console.error('Profile load exception:', error.message);
    } finally {
      profileLoadingRef.current.delete(userId);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Initialize session
    let currentSession: Session | null = null;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session init error:', error.message);
        }
        
        if (initialSession && mountedRef.current) {
          currentSession = initialSession;
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Load profile asynchronously
          setTimeout(() => {
            if (mountedRef.current && initialSession.user) {
              loadUserProfile(initialSession.user.id);
            }
          }, 100);
        }
      } catch (error: any) {
        console.error('Auth init error:', error.message);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth listener - CRITICAL: Keep this synchronous
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mountedRef.current) return;
      
      // Ignore TOKEN_REFRESHED events completely - they happen automatically
      if (event === 'TOKEN_REFRESHED') {
        return;
      }
      
      // Handle sign in/out events
      if (event === 'SIGNED_IN' && newSession) {
        currentSession = newSession;
        setSession(newSession);
        setUser(newSession.user);
        
        // Load profile async
        setTimeout(() => {
          if (mountedRef.current && newSession.user) {
            loadUserProfile(newSession.user.id);
          }
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        currentSession = null;
        setSession(null);
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ 
    email, 
    password, 
    username, 
    displayName, 
    favoriteTeam, 
    state, 
    preferredSportsbook, 
    bettorLevel, 
    instagramUrl, 
    tiktokUrl, 
    xUrl, 
    discordUrl, 
    avatarUrl 
  }: SignUpData) => {
    try {
      // Validate inputs
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        const error = { message: emailResult.error.issues[0].message };
        toast({
          title: "Invalid Email",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        const error = { message: passwordResult.error.issues[0].message };
        toast({
          title: "Invalid Password",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      if (username) {
        const usernameResult = usernameSchema.safeParse(username);
        if (!usernameResult.success) {
          const error = { message: usernameResult.error.issues[0].message };
          toast({
            title: "Invalid Username",
            description: error.message,
            variant: "destructive",
          });
          return { error };
        }
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username?.trim(),
            display_name: displayName?.trim() || username?.trim(),
            favorite_team: favoriteTeam,
            state: state?.trim(),
            preferred_sportsbook: preferredSportsbook,
            bettor_level: bettorLevel,
            instagram_url: instagramUrl?.trim(),
            tiktok_url: tiktokUrl?.trim(),
            x_url: xUrl?.trim(),
            discord_url: discordUrl?.trim(),
            avatar_url: avatarUrl
          }
        }
      });

      if (error) {
        // Handle specific errors
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        }
        
        toast({
          title: "Sign Up Error",
          description: errorMessage,
          variant: "destructive",
        });
        return { error: { ...error, message: errorMessage } };
      }

      toast({
        title: "Account Created!",
        description: "You're all set. Signing you in...",
      });

      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      toast({
        title: "Sign Up Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: { message: errorMessage } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Validate inputs
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        const error = { message: emailResult.error.issues[0].message };
        toast({
          title: "Invalid Email",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        const error = { message: passwordResult.error.issues[0].message };
        toast({
          title: "Invalid Password",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Handle specific errors
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before signing in.';
        }
        
        toast({
          title: "Sign In Error",
          description: errorMessage,
          variant: "destructive",
        });
        return { error: { ...error, message: errorMessage } };
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      toast({
        title: "Sign In Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: { message: errorMessage } };
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
      console.error('Sign out error:', error.message);
      toast({
        title: "Sign Out Error",
        description: 'Failed to sign out. Please try again.',
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
