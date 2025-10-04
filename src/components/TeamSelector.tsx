import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TEAMS_BY_LEAGUE, LEAGUE_LABELS } from '@/data/teams';
import { X, Plus, Search } from 'lucide-react';

interface TeamSelectorProps {
  selectedTeams: string[];
  onChange: (teams: string[]) => void;
}

export const TeamSelector = ({ selectedTeams, onChange }: TeamSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const addTeam = (team: string) => {
    if (!selectedTeams.includes(team)) {
      onChange([...selectedTeams, team]);
    }
  };

  const removeTeam = (team: string) => {
    onChange(selectedTeams.filter(t => t !== team));
  };

  const filterTeams = (teams: string[]) => {
    if (!searchQuery) return teams;
    return teams.filter(team => 
      team.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedTeams.map(team => (
          <Badge key={team} variant="secondary" className="px-3 py-1.5 text-sm">
            {team}
            <button
              onClick={() => removeTeam(team)}
              className="ml-2 hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {selectedTeams.length === 0 && (
          <p className="text-sm text-muted-foreground">No teams selected</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Teams
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-background">
          <DialogHeader>
            <DialogTitle>Select Your Favorite Teams</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs defaultValue="NFL" className="w-full">
              <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full bg-muted">
                {Object.keys(TEAMS_BY_LEAGUE).map(league => (
                  <TabsTrigger 
                    key={league} 
                    value={league}
                    className="text-xs data-[state=active]:bg-background"
                  >
                    {LEAGUE_LABELS[league]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(TEAMS_BY_LEAGUE).map(([league, teams]) => (
                <TabsContent key={league} value={league} className="mt-4">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filterTeams(teams).map(team => {
                        const isSelected = selectedTeams.includes(team);
                        return (
                          <Button
                            key={team}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="justify-start text-left h-auto py-2"
                            onClick={() => isSelected ? removeTeam(team) : addTeam(team)}
                          >
                            {team}
                          </Button>
                        );
                      })}
                    </div>
                    {filterTeams(teams).length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No teams found matching "{searchQuery}"
                      </p>
                    )}
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
