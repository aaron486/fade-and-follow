import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Sports betting news sources
const NEWS_SOURCES = [
  'https://www.espn.com/betting/',
  'https://www.covers.com/',
  'https://www.actionnetwork.com/',
  'https://www.vegasinsider.com/',
];

interface FeedItem {
  title: string;
  content: string;
  summary: string;
  sport: string;
  team_ids: string[];
  source_url: string;
}

async function fetchPageContent(url: string): Promise<string> {
  try {
    console.log('Fetching:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return '';
    }
    
    const html = await response.text();
    // Basic HTML to text conversion
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000); // Limit content size
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return '';
  }
}

async function processWithAI(content: string, source: string): Promise<FeedItem[]> {
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `Analyze this sports betting content and extract 3-5 betting insights.
For each insight, provide:
- title: Clear headline
- summary: 2-3 sentence summary
- content: Detailed analysis (2-3 paragraphs)
- sport: NBA, NFL, MLB, NHL, or Soccer
- team_ids: Array of team IDs mentioned (use numeric IDs from 1000-1999)

Source: ${source}
Content: ${content}

Return as JSON array with this structure:
[{
  "title": "string",
  "summary": "string", 
  "content": "string",
  "sport": "string",
  "team_ids": ["string"]
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
            content: 'You are a sports betting analyst. Extract betting insights and return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to your workspace.');
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No valid JSON found in AI response');
      return [];
    }
    
    const items = JSON.parse(jsonMatch[0]) as FeedItem[];
    return items.map(item => ({ ...item, source_url: source }));
  } catch (error) {
    console.error('AI processing error:', error);
    throw error;
  }
}

async function saveFeedItems(items: FeedItem[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase
    .from('feed_items')
    .insert(items);

  if (error) {
    console.error('Error saving feed items:', error);
    throw error;
  }

  console.log(`Saved ${items.length} feed items`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Admin-only function - verify user has admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting sports news scraping...');
    
    const allItems: FeedItem[] = [];
    
    for (const source of NEWS_SOURCES) {
      try {
        const content = await fetchPageContent(source);
        if (!content) continue;
        
        const items = await processWithAI(content, source);
        allItems.push(...items);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing ${source}:`, error);
        // Continue with other sources
      }
    }

    if (allItems.length > 0) {
      await saveFeedItems(allItems);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        itemsCreated: allItems.length,
        message: `Successfully processed ${allItems.length} betting insights`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
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