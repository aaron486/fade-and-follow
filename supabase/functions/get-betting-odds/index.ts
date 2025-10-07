import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sport = 'upcoming' } = await req.json().catch(() => ({}));
    
    const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY');
    if (!ODDS_API_KEY) {
      console.error('ODDS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching odds for sport:', sport);

    // Determine which sports to fetch
    let sportsToFetch = [];
    if (sport === 'upcoming') {
      // Only fetch NBA, NFL, MLB, and NCAAF
      sportsToFetch = ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'americanfootball_ncaaf'];
    } else {
      sportsToFetch = [sport];
    }

    let allEvents = [];

    // Fetch odds for each sport
    for (const sportKey of sportsToFetch) {
      try {
        const oddsResponse = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (oddsResponse.ok) {
          const oddsData = await oddsResponse.json();
          allEvents = allEvents.concat(oddsData);
        }
      } catch (error) {
        console.error(`Error fetching odds for ${sportKey}:`, error);
      }
    }

    // Try to fetch live scores for in-progress games
    try {
      for (const sportKey of sportsToFetch) {
        const scoresResponse = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportKey}/scores?apiKey=${ODDS_API_KEY}&daysFrom=1`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (scoresResponse.ok) {
          const scoresData = await scoresResponse.json();
          
          // Merge scores with events
          allEvents = allEvents.map(event => {
            const scoreData = scoresData.find(s => s.id === event.id);
            if (scoreData && scoreData.scores) {
              const homeScore = scoreData.scores.find(s => s.name === event.home_team);
              const awayScore = scoreData.scores.find(s => s.name === event.away_team);
              
              return {
                ...event,
                scores: {
                  home_score: homeScore?.score || 0,
                  away_score: awayScore?.score || 0,
                },
                completed: scoreData.completed || false,
              };
            }
            return event;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
      // Continue without scores if there's an error
    }

    // Sort by commence time and limit to 20 games
    allEvents.sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());
    allEvents = allEvents.slice(0, 20);

    console.log('Odds fetched successfully, events count:', allEvents.length);

    return new Response(
      JSON.stringify({ 
        events: allEvents,
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-betting-odds function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
