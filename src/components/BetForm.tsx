import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface BetFormProps {
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

export const BetForm: React.FC<BetFormProps> = ({ onCancel, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    sport: '',
    event_name: '',
    market: '',
    selection: '',
    odds: '',
    stake_units: '1',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Basic validation
    if (!formData.sport || !formData.event_name || !formData.market || !formData.selection || !formData.odds) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

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
      // Insert bet (story is auto-created by database trigger)
      const { error: betError } = await supabase
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
            image_url: null,
          },
        ]);

      if (betError) throw betError;

      toast({
        title: '✅ Bet Placed!',
        description: `${formData.selection} • ${odds > 0 ? '+' : ''}${odds}`,
      });
      
      onSuccess();
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sport */}
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

        {/* Market Type */}
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

      {/* Event Name */}
      <div className="space-y-2">
        <Label htmlFor="event_name">Event/Game *</Label>
        <Input
          id="event_name"
          placeholder="e.g., Lakers vs Warriors, Chiefs vs Bills"
          value={formData.event_name}
          onChange={(e) => handleChange('event_name', e.target.value)}
        />
      </div>

      {/* Selection */}
      <div className="space-y-2">
        <Label htmlFor="selection">Your Pick *</Label>
        <Input
          id="selection"
          placeholder="e.g., Lakers ML, Over 220.5, Mahomes Over 2.5 TDs"
          value={formData.selection}
          onChange={(e) => handleChange('selection', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Odds */}
        <div className="space-y-2">
          <Label htmlFor="odds">Odds (American) *</Label>
          <Input
            id="odds"
            type="number"
            placeholder="e.g., -110, +150"
            value={formData.odds}
            onChange={(e) => handleChange('odds', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter negative for favorites (-110) or positive for underdogs (+150)
          </p>
        </div>

        {/* Stake */}
        <div className="space-y-2">
          <Label htmlFor="stake_units">Stake (Units) *</Label>
          <Input
            id="stake_units"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="1.0"
            value={formData.stake_units}
            onChange={(e) => handleChange('stake_units', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Standard unit size (e.g., 1.0 = 1 unit)
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any thoughts or reasoning behind this bet..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Placing Bet...' : 'Place Bet'}
        </Button>
      </div>
    </form>
  );
};