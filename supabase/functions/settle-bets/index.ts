import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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

    // Fetch completed game scores from The Odds API
    const scoresResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/upcoming/scores?apiKey=${ODDS_API_KEY}&daysFrom=1`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!scoresResponse.ok) {
      console.error('Odds API error:', scoresResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scores' }), 
        { status: scoresResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scores = await scoresResponse.json();
    console.log(`Fetched ${scores.length} game scores`);

    let settledCount = 0;
    const updates = [];

    // Process each pending bet
    for (const bet of pendingBets) {
      // Find matching completed game
      const game = scores.find((g: any) => 
        g.completed && 
        (g.home_team + ' vs ' + g.away_team === bet.event_name ||
         g.away_team + ' vs ' + g.home_team === bet.event_name)
      );

      if (!game) continue;

      console.log(`Processing bet for game: ${bet.event_name}`);

      let betStatus = 'pending';
      
      // Determine bet outcome based on market type
      if (bet.market === 'Spread') {
        const selection = bet.selection;
        const spread = parseFloat(selection.match(/([+-]?\d+\.?\d*)/)?.[1] || '0');
        const team = selection.replace(/[+-]?\d+\.?\d*/, '').trim();
        
        const isHomeTeam = team === game.home_team;
        const actualScore = isHomeTeam 
          ? (game.scores?.[0]?.score || 0) + spread
          : (game.scores?.[1]?.score || 0) + spread;
        const opponentScore = isHomeTeam 
          ? (game.scores?.[1]?.score || 0)
          : (game.scores?.[0]?.score || 0);
        
        if (actualScore > opponentScore) {
          betStatus = 'win';
        } else if (actualScore < opponentScore) {
          betStatus = 'loss';
        } else {
          betStatus = 'push';
        }
      } else if (bet.market === 'Moneyline') {
        const team = bet.selection;
        const homeScore = game.scores?.[0]?.score || 0;
        const awayScore = game.scores?.[1]?.score || 0;
        
        if (team === game.home_team) {
          betStatus = homeScore > awayScore ? 'win' : (homeScore === awayScore ? 'push' : 'loss');
        } else {
          betStatus = awayScore > homeScore ? 'win' : (homeScore === awayScore ? 'push' : 'loss');
        }
      } else if (bet.market === 'Total') {
        const totalScore = (game.scores?.[0]?.score || 0) + (game.scores?.[1]?.score || 0);
        const line = parseFloat(bet.selection.match(/\d+\.?\d*/)?.[0] || '0');
        const isOver = bet.selection.toLowerCase().includes('over');
        
        if (isOver) {
          betStatus = totalScore > line ? 'win' : (totalScore === line ? 'push' : 'loss');
        } else {
          betStatus = totalScore < line ? 'win' : (totalScore === line ? 'push' : 'loss');
        }
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
