import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// Team matching utilities
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
};

// College Football team mappings
const NCAAF_MAPPINGS: Record<string, string> = {
  'alabama': 'Alabama Crimson Tide',
  'arkansas': 'Arkansas Razorbacks',
  'auburn': 'Auburn Tigers',
  'michigan': 'Michigan Wolverines',
  'ohio state': 'Ohio State Buckeyes',
  'georgia': 'Georgia Bulldogs',
  'florida': 'Florida Gators',
  'lsu': 'LSU Tigers',
  'texas': 'Texas Longhorns',
  'oklahoma': 'Oklahoma Sooners',
  'usc': 'USC Trojans',
  'oregon': 'Oregon Ducks',
  'penn state': 'Penn State Nittany Lions',
  'clemson': 'Clemson Tigers',
  'notre dame': 'Notre Dame Fighting Irish',
  'florida state': 'Florida State Seminoles',
  'miami': 'Miami Hurricanes',
  'texas am': 'Texas A&M Aggies',
  'tennessee': 'Tennessee Volunteers',
  'wisconsin': 'Wisconsin Badgers',
};

// College Basketball team mappings
const NCAAB_MAPPINGS: Record<string, string> = {
  'duke': 'Duke Blue Devils',
  'north carolina': 'North Carolina Tar Heels',
  'kentucky': 'Kentucky Wildcats',
  'kansas': 'Kansas Jayhawks',
  'villanova': 'Villanova Wildcats',
  'uconn': 'UConn Huskies',
  'gonzaga': 'Gonzaga Bulldogs',
  'ucla': 'UCLA Bruins',
  'michigan state': 'Michigan State Spartans',
  'syracuse': 'Syracuse Orange',
  'louisville': 'Louisville Cardinals',
  'arizona': 'Arizona Wildcats',
  'indiana': 'Indiana Hoosiers',
  'maryland': 'Maryland Terrapins',
  'virginia': 'Virginia Cavaliers',
  'purdue': 'Purdue Boilermakers',
  'illinois': 'Illinois Fighting Illini',
  'texas': 'Texas Longhorns',
  'baylor': 'Baylor Bears',
  'michigan': 'Michigan Wolverines',
};

const matchTeamName = (teamName: string, sport: string): string => {
  const normalized = normalizeTeamName(teamName);
  
  if (sport.includes('ncaaf') || sport.includes('college football')) {
    return NCAAF_MAPPINGS[normalized] || teamName;
  }
  
  if (sport.includes('ncaab') || sport.includes('college basketball')) {
    return NCAAB_MAPPINGS[normalized] || teamName;
  }
  
  return teamName;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!ODDS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Fetching pending bets...');
    
    // Get all pending bets
    const { data: pendingBets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('status', 'pending');

    if (betsError) {
      console.error('Error fetching pending bets:', betsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending bets' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingBets?.length || 0} pending bets`);

    if (!pendingBets || pendingBets.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending bets to settle', settled: 0 }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch completed game scores from The Odds API for multiple sports
    const sports = ['basketball_nba', 'basketball_ncaab', 'americanfootball_nfl', 'americanfootball_ncaaf', 'baseball_mlb', 'icehockey_nhl'];
    let allScores: any[] = [];
    
    for (const sport of sports) {
      try {
        const scoresResponse = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sport}/scores?apiKey=${ODDS_API_KEY}&daysFrom=3`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          }
        );

        if (scoresResponse.ok) {
          const sportScores = await scoresResponse.json();
          allScores = allScores.concat(sportScores);
          console.log(`Fetched ${sportScores.length} ${sport} game scores`);
        } else {
          console.error(`Failed to fetch ${sport} scores:`, scoresResponse.status);
        }
      } catch (error) {
        console.error(`Error fetching ${sport} scores:`, error);
      }
    }

    console.log(`Total fetched ${allScores.length} game scores from all sports`);
    const scores = allScores;

    let settledCount = 0;
    const updates = [];

    // Helper function to normalize team names and event names
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
    };

    // Helper to extract team names from various formats
    const extractTeamNames = (eventName: string): string[] => {
      // Handle various separators: vs, vs., @, -, etc.
      const separators = [' vs ', ' vs. ', ' @ ', ' - ', ' v '];
      for (const sep of separators) {
        if (eventName.toLowerCase().includes(sep)) {
          return eventName.split(new RegExp(sep, 'i')).map(t => normalizeText(t));
        }
      }
      return [normalizeText(eventName)];
    };

    // Process each pending bet
    for (const bet of pendingBets) {
      const betTeams = extractTeamNames(bet.event_name);
      
      // Determine sport type for team matching
      const sportKey = bet.sport.toLowerCase();
      
      // Find matching completed game with flexible matching and team name normalization
      const game = scores.find((g: any) => {
        if (!g.completed) return false;
        
        // Normalize and match team names based on sport
        const apiHomeTeam = normalizeText(matchTeamName(g.home_team, sportKey));
        const apiAwayTeam = normalizeText(matchTeamName(g.away_team, sportKey));
        
        // Check if both teams match (in any order)
        if (betTeams.length >= 2) {
          const betTeam1 = normalizeText(matchTeamName(betTeams[0], sportKey));
          const betTeam2 = normalizeText(matchTeamName(betTeams[1], sportKey));
          
          const hasHomeTeam = betTeam1.includes(apiHomeTeam) || apiHomeTeam.includes(betTeam1) ||
                             betTeam2.includes(apiHomeTeam) || apiHomeTeam.includes(betTeam2);
          const hasAwayTeam = betTeam1.includes(apiAwayTeam) || apiAwayTeam.includes(betTeam1) ||
                             betTeam2.includes(apiAwayTeam) || apiAwayTeam.includes(betTeam2);
          
          return hasHomeTeam && hasAwayTeam;
        }
        
        // Fallback: check if event name contains both team names
        const normalizedBetName = normalizeText(bet.event_name);
        return normalizedBetName.includes(apiHomeTeam) && normalizedBetName.includes(apiAwayTeam);
      });

      if (!game) {
        console.log(`No match for bet: ${bet.event_name} | Sport: ${bet.sport} | Teams: ${betTeams.join(', ')}`);
        continue;
      }

      console.log(`✓ Matched bet: ${bet.event_name} -> ${game.home_team} vs ${game.away_team} (${bet.sport})`);

      let betStatus = 'pending';
      const homeScore = game.scores?.[0]?.score || 0;
      const awayScore = game.scores?.[1]?.score || 0;
      
      console.log(`Scores: ${game.home_team} ${homeScore} - ${game.away_team} ${awayScore}`);
      
      // Determine bet outcome based on market type
      if (bet.market === 'Spread') {
        const spreadMatch = bet.selection.match(/([+-]?\d+\.?\d*)/);
        const spread = parseFloat(spreadMatch?.[1] || '0');
        
        // Extract team name from selection and normalize
        const selectionTeamRaw = bet.selection.replace(/[+-]?\d+\.?\d*/, '').trim();
        const selectionTeam = normalizeText(matchTeamName(selectionTeamRaw, bet.sport));
        
        const apiHomeTeam = normalizeText(matchTeamName(game.home_team, bet.sport));
        const apiAwayTeam = normalizeText(matchTeamName(game.away_team, bet.sport));
        
        // Match the selection team to home or away
        const isHomeTeam = apiHomeTeam.includes(selectionTeam) || selectionTeam.includes(apiHomeTeam);
        
        const adjustedScore = isHomeTeam ? homeScore + spread : awayScore + spread;
        const opponentScore = isHomeTeam ? awayScore : homeScore;
        
        if (adjustedScore > opponentScore) {
          betStatus = 'win';
        } else if (adjustedScore < opponentScore) {
          betStatus = 'loss';
        } else {
          betStatus = 'push';
        }
        
        console.log(`Spread: ${bet.selection} (${selectionTeam} ${isHomeTeam ? 'home' : 'away'}) -> ${betStatus}`);
        
      } else if (bet.market === 'Moneyline' || bet.market === 'ML') {
        const selectionTeamRaw = bet.selection.trim();
        const selectionTeam = normalizeText(matchTeamName(selectionTeamRaw, bet.sport));
        const apiHomeTeam = normalizeText(matchTeamName(game.home_team, bet.sport));
        const apiAwayTeam = normalizeText(matchTeamName(game.away_team, bet.sport));
        
        const isHomeTeam = apiHomeTeam.includes(selectionTeam) || selectionTeam.includes(apiHomeTeam);
        
        if (isHomeTeam) {
          betStatus = homeScore > awayScore ? 'win' : (homeScore === awayScore ? 'push' : 'loss');
        } else {
          betStatus = awayScore > homeScore ? 'win' : (homeScore === awayScore ? 'push' : 'loss');
        }
        
        console.log(`Moneyline: ${bet.selection} (${selectionTeam} ${isHomeTeam ? 'home' : 'away'}) -> ${betStatus}`);
        
      } else if (bet.market === 'Total' || bet.market === 'Totals') {
        const totalScore = homeScore + awayScore;
        const lineMatch = bet.selection.match(/\d+\.?\d*/);
        const line = parseFloat(lineMatch?.[0] || '0');
        const isOver = bet.selection.toLowerCase().includes('over') || bet.selection.toLowerCase().includes('o ');
        
        if (isOver) {
          betStatus = totalScore > line ? 'win' : (totalScore === line ? 'push' : 'loss');
        } else {
          betStatus = totalScore < line ? 'win' : (totalScore === line ? 'push' : 'loss');
        }
        
        console.log(`Total: ${bet.selection} (${totalScore} vs ${line}) -> ${betStatus}`);
      }

      if (betStatus !== 'pending') {
        updates.push({
          id: bet.id,
          status: betStatus,
          resolved_at: new Date().toISOString()
        });
        settledCount++;
      }
    }

    // Batch update all settled bets
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('bets')
          .update({ status: update.status, resolved_at: update.resolved_at })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating bet ${update.id}:`, updateError);
        }
      }
    }

    console.log(`Successfully settled ${settledCount} bets`);

    return new Response(
      JSON.stringify({ 
        message: 'Bet settlement complete',
        settled: settledCount,
        total_pending: pendingBets.length
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in settle-bets function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
