import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface ParsedPick {
  sport: string;
  event_name: string;
  market: string;
  selection: string;
  odds: number;
  stake_units: number;
  confidence: string;
  reasoning?: string;
  posted_at: string;
}

async function scrapeTwitterProfile(username: string): Promise<string> {
  try {
    // Use Nitter (Twitter mirror) for scraping
    const nitterUrl = `https://nitter.poast.org/${username}`;
    console.log(`Scraping ${nitterUrl}`);
    
    const response = await fetch(nitterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${nitterUrl}: ${response.status}`);
      return '';
    }

    const html = await response.text();
    
    // Extract tweet content
    const tweetPattern = /<div class="tweet-content[^>]*>([\s\S]*?)<\/div>/gi;
    const tweets: string[] = [];
    let match;
    
    while ((match = tweetPattern.exec(html)) !== null) {
      const tweetHtml = match[1];
      const textContent = tweetHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Only include tweets that look like betting picks
      if (
        textContent.length > 20 &&
        (textContent.match(/\b\d+\b/) || // Contains numbers (odds)
         textContent.toLowerCase().includes('pick') ||
         textContent.toLowerCase().includes('bet') ||
         textContent.toLowerCase().includes('lock') ||
         textContent.toLowerCase().includes('parlay') ||
         textContent.match(/[+-]\d{3}/)) // American odds format
      ) {
        tweets.push(textContent);
      }
    }

    return tweets.slice(0, 10).join('\n\n---\n\n');
  } catch (error) {
    console.error(`Error scraping ${username}:`, error);
    return '';
  }
}

async function extractPicksWithAI(content: string, username: string): Promise<ParsedPick[]> {
  if (!LOVABLE_API_KEY || !content) {
    console.log('Missing API key or content');
    return [];
  }

  const prompt = `Extract betting picks from these social media posts by ${username}.
For each clear betting pick, return:
- sport: NBA, NFL, MLB, NHL, Soccer, UFC, or other
- event_name: Team vs Team or Fighter vs Fighter
- market: Moneyline, Spread, Over/Under, etc.
- selection: The specific pick (team name, over/under value, etc.)
- odds: American odds as a number (e.g., -110, +150)
- stake_units: Units bet (default 1.0 if not specified)
- confidence: high, medium, or low
- reasoning: Why they like this pick (if mentioned)
- posted_at: Current timestamp

Only extract CLEAR betting picks with identifiable games/matches. Skip general commentary.

Posts:
${content}

Return as JSON array:
[{
  "sport": "NBA",
  "event_name": "Lakers vs Celtics",
  "market": "Moneyline",
  "selection": "Lakers",
  "odds": -110,
  "stake_units": 1.0,
  "confidence": "high",
  "reasoning": "Lakers are hot",
  "posted_at": "${new Date().toISOString()}"
}]`;

  try {
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
            content: 'You are a betting pick extractor. Extract structured betting data from social media posts. Return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('No valid JSON found in AI response');
      return [];
    }
    
    const picks = JSON.parse(jsonMatch[0]) as ParsedPick[];
    console.log(`Extracted ${picks.length} picks from ${username}`);
    return picks;
  } catch (error) {
    console.error('AI extraction error:', error);
    return [];
  }
}

async function saveCelebrityPicks(bettorUsername: string, picks: ParsedPick[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get bettor ID
  const { data: bettor, error: bettorError } = await supabase
    .from('public_bettors')
    .select('id')
    .eq('username', bettorUsername)
    .single();

  if (bettorError || !bettor) {
    console.error(`Bettor ${bettorUsername} not found:`, bettorError);
    return 0;
  }

  // Check for existing picks to avoid duplicates
  const { data: existingPicks } = await supabase
    .from('public_picks')
    .select('event_name, selection, posted_at')
    .eq('bettor_id', bettor.id)
    .gte('posted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const newPicks = picks.filter(pick => {
    return !existingPicks?.some(existing => 
      existing.event_name === pick.event_name &&
      existing.selection === pick.selection
    );
  });

  if (newPicks.length === 0) {
    console.log('No new picks to save');
    return 0;
  }

  const picksToInsert = newPicks.map(pick => ({
    bettor_id: bettor.id,
    ...pick,
    status: 'pending'
  }));

  const { error } = await supabase
    .from('public_picks')
    .insert(picksToInsert);

  if (error) {
    console.error('Error saving picks:', error);
    throw error;
  }

  console.log(`Saved ${newPicks.length} new picks for ${bettorUsername}`);
  return newPicks.length;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting celebrity pick scraping...');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all public bettors
    const { data: bettors, error: bettorsError } = await supabase
      .from('public_bettors')
      .select('username, display_name')
      .limit(100);

    if (bettorsError) {
      throw bettorsError;
    }

    console.log(`Found ${bettors?.length || 0} celebrity accounts to scrape`);

    // Start background scraping task
    const scrapeTask = async () => {
      let totalPicks = 0;
      const results: Record<string, number> = {};

      for (const bettor of bettors || []) {
        try {
          console.log(`Processing ${bettor.display_name} (@${bettor.username})`);
          
          // Scrape their recent posts
          const content = await scrapeTwitterProfile(bettor.username);
          if (!content) {
            console.log(`No content found for ${bettor.username}`);
            results[bettor.display_name] = 0;
            continue;
          }

          // Extract picks with AI
          const picks = await extractPicksWithAI(content, bettor.username);
          
          // Save picks
          const saved = await saveCelebrityPicks(bettor.username, picks);
          results[bettor.display_name] = saved;
          totalPicks += saved;

          console.log(`Processed ${bettor.display_name}: ${saved} new picks (Total: ${totalPicks})`);

          // Rate limiting - 3 seconds between accounts
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`Error processing ${bettor.username}:`, error);
          results[bettor.display_name] = 0;
        }
      }

      console.log(`Scraping complete! Total picks: ${totalPicks}`);
      console.log('Results by celebrity:', JSON.stringify(results, null, 2));
    };

    // Start background task without waiting
    EdgeRuntime.waitUntil(scrapeTask());

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Started scraping ${bettors?.length || 0} celebrity accounts. This will take approximately ${Math.ceil((bettors?.length || 0) * 3 / 60)} minutes.`,
        status: 'processing',
        accounts: bettors?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202
      }
    );
  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});