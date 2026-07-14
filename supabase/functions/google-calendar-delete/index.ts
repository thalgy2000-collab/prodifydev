// Deletes a Google Calendar event linked to a Prodify schedule_activity
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Refresh failed');
  return data as { access_token: string; expires_in: number };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth');

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { google_event_id } = await req.json();
    if (!google_event_id) throw new Error('Missing google_event_id');

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: tokenRow } = await admin
      .from('google_calendar_tokens').select('*').eq('user_id', user.id).maybeSingle();
    if (!tokenRow) return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    let accessToken = tokenRow.access_token;
    const expired = !tokenRow.expires_at || new Date(tokenRow.expires_at).getTime() < Date.now() + 60_000;
    if (expired) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token);
      accessToken = refreshed.access_token;
      await admin.from('google_calendar_tokens').update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${google_event_id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
    );
    // 404/410 = já removido no Google, tratamos como sucesso
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const err = await res.text();
      throw new Error(`Delete failed: ${err}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
