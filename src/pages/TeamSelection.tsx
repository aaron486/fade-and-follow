import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2 } from 'lucide-react';
import fadeLogo from "@/assets/fade-logo.png";

interface Team {
  id: string;
  name: string;
  mascot: string;
  logo_url: string | null;
  league: string;
  sport: string;
}

const TeamSelection = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    fetchTeams();
  }, [user, navigate]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('league', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      toast({
        title: "Error Loading Teams",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleContinue = async () => {
    if (selectedTeams.length === 0) {
      toast({
        title: "Select at least one team",
        description: "Choose your favorite team(s) to continue",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_teams: selectedTeams })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Teams Saved!",
        description: "Your favorite teams have been set.",
      });

      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast({
        title: "Error Saving Teams",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard', { replace: true });
  };

  const groupedTeams = teams.reduce((acc, team) => {
    const key = `${team.sport} - ${team.league}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <img src={fadeLogo} alt="FADE" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Pick Your Team(s)</h1>
          <p className="text-muted-foreground">
            Select your favorite teams to personalize your feed
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            You can select multiple teams
          </p>
        </div>

        <div className="space-y-8 mb-8">
          {Object.entries(groupedTeams).map(([category, categoryTeams]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-4 text-foreground/80">
                {category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {categoryTeams.map((team) => (
                  <Card
                    key={team.id}
                    onClick={() => toggleTeam(team.id)}
                    className={`
                      relative cursor-pointer transition-all duration-200 hover:scale-105
                      ${selectedTeams.includes(team.id) 
                        ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                        : 'hover:shadow-md'
                      }
                    `}
                  >
                    <div className="p-4 flex flex-col items-center text-center gap-3">
                      {selectedTeams.includes(team.id) && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={team.name}
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-muted-foreground">
                            {team.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <p className="font-semibold text-sm leading-tight">
                          {team.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {team.mascot}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No teams available at the moment.</p>
          </div>
        )}

        <div className="flex gap-4 justify-center sticky bottom-6 mt-8">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={saving}
            size="lg"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleContinue}
            disabled={saving || selectedTeams.length === 0}
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              `Continue with ${selectedTeams.length} team${selectedTeams.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamSelection;
