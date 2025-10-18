import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check } from 'lucide-react';
import { useAuth, emailSchema, passwordSchema, usernameSchema } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import fadeLogo from "@/assets/fade-logo.png";
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  mascot: string;
  logo_url: string | null;
  league: string;
  sport: string;
}

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [signupStep, setSignupStep] = useState<'credentials' | 'teams'>('credentials');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Rate limiting
  const lastSubmitRef = useRef<number>(0);
  const SUBMIT_COOLDOWN = 2000; // 2 seconds between attempts

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
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

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('league', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      toast({
        title: "Error Loading Teams",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingTeams(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(true) || !checkRateLimit()) {
      return;
    }
    
    setLoading(true);
    setValidationErrors({});
    
    try {
      const result = await signUp({
        email,
        password,
        username: username || email.split('@')[0],
      });
      
      if (!result.error) {
        // Move to team selection immediately - auth state will update naturally
        setSignupStep('teams');
        fetchTeams();
      }
    } catch (error) {
      // Error is handled by auth context
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelectionComplete = async () => {
    if (selectedTeams.length === 0) {
      toast({
        title: "Select at least one team",
        description: "Choose your favorite team(s) to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use the user from auth context
      if (!user?.id) {
        toast({
          title: "Authentication Error",
          description: "Please sign in and try again",
          variant: "destructive",
        });
        setSignupStep('credentials');
        return;
      }

      // Only update favorite_teams - profile already created by trigger
      const { error } = await supabase
        .from('profiles')
        .update({ 
          favorite_teams: selectedTeams
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving teams:', error);
        throw error;
      }

      toast({
        title: "Teams Saved!",
        description: `You've selected ${selectedTeams.length} team${selectedTeams.length !== 1 ? 's' : ''}`,
      });

      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast({
        title: "Error Saving Teams",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTeams = () => {
    navigate('/dashboard', { replace: true });
  };

  // Team selection grouping
  const groupedTeams = teams.reduce((acc, team) => {
    const key = `${team.sport} - ${team.league}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  // Show team selection step during signup
  if (signupStep === 'teams') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <img src={fadeLogo} alt="FADE" className="h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Pick Your Teams</h1>
            <p className="text-muted-foreground">
              Select as many favorite teams as you want to personalize your feed
            </p>
            <p className="text-sm text-primary font-medium mt-2">
              ✓ Select unlimited teams • ✓ Multi-sport support
            </p>
            {selectedTeams.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {loadingTeams ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="space-y-8 mb-8">
                {Object.entries(groupedTeams).map(([category, categoryTeams]) => (
                  <div key={category}>
                    <h2 className="text-lg font-semibold mb-4 text-foreground/80">
                      {category}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {categoryTeams.map((team) => (
                        <Card
                          key={team.id}
                          onClick={() => toggleTeam(team.id)}
                          className={`
                            relative cursor-pointer transition-all duration-200 hover:scale-105
                            ${selectedTeams.includes(team.id) 
                              ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                              : 'hover:shadow-md'
                            }
                          `}
                        >
                          <div className="p-4 flex flex-col items-center text-center gap-3">
                            {selectedTeams.includes(team.id) && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                            
                            {team.logo_url ? (
                              <img 
                                src={team.logo_url} 
                                alt={team.name}
                                className="h-16 w-16 object-contain"
                              />
                            ) : (
                              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-muted-foreground">
                                  {team.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            
                            <div className="space-y-1">
                              <p className="font-semibold text-sm leading-tight">
                                {team.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {team.mascot}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {teams.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No teams available at the moment.</p>
                </div>
              )}

              <div className="flex gap-4 justify-center sticky bottom-6 mt-8">
                <Button
                  variant="outline"
                  onClick={handleSkipTeams}
                  disabled={loading}
                  size="lg"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleTeamSelectionComplete}
                  disabled={loading || selectedTeams.length === 0}
                  size="lg"
                >
                  {loading ? 'Saving...' : `Continue with ${selectedTeams.length} team${selectedTeams.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden flex items-center justify-center p-4 relative">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-logo fade-text-gradient mb-4 tracking-wider">FADE</h1>
          <p className="text-muted-foreground text-lg">Bet Together</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card className="backdrop-blur-sm bg-card/80 border-border/50">
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
                    className="w-full fade-gradient hover:opacity-90 transition-all"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card className="backdrop-blur-sm bg-card/80 border-border/50">
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
                    className="w-full fade-gradient hover:opacity-90 transition-all"
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
