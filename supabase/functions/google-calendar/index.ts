// Supabase Edge Function: google-calendar
// Handles three actions:
//   POST /google-calendar { action: "exchange", code, redirect_uri }  → exchange auth code for tokens
//   POST /google-calendar { action: "events", date_min, date_max }    → fetch calendar events
//   POST /google-calendar { action: "disconnect" }                    → remove stored tokens

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

async function exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  return res.json();
}

async function getValidAccessToken(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string> {
  const { data: row, error } = await supabase
    .from("google_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !row) {
    throw new Error("Google Calendar not connected");
  }

  // Check if current access token is still valid (with 5-min buffer)
  const expiresAt = row.expires_at ? new Date(row.expires_at) : new Date(0);
  const now = new Date(Date.now() + 5 * 60 * 1000);

  if (row.access_token && expiresAt > now) {
    return row.access_token;
  }

  // Refresh the token
  const tokens = await refreshAccessToken(row.refresh_token);
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await supabase
    .from("google_tokens")
    .update({
      access_token: tokens.access_token,
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return tokens.access_token;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the request via Supabase JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify user from their JWT
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // === EXCHANGE: auth code → tokens ===
    if (action === "exchange") {
      const { code, redirect_uri } = body;
      const tokens = await exchangeCode(code, redirect_uri);

      if (!tokens.refresh_token) {
        return new Response(
          JSON.stringify({ error: "No refresh token received. Please revoke app access in Google account settings and try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Upsert token row
      await supabase.from("google_tokens").upsert({
        user_id: user.id,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ connected: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === EVENTS: fetch calendar events ===
    if (action === "events") {
      const { date_min, date_max } = body;
      const accessToken = await getValidAccessToken(supabase, user.id);

      const params = new URLSearchParams({
        timeMin: `${date_min}T00:00:00Z`,
        timeMax: `${date_max}T23:59:59Z`,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "100",
      });

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google Calendar API error: ${errText}`);
      }

      const data = await res.json();

      // Map to a lean event shape
      const events = (data.items ?? []).map((item: Record<string, unknown>) => ({
        id: item.id,
        summary: item.summary ?? "(No title)",
        start: (item.start as Record<string, string>)?.dateTime ?? (item.start as Record<string, string>)?.date,
        end: (item.end as Record<string, string>)?.dateTime ?? (item.end as Record<string, string>)?.date,
        allDay: !!(item.start as Record<string, string>)?.date,
        location: item.location,
        htmlLink: item.htmlLink,
      }));

      return new Response(JSON.stringify({ events }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === DISCONNECT: remove stored tokens ===
    if (action === "disconnect") {
      await supabase.from("google_tokens").delete().eq("user_id", user.id);
      return new Response(JSON.stringify({ connected: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
