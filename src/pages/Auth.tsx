import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, User, Settings, Users, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [state, setState] = useState('');
  const [preferredSportsbook, setPreferredSportsbook] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    { 
      id: 'instagram', 
      title: 'Instagram Handle', 
      description: 'Connect with your Instagram',
      icon: Globe
    },
    { 
      id: 'account', 
      title: 'Account Setup', 
      description: 'Create your FADE account',
      icon: User
    },
    { 
      id: 'personal', 
      title: 'Personal Info', 
      description: 'Tell us about yourself',
      icon: Settings
    },
    { 
      id: 'preferences', 
      title: 'Betting Preferences', 
      description: 'Your betting setup',
      icon: Users
    }
  ];

  const totalSteps = steps.length;

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0: // Instagram step
        return instagramUrl.trim() !== '';
      case 1: // Account step
        return email && password && username;
      case 2: // Personal info step
        return true; // All fields are optional in personal step
      case 3: // Preferences step
        return true; // All fields are optional
      default:
        return true;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp({
      email,
      password,
      username,
      displayName,
      favoriteTeam,
      state,
      preferredSportsbook,
      instagramUrl,
      tiktokUrl,
      xUrl,
      discordUrl
    });
    
    setLoading(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">What's your Instagram handle?</h2>
              <p className="text-muted-foreground">Connect with other bettors in the community</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram-handle">Instagram Handle</Label>
              <Input
                id="instagram-handle"
                type="text"
                placeholder="@yourusername"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                required
                className="text-center text-lg py-4"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                type="text"
                placeholder="How others will see you"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="favorite-team">Favorite Team</Label>
              <Input
                id="favorite-team"
                type="text"
                placeholder="Your favorite sports team"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                type="text"
                placeholder="Your state (e.g., CA, NY, TX)"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-sportsbook">Preferred Sportsbook</Label>
              <Input
                id="preferred-sportsbook"
                type="text"
                placeholder="Your go-to sportsbook (e.g., DraftKings, FanDuel)"
                value={preferredSportsbook}
                onChange={(e) => setPreferredSportsbook(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok-url">TikTok</Label>
              <Input
                id="tiktok-url"
                type="url"
                placeholder="https://tiktok.com/@yourusername"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="x-url">X (Twitter)</Label>
              <Input
                id="x-url"
                type="url"
                placeholder="https://x.com/yourusername"
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discord-url">Discord</Label>
              <Input
                id="discord-url"
                type="text"
                placeholder="your_discord_username#1234"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors cursor-pointer ${
                  isActive 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : isCompleted 
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <Icon size={16} />
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`w-8 h-0.5 mx-2 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`} 
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isSignUp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold fade-text-gradient mb-2">FADE</h1>
            <p className="text-muted-foreground">Join the ultimate betting community</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup" onClick={() => setIsSignUp(true)}>Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to your FADE account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
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
                      />
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
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold fade-text-gradient mb-2">FADE</h1>
          <p className="text-muted-foreground">Let's get you set up</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsSignUp(false)}
            className="mt-2"
          >
            ← Back to Sign In
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep].icon, { size: 24 })}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
            <Progress value={((currentStep + 1) / totalSteps) * 100} className="mt-4" />
          </CardHeader>
          <CardContent>
            {renderStepIndicator()}
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {renderStepContent()}
              
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                
                {currentStep === totalSteps - 1 ? (
                  <Button
                    type="button"
                    onClick={handleSignUp}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedToNextStep()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;