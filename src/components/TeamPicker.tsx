import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TEAMS_BY_LEAGUE } from '@/data/teams';

interface Team {
  id: string;
  name: string;
  league: string;
}

export const TeamPicker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFavoriteTeams();
  }, [user]);

  const loadFavoriteTeams = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('favorite_teams')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading favorite teams:', error);
      return;
    }

    if (data?.favorite_teams) {
      setSelectedTeams(data.favorite_teams);
    }
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const saveFavoriteTeams = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_teams: selectedTeams })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedTeams.length} favorite teams saved`,
      });
    } catch (error) {
      console.error('Error saving teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to save favorite teams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Convert teams to array with IDs
  const allTeams: Team[] = [];
  let teamIdCounter = 1000;

  Object.entries(TEAMS_BY_LEAGUE).forEach(([league, teamNames]) => {
    (teamNames as string[]).forEach((name: string) => {
      allTeams.push({
        id: String(teamIdCounter++),
        name,
        league,
      });
    });
  });

  const groupedTeams = allTeams.reduce((acc, team) => {
    if (!acc[team.league]) {
      acc[team.league] = [];
    }
    acc[team.league].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Favorite Teams</CardTitle>
        <CardDescription>
          Choose teams to personalize your betting feed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[500px] pr-4">
          {Object.entries(groupedTeams).map(([league, leagueTeams]) => (
            <div key={league} className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-primary">
                {league}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {leagueTeams.map((team) => {
                  const isSelected = selectedTeams.includes(team.id);
                  return (
                    <Button
                      key={team.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTeam(team.id)}
                      className="justify-between h-auto py-2"
                    >
                      <span className="text-left flex-1 truncate">
                        {team.name}
                      </span>
                      {isSelected && <Check className="h-4 w-4 ml-2 shrink-0" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <Badge variant="secondary">
            {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
          </Badge>
          <Button 
            onClick={saveFavoriteTeams}
            disabled={loading || selectedTeams.length === 0}
          >
            {loading ? 'Saving...' : 'Save Favorites'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};