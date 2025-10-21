import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";

const Documentation = () => {
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <h1 className="text-4xl font-bold">Fade - Core Functions Documentation</h1>
        <Button onClick={handleExportPDF} className="gap-2">
          <FileDown className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      <div className="space-y-8">
        {/* Edge Functions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Supabase Edge Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">1. admin-create-user</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Allows admins to create new users with auto-confirmed emails</p>
              <p className="text-muted-foreground mb-2"><strong>Auth:</strong> Requires admin role verification</p>
              <p className="text-muted-foreground mb-2"><strong>Input:</strong> email, password, username, displayName (optional)</p>
              <p className="text-muted-foreground"><strong>Output:</strong> Created user object with id, email, username</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">2. admin-delete-user</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Allows admins to delete users (cannot delete self)</p>
              <p className="text-muted-foreground mb-2"><strong>Auth:</strong> Requires admin role verification</p>
              <p className="text-muted-foreground mb-2"><strong>Input:</strong> userId</p>
              <p className="text-muted-foreground"><strong>Output:</strong> Success message</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">3. send-notification</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Sends in-app notifications to users</p>
              <p className="text-muted-foreground mb-2"><strong>Auth:</strong> Users can send to self; admins can send to anyone</p>
              <p className="text-muted-foreground mb-2"><strong>Input:</strong> userId, title, message, type (system/admin/bet_settlement/friend_request/message), link (optional)</p>
              <p className="text-muted-foreground"><strong>Output:</strong> Created notification object</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">4. get-betting-odds</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Fetches live betting odds and scores from The Odds API</p>
              <p className="text-muted-foreground mb-2"><strong>Auth:</strong> Public access</p>
              <p className="text-muted-foreground mb-2"><strong>Input:</strong> sport (optional, defaults to 'upcoming')</p>
              <p className="text-muted-foreground"><strong>Output:</strong> Array of events with odds and live scores (max 20 events, sorted by live status)</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">5. settle-bets</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Automatically settles pending bets based on game results</p>
              <p className="text-muted-foreground mb-2"><strong>Auth:</strong> Public access (called by cron)</p>
              <p className="text-muted-foreground mb-2"><strong>Input:</strong> None</p>
              <p className="text-muted-foreground mb-2"><strong>Output:</strong> Number of bets settled</p>
              <p className="text-muted-foreground"><strong>Logic:</strong> Fetches completed games from past 3 days, matches with pending bets, calculates outcomes for Spread/Moneyline/Total markets</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">6. generate-feed</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Generates personalized AI betting insights for users</p>
              <p className="text-muted-foreground mb-2"><strong>Auth:</strong> Public access</p>
              <p className="text-muted-foreground mb-2"><strong>Input:</strong> userId</p>
              <p className="text-muted-foreground mb-2"><strong>Output:</strong> Array of AI-generated feed items with betting picks</p>
              <p className="text-muted-foreground"><strong>Logic:</strong> Uses user profile, betting history, and stats to generate personalized content via Lovable AI API</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">7. scrape-sports-news</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Scrapes sports betting news and extracts insights using AI</p>
              <p className="text-muted-foreground mb-2"><strong>Auth:</strong> Public access (called by cron)</p>
              <p className="text-muted-foreground mb-2"><strong>Input:</strong> None</p>
              <p className="text-muted-foreground mb-2"><strong>Output:</strong> Number of feed items created</p>
              <p className="text-muted-foreground"><strong>Logic:</strong> Fetches from predefined news sources, uses AI to extract betting insights, saves to feed_items table</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">8. scrape-celebrity-picks</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Scrapes celebrity/influencer betting picks from social media</p>
              <p className="text-muted-foreground mb-2"><strong>Auth:</strong> Public access (called by cron)</p>
              <p className="text-muted-foreground mb-2"><strong>Input:</strong> None (optional mode parameter)</p>
              <p className="text-muted-foreground mb-2"><strong>Output:</strong> Success message with scraping status</p>
              <p className="text-muted-foreground"><strong>Logic:</strong> Uses Nitter to scrape Twitter, AI to extract picks from text/images, saves to public_picks table</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">9. extract-bet-from-image</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Extracts betting slip information from uploaded images using OCR</p>
              <p className="text-muted-foreground mb-2"><strong>Auth:</strong> Public access</p>
              <p className="text-muted-foreground mb-2"><strong>Input:</strong> imageBase64 (base64 encoded image)</p>
              <p className="text-muted-foreground mb-2"><strong>Output:</strong> Structured bet data (teams, odds, amount, sportsbook, etc.)</p>
              <p className="text-muted-foreground"><strong>Logic:</strong> Uses AI vision model for OCR, normalizes team names, detects sportsbook</p>
            </div>
          </CardContent>
        </Card>

        {/* Core Hooks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Core React Hooks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">useIsAdmin</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Checks if current user has admin role</p>
              <p className="text-muted-foreground"><strong>Returns:</strong> {`{ isAdmin: boolean, loading: boolean }`}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">useBetSettlement</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Periodically calls settle-bets function (every 15 minutes)</p>
              <p className="text-muted-foreground"><strong>Returns:</strong> {`{ settleBets: () => Promise<void> }`}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">useRealtimeMessages</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Real-time chat messages subscription for a channel</p>
              <p className="text-muted-foreground"><strong>Returns:</strong> {`{ messages: Message[], loading: boolean }`}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">useTypingIndicator</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Real-time typing status for chat channels</p>
              <p className="text-muted-foreground"><strong>Returns:</strong> {`{ typingUsers: string[], setIsTyping: (typing: boolean) => void }`}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">usePresence</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Real-time presence tracking (online/offline status)</p>
              <p className="text-muted-foreground"><strong>Returns:</strong> {`{ onlineUsers: Set<string> }`}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">usePushNotifications</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Manages push notification subscriptions</p>
              <p className="text-muted-foreground"><strong>Returns:</strong> Registration and permission management functions</p>
            </div>
          </CardContent>
        </Card>

        {/* Database Schema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Core Database Tables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">profiles</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Extended user profile information</p>
              <p className="text-muted-foreground"><strong>Key Fields:</strong> user_id, username, display_name, avatar_url, bio, favorite_teams</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">bets</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Stores all user betting slips</p>
              <p className="text-muted-foreground"><strong>Key Fields:</strong> user_id, home_team, away_team, selection, market, odds, amount, status, sport, image_url</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">notifications</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> In-app notification system</p>
              <p className="text-muted-foreground"><strong>Key Fields:</strong> user_id, title, message, type, read, link</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">channels</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Chat channels (public/group/dm)</p>
              <p className="text-muted-foreground"><strong>Key Fields:</strong> name, chat_type, created_by, is_public</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">messages</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Chat messages with real-time sync</p>
              <p className="text-muted-foreground"><strong>Key Fields:</strong> sender_id, channel_id, content, message_type, image_url</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">user_roles</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Role-based access control</p>
              <p className="text-muted-foreground"><strong>Key Fields:</strong> user_id, role (admin/moderator/user)</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">friendships</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> User friend connections</p>
              <p className="text-muted-foreground"><strong>Key Fields:</strong> user_id, friend_id, status (pending/accepted)</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">feed_items</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> AI-generated and scraped betting content</p>
              <p className="text-muted-foreground"><strong>Key Fields:</strong> title, content, summary, sport, team_ids, source_url</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">public_picks</h3>
              <p className="text-muted-foreground mb-2"><strong>Purpose:</strong> Celebrity/influencer betting picks</p>
              <p className="text-muted-foreground"><strong>Key Fields:</strong> bettor_username, sport, event, selection, odds, confidence</p>
            </div>
          </CardContent>
        </Card>

        {/* Security & RLS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Security Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Row Level Security (RLS)</h3>
              <p className="text-muted-foreground mb-2">All tables have RLS enabled with specific policies:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Users can only view/edit their own data (profiles, bets, notifications)</li>
                <li>Admins have elevated permissions for user management</li>
                <li>Public data (feed_items, public_picks) is readable by all authenticated users</li>
                <li>Chat channels enforce membership-based access control</li>
                <li>Private groups require explicit channel membership</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Authentication</h3>
              <p className="text-muted-foreground">Supabase Auth with JWT tokens, admin role verification via user_roles table</p>
            </div>
          </CardContent>
        </Card>

        {/* API Keys & Environment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Required Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>SUPABASE_URL:</strong> Your Supabase project URL</li>
              <li><strong>SUPABASE_SERVICE_ROLE_KEY:</strong> Service role key for admin operations</li>
              <li><strong>ODDS_API_KEY:</strong> The Odds API key for betting odds</li>
              <li><strong>LOVABLE_API_KEY:</strong> Lovable AI API key for content generation</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default Documentation;