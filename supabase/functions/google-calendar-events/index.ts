// Fetches user's Google Calendar events using stored refresh_token
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
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if (uerr || !user) throw new Error('Unauthorized');

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: tokenRow } = await admin
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!tokenRow) {
      return new Response(JSON.stringify({ connected: false, events: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken: string = tokenRow.access_token;
    const expired = !tokenRow.expires_at || new Date(tokenRow.expires_at).getTime() < Date.now() + 60_000;
    if (expired) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token);
      accessToken = refreshed.access_token;
      const newExpires = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await admin.from('google_calendar_tokens').update({
        access_token: accessToken,
        expires_at: newExpires,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    }

    const { searchParams } = new URL(req.url);
    const timeMin = searchParams.get('timeMin') || new Date(Date.now() - 7 * 86400000).toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 60 * 86400000).toISOString();

    const evUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    evUrl.searchParams.set('timeMin', timeMin);
    evUrl.searchParams.set('timeMax', timeMax);
    evUrl.searchParams.set('singleEvents', 'true');
    evUrl.searchParams.set('orderBy', 'startTime');
    evUrl.searchParams.set('maxResults', '250');

    const evRes = await fetch(evUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const evData = await evRes.json();
    if (!evRes.ok) throw new Error(evData.error?.message || 'Calendar fetch failed');

    const events = (evData.items || []).map((e: any) => ({
      id: e.id,
      title: e.summary || '(sem título)',
      description: e.description || '',
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      allDay: !e.start?.dateTime,
      htmlLink: e.htmlLink,
      location: e.location || null,
    }));

    return new Response(JSON.stringify({ connected: true, email: tokenRow.email, events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
