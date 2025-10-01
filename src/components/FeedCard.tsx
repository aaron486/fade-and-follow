import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, TrendingUp, Plus, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface FeedItemProps {
  item: {
    id: string;
    headline: string;
    summary: string;
    suggestedPicks: Array<{
      team: string;
      market: string;
      odds: number;
      reasoning: string;
    }>;
    confidence: 'high' | 'medium' | 'low';
    sources: string[];
    timestamp: string;
    category: string;
  };
}

export const FeedCard = ({ item }: FeedItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: 'bg-accent/20 text-accent border-accent/30',
      medium: 'bg-primary/20 text-primary border-primary/30',
      low: 'bg-muted text-muted-foreground border-border',
    };
    return variants[confidence as keyof typeof variants] || variants.low;
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const handleAddToBets = () => {
    toast({
      title: "Navigate to Bets",
      description: "You can add this pick from your Bets page",
    });
    navigate('/bets');
  };

  const timeSince = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000 / 60);
    
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
              <Badge className={`text-xs ${getConfidenceBadge(item.confidence)}`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {item.confidence} confidence
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {timeSince(item.timestamp)}
              </span>
            </div>
            <h3 className="text-lg font-bold leading-tight">{item.headline}</h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {item.summary}
        </p>

        {/* Suggested Picks Preview */}
        {item.suggestedPicks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Suggested Picks</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-2">
              {(isExpanded ? item.suggestedPicks : item.suggestedPicks.slice(0, 1)).map((pick, idx) => (
                <div
                  key={idx}
                  className="bg-secondary/50 rounded-lg p-3 border border-border/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{pick.team}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatOdds(pick.odds)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {pick.market}
                      </p>
                      {isExpanded && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          {pick.reasoning}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={handleAddToBets}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {!isExpanded && item.suggestedPicks.length > 1 && (
              <p className="text-xs text-muted-foreground text-center">
                +{item.suggestedPicks.length - 1} more picks
              </p>
            )}
          </div>
        )}

        {/* Sources (when expanded) */}
        {isExpanded && item.sources.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Sources</h4>
            <div className="flex flex-wrap gap-2">
              {item.sources.map((source, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  asChild
                >
                  <a href={source} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Source {idx + 1}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
