import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';


interface BetConfirmationProps {
  betDetails: {
    sport: string;
    event_name: string;
    market: string;
    selection: string;
    odds: string;
    stake_units: string;
    notes?: string;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

const SPORTS_OPTIONS = [
  'NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Golf', 'Boxing', 'MMA', 'College Football', 'College Basketball', 'Other'
];

const MARKET_OPTIONS = [
  { value: 'ML', label: 'Moneyline' },
  { value: 'Spread', label: 'Point Spread' },
  { value: 'Total', label: 'Over/Under' },
  { value: 'Prop', label: 'Player Prop' },
  { value: 'Future', label: 'Future Bet' },
  { value: 'Parlay', label: 'Parlay' },
];

const BetConfirmation = ({ betDetails, onCancel, onSuccess }: BetConfirmationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(betDetails);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const odds = parseFloat(formData.odds);
    const stakeUnits = parseFloat(formData.stake_units);

    if (isNaN(odds) || isNaN(stakeUnits) || stakeUnits <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter valid odds and stake amounts.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Insert bet and get the created bet ID
      const { data: betData, error: betError } = await supabase
        .from('bets')
        .insert([
          {
            user_id: user.id,
            sport: formData.sport,
            event_name: formData.event_name,
            market: formData.market,
            selection: formData.selection,
            odds: odds,
            stake_units: stakeUnits,
            notes: formData.notes || null,
          },
        ])
        .select()
        .single();

      if (betError) throw betError;

      console.log('✅ Bet placed:', betData.id);

      // Create bet story
      const { error: storyError } = await supabase
        .from('bet_stories')
        .insert({
          user_id: user.id,
          bet_id: betData.id,
        });

      if (storyError) {
        console.error('Story creation failed:', storyError);
      } else {
        console.log('✅ Bet story created for bet:', betData.id);
      }

      // Close dialog immediately for better UX
      onSuccess();
      
      // Show success toast after closing
      setTimeout(() => {
        toast({
          title: '✅ Bet Placed!',
          description: `${formData.selection} • ${odds > 0 ? '+' : ''}${odds}`,
        });
      }, 100);
    } catch (error: any) {
      console.error('Error creating bet:', error);
      
      // Check if it's a rate limit error
      const isRateLimit = error.message?.includes('rate limit') || 
                          error.code === 'PGRST301' ||
                          error.status === 429;
      
      toast({
        title: 'Error',
        description: isRateLimit 
          ? 'Too many requests. Please wait a moment and try again.'
          : 'Failed to place bet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Your Bet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sport">Sport *</Label>
            <Select value={formData.sport} onValueChange={(value) => handleChange('sport', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORTS_OPTIONS.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="market">Market Type *</Label>
            <Select value={formData.market} onValueChange={(value) => handleChange('market', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select market" />
              </SelectTrigger>
              <SelectContent>
                {MARKET_OPTIONS.map((market) => (
                  <SelectItem key={market.value} value={market.value}>
                    {market.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_name">Event/Game *</Label>
          <Input
            id="event_name"
            value={formData.event_name}
            onChange={(e) => handleChange('event_name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="selection">Your Pick *</Label>
          <Input
            id="selection"
            value={formData.selection}
            onChange={(e) => handleChange('selection', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="odds">Odds (American) *</Label>
            <Input
              id="odds"
              type="number"
              value={formData.odds}
              onChange={(e) => handleChange('odds', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stake_units">Stake (Units) *</Label>
            <Input
              id="stake_units"
              type="number"
              step="0.1"
              value={formData.stake_units}
              onChange={(e) => handleChange('stake_units', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Placing Bet...' : 'Confirm & Place Bet'}
          </Button>
        </div>
      </form>
      </DialogContent>
    </Dialog>
  );
};

export default BetConfirmation;
