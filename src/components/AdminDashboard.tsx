import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Users, TrendingUp, Database, Activity, Trash2, UserPlus, Bell, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface User {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  bettor_level: string | null;
}

interface Influencer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  follower_count: number | null;
  is_verified: boolean | null;
}

interface ScrapingJob {
  id: string;
  status: string;
  total_accounts: number;
  processed_accounts: number;
  successful_picks: number;
  failed_accounts: number;
  current_account: string | null;
  started_at: string;
  completed_at: string | null;
}

export const AdminDashboard = () => {
  const [scraping, setScraping] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [currentJob, setCurrentJob] = useState<ScrapingJob | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBets: 0,
    totalInfluencers: 0,
    totalPicks: 0,
  });
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
  });
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    userId: '',
    title: '',
    message: '',
    type: 'system',
    link: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
    loadUsers();
    loadInfluencers();
    loadLatestScrapingJob();
  }, []);

  // Separate effect for polling to avoid dependency issues
  useEffect(() => {
    // Only poll if there's an active running job
    if (currentJob?.status !== 'running') {
      return;
    }
    
    // Poll every 10 seconds instead of 3 to avoid rate limits
    const interval = setInterval(() => {
      loadLatestScrapingJob();
    }, 10000);

    return () => clearInterval(interval);
  }, [currentJob?.status]);

  const loadLatestScrapingJob = async () => {
    try {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setCurrentJob(data);
      }
    } catch (error) {
      console.error('Error loading scraping job:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url, created_at, bettor_level')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadInfluencers = async () => {
    try {
      const { data, error } = await supabase
        .from('public_bettors')
        .select('id, username, display_name, avatar_url, follower_count, is_verified')
        .order('follower_count', { ascending: false })
        .limit(100);

      if (error) throw error;
      setInfluencers(data || []);
    } catch (error) {
      console.error('Error loading influencers:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, betsRes, influencersRes, picksRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bets').select('id', { count: 'exact', head: true }),
        supabase.from('public_bettors').select('id', { count: 'exact', head: true }),
        supabase.from('public_picks').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalBets: betsRes.count || 0,
        totalInfluencers: influencersRes.count || 0,
        totalPicks: picksRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleScrapeCelebrityPicks = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-celebrity-picks');
      
      if (error) throw error;

      toast({
        title: "Scraping Started!",
        description: `Scraping ${stats.totalInfluencers} influencers in the background. This may take several minutes.`,
      });
      
      // Reload job status immediately
      setTimeout(loadLatestScrapingJob, 1000);
    } catch (error) {
      console.error('Error triggering scrape:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start scraping",
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.username) {
      toast({
        title: "Validation Error",
        description: "Email, password, and username are required",
        variant: "destructive",
      });
      return;
    }

    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: newUserData
      });

      if (error) throw error;

      toast({
        title: "User Created!",
        description: `Successfully created user ${newUserData.username}`,
      });

      setNewUserDialog(false);
      setNewUserData({ email: '', password: '', username: '', displayName: '' });
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    setDeletingUser(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      });

      if (error) throw error;

      toast({
        title: "User Deleted",
        description: `Successfully deleted user ${username}`,
      });

      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeletingUser(null);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationData.userId || !notificationData.title || !notificationData.message) {
      toast({
        title: "Validation Error",
        description: "User, title, and message are required",
        variant: "destructive",
      });
      return;
    }

    setSendingNotification(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: notificationData
      });

      if (error) throw error;

      toast({
        title: "📬 Notification Sent!",
        description: `Successfully sent notification to user`,
      });

      setNotificationData({ userId: '', title: '', message: '', type: 'system', link: '' });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setSendingNotification(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your betting platform</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Activity className="mr-2 h-4 w-4" />
          Admin
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Influencers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInfluencers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celebrity Picks</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPicks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Users and Influencers */}
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scrape Celebrity Picks</CardTitle>
                <CardDescription>
                  Fetch latest picks from all {stats.totalInfluencers} influencers on Twitter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleScrapeCelebrityPicks}
                  disabled={scraping || currentJob?.status === 'running'}
                  className="w-full"
                >
                  {scraping || currentJob?.status === 'running' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Start Scraping
                    </>
                  )}
                </Button>
                
                {currentJob && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={currentJob.status === 'completed' ? 'default' : 'secondary'}>
                        {currentJob.status}
                      </Badge>
                    </div>
                    
                    {currentJob.status === 'running' && currentJob.current_account && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Processing:</span>
                        <span className="ml-2 font-medium">{currentJob.current_account}</span>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-medium">
                          {currentJob.processed_accounts} / {currentJob.total_accounts}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${currentJob.total_accounts > 0 
                              ? (currentJob.processed_accounts / currentJob.total_accounts) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Picks found:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {currentJob.successful_picks}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failed:</span>
                        <span className="ml-2 font-medium text-red-600">
                          {currentJob.failed_accounts}
                        </span>
                      </div>
                    </div>
                    
                    {currentJob.completed_at && (
                      <div className="text-xs text-muted-foreground">
                        Completed {new Date(currentJob.completed_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Edge functions and automation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bet Settlement</span>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Celebrity Scraper</span>
                  <Badge variant="outline" className="text-green-600">Ready</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Odds API</span>
                  <Badge variant="outline" className="text-green-600">Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users ({users.length})</CardTitle>
                  <CardDescription>Complete list of registered users</CardDescription>
                </div>
                <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add a new user account to the platform
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <Input
                          id="username"
                          value={newUserData.username}
                          onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                          placeholder="johndoe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserData.password}
                          onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={newUserData.displayName}
                          onChange={(e) => setNewUserData({ ...newUserData, displayName: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewUserDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser} disabled={creatingUser}>
                        {creatingUser ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create User'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(user.display_name || user.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.display_name || user.username || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground truncate">@{user.username || 'no-username'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {user.bettor_level && (
                            <Badge variant="outline" className="mb-1">
                              {user.bettor_level}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingUser === user.user_id}
                            >
                              {deletingUser === user.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.display_name || user.username}? 
                                This action cannot be undone and will permanently delete their account and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.user_id, user.username || 'user')}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="influencers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Influencers ({influencers.length})</CardTitle>
              <CardDescription>Celebrity bettors being tracked</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {influencers.map((influencer) => (
                    <div key={influencer.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={influencer.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {influencer.display_name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{influencer.display_name}</p>
                          {influencer.is_verified && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">@{influencer.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{influencer.follower_count?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-muted-foreground">followers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
              <CardDescription>
                Send real-time notifications to users (push + toast)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification-user">Select User *</Label>
                <Select
                  value={notificationData.userId}
                  onValueChange={(value) => setNotificationData({ ...notificationData, userId: value })}
                >
                  <SelectTrigger id="notification-user">
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.display_name || user.username || 'Unknown'} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-type">Notification Type</Label>
                <Select
                  value={notificationData.type}
                  onValueChange={(value) => setNotificationData({ ...notificationData, type: value })}
                >
                  <SelectTrigger id="notification-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">🔔 System</SelectItem>
                    <SelectItem value="admin">👑 Admin</SelectItem>
                    <SelectItem value="bet_settlement">💰 Bet Settlement</SelectItem>
                    <SelectItem value="friend_request">👥 Friend Request</SelectItem>
                    <SelectItem value="message">💬 Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-title">Title *</Label>
                <Input
                  id="notification-title"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                  placeholder="Important Announcement"
                  maxLength={60}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-message">Message *</Label>
                <Textarea
                  id="notification-message"
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                  placeholder="Your notification message here..."
                  rows={4}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {notificationData.message.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-link">Link (Optional)</Label>
                <Input
                  id="notification-link"
                  value={notificationData.link}
                  onChange={(e) => setNotificationData({ ...notificationData, link: e.target.value })}
                  placeholder="/bets or /profile"
                />
                <p className="text-xs text-muted-foreground">
                  Optional link for "View" button in notification
                </p>
              </div>

              <Button 
                onClick={handleSendNotification} 
                disabled={sendingNotification}
                className="w-full"
              >
                {sendingNotification ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Preview:</h4>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="font-semibold">{notificationData.title || 'Notification Title'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notificationData.message || 'Your message will appear here...'}
                  </p>
                  {notificationData.link && (
                    <Button variant="link" size="sm" className="mt-2 px-0">
                      View →
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
