import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, DollarSign, Flame, Snowflake } from 'lucide-react';

interface BettingStatsProps {
  userId: string;
}

interface UserStats {
  total_bets: number;
  wins: number;
  losses: number;
  pushes: number;
  win_percentage: number;
  total_units_wagered: number;
  total_units_won: number;
  roi_percentage: number;
  current_streak: number;
  streak_type: string;
}

export const BettingStats: React.FC<BettingStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBettingStats();
  }, [userId]);

  const loadBettingStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_user_betting_stats', { target_user_id: userId });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error loading betting stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading stats...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Betting Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No betting data available yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStreakColor = (streakType: string) => {
    switch (streakType) {
      case 'win':
        return 'text-green-600';
      case 'loss':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStreakIcon = (streakType: string, streakCount: number) => {
    if (streakType === 'win' && streakCount >= 3) {
      return <Flame className="w-4 h-4 text-orange-500" />;
    }
    if (streakType === 'loss' && streakCount >= 3) {
      return <Snowflake className="w-4 h-4 text-blue-500" />;
    }
    return streakType === 'win' ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingDown className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Betting Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Bets */}
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total_bets}</div>
            <div className="text-sm text-muted-foreground">Total Bets</div>
          </div>

          {/* Win Percentage */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.win_percentage}%
            </div>
            <div className="text-sm text-muted-foreground">Win Rate</div>
          </div>

          {/* ROI */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              stats.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.roi_percentage >= 0 ? '+' : ''}{stats.roi_percentage}%
            </div>
            <div className="text-sm text-muted-foreground">ROI</div>
          </div>

          {/* Current Streak */}
          <div className="text-center">
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${getStreakColor(stats.streak_type)}`}>
              {getStreakIcon(stats.streak_type, stats.current_streak)}
              {stats.current_streak}
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.streak_type === 'win' ? 'Win' : stats.streak_type === 'loss' ? 'Loss' : 'No'} Streak
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm">Wins</span>
            </div>
            <span className="font-semibold text-green-600">{stats.wins}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm">Losses</span>
            </div>
            <span className="font-semibold text-red-600">{stats.losses}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Pushes</span>
            </div>
            <span className="font-semibold text-blue-600">{stats.pushes}</span>
          </div>
        </div>

        {/* Units Summary */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Units Wagered</span>
            <span className="font-semibold">{stats.total_units_wagered}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Net Units</span>
            <span className={`font-semibold ${
              stats.total_units_won >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.total_units_won >= 0 ? '+' : ''}{stats.total_units_won}
            </span>
          </div>
        </div>

        {/* Performance Badge */}
        {stats.total_bets >= 10 && (
          <div className="mt-4 flex justify-center">
            <Badge variant={stats.win_percentage >= 55 ? 'default' : 
                           stats.win_percentage >= 50 ? 'secondary' : 'destructive'}>
              {stats.win_percentage >= 60 ? '🔥 Elite Bettor' :
               stats.win_percentage >= 55 ? '📈 Sharp Bettor' :
               stats.win_percentage >= 50 ? '⚖️ Break Even' :
               '📉 Needs Improvement'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};