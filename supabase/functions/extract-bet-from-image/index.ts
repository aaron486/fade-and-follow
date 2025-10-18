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
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling AI to extract bet details from image...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at reading betting slips. Extract EXACT information from the betting slip image.

CRITICAL: Be precise and accurate. Extract exactly what you see on the slip.

Return ONLY valid JSON with these fields:
{
  "sport": "exact sport (NFL, NBA, MLB, NHL, Soccer, UFC, etc.)",
  "event_name": "full game/match name exactly as shown (e.g., 'Los Angeles Lakers vs Golden State Warriors', 'Kansas City Chiefs @ Buffalo Bills')",
  "selection": "the exact pick being made (e.g., 'Lakers -5.5', 'Chiefs ML', 'Over 45.5', 'Patrick Mahomes Over 2.5 TDs')",
  "market": "bet type - one of: ML, Spread, Total, Prop, Future, Parlay",
  "odds": "american odds as shown (e.g., '-110', '+150', '-200')",
  "stake_units": "exact stake amount as number (e.g., 1.0, 5.0, 10.0)",
  "notes": "any additional info visible (confidence, reasoning, etc.)"
}

IMPORTANT EXTRACTION RULES:
- Sport: Look for league logos, team names to identify (NFL/NBA/MLB/NHL/etc)
- Event: Copy the full team/player matchup exactly as written
- Selection: Include the specific bet (spread number, totals, prop details)
- Odds: Must include +/- sign (e.g., -110, +150)
- Stake: Look for amount wagered, bet size, units - extract the number
- Market: ML=moneyline, Spread=point spread, Total=over/under, Prop=player props

If you cannot read the information clearly, return: { "error": "Unable to read betting slip clearly" }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Read this betting slip and extract the exact information shown. Be precise and accurate.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to process image' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response received:', JSON.stringify(data));
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from AI
    let betDetails;
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      betDetails = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', rawContent: content }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if AI returned an error
    if (betDetails.error) {
      return new Response(
        JSON.stringify({ error: betDetails.error }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted bet details:', betDetails);

    return new Response(
      JSON.stringify({ betDetails }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-bet-from-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
