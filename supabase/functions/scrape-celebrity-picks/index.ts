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

interface ScrapedContent {
  text: string;
  images: string[];
}

async function scrapeTwitterProfile(username: string): Promise<ScrapedContent> {
  // Try multiple Nitter instances as fallbacks
  const nitterInstances = [
    'https://nitter.net',
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
    'https://nitter.esmailelbob.xyz',
    'https://nitter.lunar.icu'
  ];

  for (const baseUrl of nitterInstances) {
    try {
      const nitterUrl = `${baseUrl}/${username}`;
      console.log(`Trying to scrape ${nitterUrl}`);
      
      const response = await fetch(nitterUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const html = await response.text();
        console.log(`Successfully fetched from ${baseUrl}`);
        
        const tweets: string[] = [];
        const images: string[] = [];
        
        // Extract tweet content and images
        const tweetPattern = /<div class="tweet-content[^>]*>([\s\S]*?)<\/div>/gi;
        let match;
        
        while ((match = tweetPattern.exec(html)) !== null) {
          const tweetHtml = match[1];
          
          // Extract images from this tweet
          const imgPattern = /<img[^>]+src="([^"]+)"[^>]*>/gi;
          let imgMatch;
          while ((imgMatch = imgPattern.exec(tweetHtml)) !== null) {
            const imgSrc = imgMatch[1];
            // Convert relative URLs to absolute
            const fullUrl = imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc}`;
            images.push(fullUrl);
          }
          
          // Extract text
          const textContent = tweetHtml
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Include tweets with betting keywords or images
          if (
            textContent.length > 20 &&
            (textContent.match(/\b\d+\b/) ||
             textContent.toLowerCase().includes('pick') ||
             textContent.toLowerCase().includes('potd') ||
             textContent.toLowerCase().includes('bet') ||
             textContent.toLowerCase().includes('lock') ||
             textContent.toLowerCase().includes('parlay') ||
             textContent.match(/[+-]\d{3}/))
          ) {
            tweets.push(textContent);
          }
        }

        if (tweets.length > 0 || images.length > 0) {
          console.log(`Found ${tweets.length} tweets and ${images.length} images from ${username}`);
          return {
            text: tweets.slice(0, 10).join('\n\n---\n\n'),
            images: images.slice(0, 15) // Limit to 15 images
          };
        }
        
        console.log(`No betting-related content found for ${username}`);
        return { text: '', images: [] };
      }
      
      console.log(`${baseUrl} returned status ${response.status}, trying next instance...`);
    } catch (error) {
      console.error(`Error with ${baseUrl}:`, error instanceof Error ? error.message : 'Unknown error');
      // Continue to next instance
    }
  }

  console.log(`All Nitter instances failed for ${username}`);
  return { text: '', images: [] };
}

async function extractPicksFromImages(images: string[], username: string): Promise<ParsedPick[]> {
  if (!LOVABLE_API_KEY || images.length === 0) {
    return [];
  }

  const allPicks: ParsedPick[] = [];

  // Process images in batches to avoid overwhelming the API
  for (const imageUrl of images.slice(0, 10)) {
    try {
      console.log(`Analyzing image: ${imageUrl}`);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this betting pick image from ${username}. Extract:
- sport (NBA, NFL, MLB, NHL, Soccer, UFC, etc.)
- event_name (Team vs Team format)
- market (Moneyline, Spread, Over/Under, Player Props, etc.)
- selection (the specific pick)
- odds (American odds like -110, +150)
- stake_units (if mentioned, default 1.0)
- confidence (high/medium/low based on their language)
- reasoning (why they like this pick)

Return as JSON array. If no clear pick, return empty array [].
Example: [{"sport":"NBA","event_name":"Lakers vs Celtics","market":"Spread","selection":"Lakers -5.5","odds":-110,"stake_units":1.0,"confidence":"high","reasoning":"Lakers dominant at home","posted_at":"${new Date().toISOString()}"}]`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const picks = JSON.parse(jsonMatch[0]) as ParsedPick[];
          allPicks.push(...picks);
          console.log(`Extracted ${picks.length} picks from image`);
        }
      }

      // Rate limit between image requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error analyzing image ${imageUrl}:`, error);
    }
  }

  return allPicks;
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
- market: Moneyline, Spread, Over/Under, Player Props, etc.
- selection: The specific pick (team name, over/under value, player prop, etc.)
- odds: American odds as a number (e.g., -110, +150)
- stake_units: Units bet (default 1.0 if not specified)
- confidence: high, medium, or low
- reasoning: Why they like this pick (if mentioned)
- posted_at: Current timestamp

Look for POTD (Pick of the Day) posts especially.
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
    console.log(`Extracted ${picks.length} picks from text`);
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

    // Create scraping job record
    const { data: job } = await supabase
      .from('scraping_jobs')
      .insert({
        job_type: 'celebrity_picks',
        status: 'running',
        total_accounts: bettors?.length || 0,
        processed_accounts: 0,
        successful_picks: 0,
        failed_accounts: 0
      })
      .select()
      .single();

    // Start background scraping task
    const scrapeTask = async () => {
      let totalPicks = 0;
      const results: Record<string, number> = {};
      let processedCount = 0;
      let failedCount = 0;

      for (const bettor of bettors || []) {
        try {
          console.log(`Processing ${bettor.display_name} (@${bettor.username})`);
          
          // Update current account being processed
          if (job) {
            await supabase
              .from('scraping_jobs')
              .update({
                current_account: bettor.display_name,
                processed_accounts: processedCount
              })
              .eq('id', job.id);
          }
          
          // Scrape their recent posts
          const content = await scrapeTwitterProfile(bettor.username);
          if (!content.text && content.images.length === 0) {
            console.log(`No content found for ${bettor.username}`);
            results[bettor.display_name] = 0;
            failedCount++;
            processedCount++;
            continue;
          }

          // Extract picks from text with AI
          const textPicks = content.text ? await extractPicksWithAI(content.text, bettor.username) : [];
          
          // Extract picks from images with vision AI
          const imagePicks = content.images.length > 0 ? await extractPicksFromImages(content.images, bettor.username) : [];
          
          // Combine all picks
          const picks = [...textPicks, ...imagePicks];
          
          // Save picks
          const saved = await saveCelebrityPicks(bettor.username, picks);
          results[bettor.display_name] = saved;
          totalPicks += saved;
          processedCount++;

          console.log(`Processed ${bettor.display_name}: ${saved} new picks (Total: ${totalPicks})`);

          // Update job progress
          if (job) {
            await supabase
              .from('scraping_jobs')
              .update({
                processed_accounts: processedCount,
                successful_picks: totalPicks,
                failed_accounts: failedCount
              })
              .eq('id', job.id);
          }

          // Rate limiting - 5 seconds between accounts to avoid overwhelming instances
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(`Error processing ${bettor.username}:`, error);
          results[bettor.display_name] = 0;
          failedCount++;
          processedCount++;
          
          // Update job with error
          if (job) {
            await supabase
              .from('scraping_jobs')
              .update({
                processed_accounts: processedCount,
                failed_accounts: failedCount
              })
              .eq('id', job.id);
          }
        }
      }

      console.log(`Scraping complete! Total picks: ${totalPicks}`);
      console.log('Results by celebrity:', JSON.stringify(results, null, 2));
      
      // Mark job as completed
      if (job) {
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            processed_accounts: processedCount,
            successful_picks: totalPicks,
            failed_accounts: failedCount
          })
          .eq('id', job.id);
      }
    };

    // Start background task without waiting
    EdgeRuntime.waitUntil(scrapeTask());

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Started scraping ${bettors?.length || 0} celebrity accounts. This will take approximately ${Math.ceil((bettors?.length || 0) * 5 / 60)} minutes.`,
        status: 'processing',
        accounts: bettors?.length || 0,
        job_id: job?.id
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