import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { BetForm } from '@/components/BetForm';
import { useToast } from '@/hooks/use-toast';

interface Bet {
  id: string;
  sport: string;
  event_name: string;
  market: string;
  selection: string;
  odds: number;
  stake_units: number;
  status: string;
  notes?: string;
  placed_at: string;
  resolved_at?: string;
}

const Bets = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [showBetForm, setShowBetForm] = useState(false);
  const [loadingBets, setLoadingBets] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    loadUserBets();
    
    // Subscribe to real-time bet updates
    const channel = supabase
      .channel('user-bets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Bet updated:', payload);
          loadUserBets(); // Reload all bets when any bet changes
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loading]);

  const loadUserBets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('placed_at', { ascending: false });

      if (error) throw error;
      setBets(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load bets',
        variant: 'destructive',
      });
    } finally {
      setLoadingBets(false);
    }
  };

  const handleBetCreated = () => {
    setShowBetForm(false);
    loadUserBets();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'win':
        return 'default';
      case 'loss':
        return 'destructive';
      case 'push':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'win':
        return <TrendingUp className="w-4 h-4" />;
      case 'loss':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterBetsByStatus = (status: string) => {
    if (status === 'all') return bets;
    return bets.filter(bet => bet.status === status);
  };

  if (loading || loadingBets) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Bets</h1>
            <p className="text-muted-foreground">Track your betting performance</p>
          </div>
          <Button onClick={() => setShowBetForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Place Bet
          </Button>
        </div>

        {showBetForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Place New Bet</CardTitle>
            </CardHeader>
            <CardContent>
              <BetForm 
                onCancel={() => setShowBetForm(false)}
                onSuccess={handleBetCreated}
              />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({bets.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filterBetsByStatus('pending').length})
            </TabsTrigger>
            <TabsTrigger value="win">
              Won ({filterBetsByStatus('win').length})
            </TabsTrigger>
            <TabsTrigger value="loss">
              Lost ({filterBetsByStatus('loss').length})
            </TabsTrigger>
            <TabsTrigger value="push">
              Push ({filterBetsByStatus('push').length})
            </TabsTrigger>
          </TabsList>

          {(['all', 'pending', 'win', 'loss', 'push'] as const).map((status) => (
            <TabsContent key={status} value={status} className="mt-6">
              <div className="grid gap-4">
                {filterBetsByStatus(status).length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {status === 'all' ? 'No bets yet' : `No ${status} bets`}
                      {status === 'all' && (
                        <div className="mt-4">
                          <Button onClick={() => setShowBetForm(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Place Your First Bet
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  filterBetsByStatus(status).map((bet) => (
                    <Card key={bet.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{bet.sport}</Badge>
                              <Badge variant={getStatusBadgeVariant(bet.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(bet.status)}
                                  {bet.status.toUpperCase()}
                                </div>
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{bet.event_name}</h3>
                            <p className="text-muted-foreground mb-2">
                              {bet.market}: {bet.selection}
                            </p>
                            {bet.notes && (
                              <p className="text-sm text-muted-foreground italic">
                                "{bet.notes}"
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {formatOdds(bet.odds)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {bet.stake_units} {bet.stake_units === 1 ? 'unit' : 'units'}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>Placed: {formatDate(bet.placed_at)}</span>
                          {bet.resolved_at && (
                            <span>Resolved: {formatDate(bet.resolved_at)}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Bets;