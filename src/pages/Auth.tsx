import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { useAuth, emailSchema, passwordSchema, usernameSchema } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import fadeLogo from "@/assets/fade-logo.png";
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Rate limiting
  const lastSubmitRef = useRef<number>(0);
  const SUBMIT_COOLDOWN = 2000; // 2 seconds between attempts

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      // Check if user has selected teams
      const checkTeamSelection = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('favorite_teams')
          .eq('user_id', user.id)
          .single();
        
        // If no teams selected, redirect to team selection
        if (!data?.favorite_teams || data.favorite_teams.length === 0) {
          navigate('/select-teams', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      };
      
      checkTeamSelection();
    }
  }, [user, navigate]);

  const validateForm = (isSignup: boolean): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      errors.email = emailResult.error.issues[0].message;
    }

    // Password validation
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      errors.password = passwordResult.error.issues[0].message;
    }

    // Username validation (optional for signup)
    if (isSignup && username) {
      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) {
        errors.username = usernameResult.error.issues[0].message;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN) {
      toast({
        title: "Too Fast!",
        description: "Please wait a moment before trying again.",
        variant: "destructive",
      });
      return false;
    }
    lastSubmitRef.current = now;
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(false) || !checkRateLimit()) {
      return;
    }
    
    setLoading(true);
    setValidationErrors({});
    
    try {
      await signIn(email, password);
    } catch (error) {
      // Error is handled by auth context
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(true) || !checkRateLimit()) {
      return;
    }
    
    setLoading(true);
    setValidationErrors({});
    
    try {
      await signUp({
        email,
        password,
        username: username || email.split('@')[0], // Use email prefix if no username provided
      });
    } catch (error) {
      // Error is handled by auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={fadeLogo} alt="FADE" className="h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Welcome to FADE</h1>
          <p className="text-muted-foreground">Social sports betting platform</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={validationErrors.email ? "border-destructive" : ""}
                    />
                    {validationErrors.email && (
                      <div className="flex items-center gap-1 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{validationErrors.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={validationErrors.password ? "border-destructive" : ""}
                    />
                    {validationErrors.password && (
                      <div className="flex items-center gap-1 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{validationErrors.password}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Get started in seconds - just email and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">
                      Username <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={validationErrors.username ? "border-destructive" : ""}
                    />
                    {validationErrors.username && (
                      <div className="flex items-center gap-1 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{validationErrors.username}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use your email as username
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className={validationErrors.password ? "border-destructive" : ""}
                    />
                    {validationErrors.password && (
                      <div className="flex items-center gap-1 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{validationErrors.password}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      At least 6 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={validationErrors.email ? "border-destructive" : ""}
                    />
                    {validationErrors.email && (
                      <div className="flex items-center gap-1 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{validationErrors.email}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    You'll be able to add your profile details, favorite teams, and social links after signing up
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
