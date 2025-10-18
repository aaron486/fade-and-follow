import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Share2, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fadeLogo from '@/assets/fade-logo.png';

interface ShareableBetCardProps {
  bet: {
    sport: string;
    event_name: string;
    market: string;
    selection: string;
    odds: number;
    stake_units: number;
    notes?: string;
  };
  username?: string;
}

export const ShareableBetCard = ({ bet, username }: ShareableBetCardProps) => {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const marketLabels: Record<string, string> = {
    'ML': 'Moneyline',
    'Spread': 'Spread',
    'Total': 'Total',
    'Prop': 'Prop Bet',
    'Future': 'Future',
    'Parlay': 'Parlay'
  };

  const getBetText = () => {
    return `🎯 ${username || 'Someone'} just logged a bet on FADE!\n\n${bet.sport} • ${bet.event_name}\n${marketLabels[bet.market] || bet.market}: ${bet.selection}\n\nOdds: ${formatOdds(bet.odds)} | Stake: ${bet.stake_units}u${bet.notes ? `\n\n💭 ${bet.notes}` : ''}\n\nJoin me on FADE - Bet Together 🚀`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getBetText());
      toast({
        title: "Copied!",
        description: "Bet details copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const text = getBetText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My FADE Bet',
          text: text,
        });
        toast({
          title: "Shared!",
          description: "Bet shared successfully",
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleSMS = () => {
    const text = encodeURIComponent(getBetText());
    window.open(`sms:?body=${text}`, '_blank');
  };

  const handleDiscord = () => {
    handleCopy();
    toast({
      title: "Copied for Discord!",
      description: "Paste in your Discord chat",
    });
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* Shareable Visual Card */}
      <Card 
        ref={cardRef}
        className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
        
        <div className="relative p-6 space-y-4">
          {/* Header with logo */}
          <div className="flex items-center justify-between">
            <img src={fadeLogo} alt="FADE" className="h-8" />
            <span className="text-xs font-medium text-muted-foreground">
              {new Date().toLocaleDateString()}
            </span>
          </div>

          {/* User info */}
          {username && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{username}</p>
                <p className="text-xs text-muted-foreground">logged a bet</p>
              </div>
            </div>
          )}

          {/* Bet Details */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {bet.sport}
              </p>
              <p className="text-lg font-bold text-foreground leading-tight">
                {bet.event_name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                {marketLabels[bet.market] || bet.market}
              </span>
            </div>

            <div className="p-4 bg-card/50 backdrop-blur rounded-lg border border-border/50">
              <p className="text-base font-semibold text-foreground mb-3">
                {bet.selection}
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Odds</p>
                  <p className="text-xl font-bold text-primary">
                    {formatOdds(bet.odds)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Stake</p>
                  <p className="text-xl font-bold text-foreground">
                    {bet.stake_units}u
                  </p>
                </div>
              </div>
            </div>

            {bet.notes && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground italic">{bet.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-border/30">
            <p className="text-xs text-center text-muted-foreground">
              Bet Together on FADE 🎯
            </p>
          </div>
        </div>
      </Card>

      {/* Share Actions */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-center text-muted-foreground">
          Share Your Bet
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleShare}
            variant="outline" 
            className="w-full gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          
          <Button 
            onClick={handleCopy}
            variant="outline" 
            className="w-full gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          
          <Button 
            onClick={handleSMS}
            variant="outline" 
            className="w-full gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            iMessage
          </Button>
          
          <Button 
            onClick={handleDiscord}
            variant="outline" 
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            Discord
          </Button>
        </div>
      </div>
    </div>
  );
};