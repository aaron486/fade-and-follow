import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  password: string;
  username: string;
  displayName: string;
  bettorLevel?: string;
}

interface BulkCreateRequest {
  users: TestUser[];
  currentUserId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { users, currentUserId }: BulkCreateRequest = await req.json();

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results = [];
    const errors = [];

    for (const user of users) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Auto-confirm for test accounts
          user_metadata: {
            username: user.username,
            display_name: user.displayName,
            bettor_level: user.bettorLevel || "Pro",
          },
        });

        if (authError) {
          errors.push({ email: user.email, error: authError.message });
          continue;
        }

        const newUserId = authData.user.id;

        // Create friendship with current user
        const user1Id = currentUserId < newUserId ? currentUserId : newUserId;
        const user2Id = currentUserId < newUserId ? newUserId : currentUserId;

        const { error: friendshipError } = await supabaseAdmin
          .from("friendships")
          .insert({
            user1_id: user1Id,
            user2_id: user2Id,
          });

        if (friendshipError) {
          console.error("Friendship creation error:", friendshipError);
        }

        results.push({
          email: user.email,
          username: user.username,
          userId: newUserId,
          success: true,
        });
      } catch (error: any) {
        errors.push({ email: user.email, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        errors,
        message: `Created ${results.length} users${errors.length > 0 ? `, ${errors.length} failed` : ""}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in bulk-create-test-users:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
