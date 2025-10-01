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
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile with favorite team
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('favorite_team, username, preferred_sportsbook')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Get user's betting history (last 20 bets)
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('sport, team_id, market, odds, status, stake_units')
      .eq('user_id', userId)
      .order('placed_at', { ascending: false })
      .limit(20);

    if (betsError) {
      console.error('Error fetching bets:', betsError);
    }

    // Get user stats (handle case where record doesn't exist)
    const { data: stats, error: statsError } = await supabase
      .from('user_records')
      .select('wins, losses, units_won, current_streak')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsError) {
      console.error('Error fetching stats:', statsError);
    }

    console.log('Generating AI feed for user:', userId);

    // Build context for AI
    const userContext = {
      favoriteTeam: profile?.favorite_team || 'None set',
      preferredSportsbook: profile?.preferred_sportsbook || 'None',
      bettingHistory: bets || [],
      stats: stats || { wins: 0, losses: 0, units_won: 0, current_streak: 0 },
    };

    // Call Lovable AI to generate personalized feed
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert sports betting analyst creating personalized betting reports. Generate 3-5 feed items based on the user's profile. Each feed item should include:
- A compelling headline about recent betting trends or opportunities
- A concise 2-3 sentence summary with actionable insights
- 1-3 suggested picks with team names, markets, odds (as numbers like 150 or -110, NO + symbol), and reasoning
- A confidence level (high/medium/low)
- Sample source URLs (use placeholder URLs like https://espn.com, https://covers.com)
- A relevant category (Line Movement, Team News, Injury Report, Weather Impact, etc.)
- Current timestamp

CRITICAL: Return ONLY valid JSON with NO + symbols in odds numbers.

Return in this exact format:
{
  "feedItems": [
    {
      "id": "unique-id",
      "headline": "compelling headline",
      "summary": "detailed summary",
      "suggestedPicks": [
        {
          "team": "Team Name",
          "market": "Spread/Moneyline/Over-Under",
          "odds": 150,
          "reasoning": "why this pick"
        }
      ],
      "confidence": "high",
      "sources": ["https://example.com/article1"],
      "timestamp": "2025-10-01T12:00:00Z",
      "category": "Line Movement"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Generate a personalized betting feed for this user:
Favorite Team: ${userContext.favoriteTeam}
Recent Betting: ${JSON.stringify(userContext.bettingHistory.slice(0, 5))}
Win Rate: ${userContext.stats.wins}W - ${userContext.stats.losses}L
Current Streak: ${userContext.stats.current_streak}
Units: ${userContext.stats.units_won}

Focus on ${userContext.favoriteTeam} and similar bets they've made before. Include current line movements and trending picks.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let feedContent;
    try {
      const aiText = aiData.choices[0].message.content;
      // Clean any markdown code blocks
      const cleanedText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      feedContent = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    console.log('Feed generated successfully');

    return new Response(
      JSON.stringify(feedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-feed function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error generating feed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
