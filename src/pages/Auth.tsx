import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, User, Settings, Users, Globe, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [state, setState] = useState('');
  const [preferredSportsbook, setPreferredSportsbook] = useState('');
  const [bettorLevel, setBettorLevel] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Major sportsbooks list
  const sportsbooks = [
    'DraftKings',
    'FanDuel', 
    'ESPN BET',
    'BetMGM',
    'Caesars',
    'bet365',
    'PointsBet',
    'WynnBET',
    'Barstool Sportsbook',
    'Hard Rock Bet',
    'Other'
  ];

  // Bettor level options
  const bettorLevels = [
    { value: 'handicapper', label: 'Handicapper', description: 'Professional sports bettor' },
    { value: 'social', label: 'Social', description: 'Casual betting with friends' },
    { value: 'new', label: 'New', description: 'Just getting started' }
  ];

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
      // Use replace to avoid adding to history
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Fetch teams for selection
  useEffect(() => {
    const fetchTeams = async () => {
      setTeamsLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, league, sport, logo_url')
        .order('sport')
        .order('league')
        .order('name');
      
      if (!error && data) {
        setTeams(data);
      }
      setTeamsLoading(false);
    };

    fetchTeams();
  }, []);

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
        return email && password && username && favoriteTeam;
      case 2: // Preferences step
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
      navigate('/dashboard', { replace: true });
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    let avatarUrl = '';
    
    // Upload avatar if provided
    if (avatarFile) {
      try {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
        
        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
      }
    }
    
    const { error } = await signUp({
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
    });
    
    setLoading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Create Your Account</h2>
              <p className="text-muted-foreground">Set up your FADE account and select your favorite team</p>
            </div>
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden bg-muted">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">Optional: Upload a profile picture (max 5MB)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="favorite-team">Favorite Team</Label>
              <Select value={favoriteTeam} onValueChange={setFavoriteTeam} required>
                <SelectTrigger>
                  <SelectValue placeholder={teamsLoading ? "Loading teams..." : "Select your favorite team"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        {team.logo_url && (
                          <img 
                            src={team.logo_url} 
                            alt={team.name} 
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span>{team.name}</span>
                        <span className="text-muted-foreground text-sm">({team.league})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Betting Preferences</h2>
              <p className="text-muted-foreground">Tell us about your betting style and preferences</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred-sportsbook">Preferred Sportsbook</Label>
              <Select value={preferredSportsbook} onValueChange={setPreferredSportsbook}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select your preferred sportsbook" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {sportsbooks.map((sportsbook) => (
                    <SelectItem key={sportsbook} value={sportsbook}>
                      {sportsbook}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bettor-level">Level of Bettor</Label>
              <Select value={bettorLevel} onValueChange={setBettorLevel}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select your betting level" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {bettorLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{level.label}</span>
                        <span className="text-sm text-muted-foreground">{level.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok-url">TikTok (Optional)</Label>
              <Input
                id="tiktok-url"
                type="url"
                placeholder="https://tiktok.com/@yourusername"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="x-url">X (Twitter) (Optional)</Label>
              <Input
                id="x-url"
                type="url"
                placeholder="https://x.com/yourusername"
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discord-url">Discord (Optional)</Label>
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
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
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

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Join FADE</CardTitle>
                  <CardDescription>Create your account to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setIsSignUp(true)}
                    className="w-full"
                  >
                    Start Registration
                  </Button>
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