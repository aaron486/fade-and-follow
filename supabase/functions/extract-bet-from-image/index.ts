import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sportsbook detection patterns
const SPORTSBOOK_PATTERNS: any = {
  draftkings: ['draftkings', 'dk', 'dkng'],
  fanduel: ['fanduel', 'fd'],
  betmgm: ['betmgm', 'mgm'],
  caesars: ['caesars', 'cz'],
  espnbet: ['espn bet', 'espnbet'],
  fanatics: ['fanatics'],
  bet365: ['bet365'],
  pointsbet: ['pointsbet'],
  wynnbet: ['wynnbet'],
  barstool: ['barstool'],
};

// Team name normalization mappings
const TEAM_MAPPINGS: any = {
  // NFL
  'chiefs': { league: 'NFL', fullName: 'Kansas City Chiefs', aliases: ['kc', 'kansas city'] },
  '49ers': { league: 'NFL', fullName: 'San Francisco 49ers', aliases: ['sf', 'san francisco', 'niners'] },
  'ravens': { league: 'NFL', fullName: 'Baltimore Ravens', aliases: ['bal', 'baltimore'] },
  'bills': { league: 'NFL', fullName: 'Buffalo Bills', aliases: ['buf', 'buffalo'] },
  'cowboys': { league: 'NFL', fullName: 'Dallas Cowboys', aliases: ['dal', 'dallas'] },
  'eagles': { league: 'NFL', fullName: 'Philadelphia Eagles', aliases: ['phi', 'philadelphia'] },
  'packers': { league: 'NFL', fullName: 'Green Bay Packers', aliases: ['gb', 'green bay'] },
  'lions': { league: 'NFL', fullName: 'Detroit Lions', aliases: ['det', 'detroit'] },
  // NBA
  'lakers': { league: 'NBA', fullName: 'Los Angeles Lakers', aliases: ['la lakers', 'lal'] },
  'celtics': { league: 'NBA', fullName: 'Boston Celtics', aliases: ['bos', 'boston'] },
  'warriors': { league: 'NBA', fullName: 'Golden State Warriors', aliases: ['gs', 'gsw', 'golden state'] },
  'nets': { league: 'NBA', fullName: 'Brooklyn Nets', aliases: ['bkn', 'brooklyn'] },
};

function detectSportsbook(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [book, patterns] of Object.entries(SPORTSBOOK_PATTERNS)) {
    const patternArray = patterns as string[];
    if (patternArray.some((p: string) => lowerText.includes(p))) {
      return book;
    }
  }
  return 'unknown';
}

function normalizeTeamName(teamName: string): any {
  const lower = teamName.toLowerCase().trim();
  
  for (const [key, value] of Object.entries(TEAM_MAPPINGS)) {
    const mapping = value as any;
    if (lower.includes(key) || mapping.aliases.some((alias: string) => lower.includes(alias))) {
      return { normalized: mapping.fullName, league: mapping.league };
    }
  }
  
  return { normalized: teamName, league: 'unknown' };
}

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

    console.log('Starting enhanced OCR pipeline...');

    // Step 1: Extract raw text and structured data using AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are an expert betting slip OCR extractor. Analyze the image carefully and extract ALL visible text and structured bet data.

CRITICAL: Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):
{
  "raw_text": "all visible text from the slip exactly as shown",
  "sportsbook": "detected sportsbook name (DraftKings, FanDuel, BetMGM, etc) or empty string",
  "sport": "detected sport/league (NFL, NBA, NCAAF, NCAAB, MLB, NHL, UFC, Soccer, etc)",
  "event_name": "Team1 vs Team2 or Team1 @ Team2",
  "selection": "the actual bet selection (team name, player name, or over/under value)",
  "market": "bet type: ML, Spread, Total, Prop, Future, or Parlay",
  "line": "point spread or total line (e.g., '-3.5', 'O 45.5') or empty string",
  "odds": "American odds (e.g., '-110', '+150', '-200')",
  "stake": "amount wagered (number only, no $)",
  "potential_payout": "potential winnings (number only, no $) or empty string",
  "confidence": 85,
  "extraction_notes": "any uncertainties or issues encountered"
}

Confidence scoring:
- 90-100: All fields clear and unambiguous
- 70-89: Most fields clear, minor uncertainties
- 50-69: Some fields unclear or missing
- <50: Major issues or mostly illegible

Extract team names exactly as shown. Include ALL visible text in raw_text for verification.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text and bet details from this betting slip image with high accuracy.'
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
    console.log('AI OCR response received');
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Parse the JSON response from AI
    let rawExtraction: any;
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      rawExtraction = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', rawContent: content }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (rawExtraction.error) {
      return new Response(
        JSON.stringify({ error: rawExtraction.error }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Post-processing - Sportsbook detection
    const detectedSportsbook = rawExtraction.sportsbook || 
                               detectSportsbook(rawExtraction.raw_text || '');

    // Step 4: Team name normalization
    let normalizedSport = rawExtraction.sport;
    let normalizedEventName = rawExtraction.event_name;
    let normalizedSelection = rawExtraction.selection;

    if (rawExtraction.event_name) {
      const teams = rawExtraction.event_name.split(/\s+(?:vs|@)\s+/i);
      if (teams.length === 2) {
        const team1 = normalizeTeamName(teams[0]);
        const team2 = normalizeTeamName(teams[1]);
        
        if (team1.league !== 'unknown' && team2.league !== 'unknown') {
          normalizedSport = team1.league;
          normalizedEventName = `${team1.normalized} vs ${team2.normalized}`;
        }
      }
    }

    if (rawExtraction.selection) {
      const selectionNorm = normalizeTeamName(rawExtraction.selection);
      if (selectionNorm.league !== 'unknown') {
        normalizedSelection = selectionNorm.normalized;
        if (!normalizedSport || normalizedSport === 'unknown') {
          normalizedSport = selectionNorm.league;
        }
      }
    }

    // Step 5: Build final structured response
    const betDetails = {
      sport: normalizedSport || rawExtraction.sport,
      event_name: normalizedEventName || rawExtraction.event_name,
      selection: normalizedSelection || rawExtraction.selection,
      market: rawExtraction.market,
      line: rawExtraction.line || '',
      odds: rawExtraction.odds,
      stake_units: rawExtraction.stake || rawExtraction.stake_units || '1.0',
      potential_payout: rawExtraction.potential_payout || '',
      notes: rawExtraction.extraction_notes || '',
      sportsbook: detectedSportsbook,
      confidence: rawExtraction.confidence || 50,
      raw_text: rawExtraction.raw_text || '',
      needs_confirmation: (rawExtraction.confidence || 50) < 70
    };

    console.log('Enhanced OCR extraction complete:', {
      confidence: betDetails.confidence,
      sportsbook: betDetails.sportsbook,
      sport: betDetails.sport,
      needs_confirmation: betDetails.needs_confirmation
    });

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
