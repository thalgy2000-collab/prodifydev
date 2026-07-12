// Pushes a Prodify schedule_activity to Google Calendar (create or update)
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

    // Authenticate user
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if (uerr || !user) throw new Error('Unauthorized');

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Get Google Calendar token (same table as google-calendar-events)
    const { data: tokenRow } = await admin
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!tokenRow) {
      return new Response(JSON.stringify({ error: 'Google Calendar not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if scope includes calendar.events (not just readonly)
    if (tokenRow.scope && !tokenRow.scope.includes('calendar.events')) {
      return new Response(JSON.stringify({ 
        error: 'scope_upgrade_required',
        message: 'Reconecte o Google Calendar para obter permissão de escrita.' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Refresh access token if expired
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

    const body = await req.json();
    const { activity_id } = body;

    if (!activity_id) throw new Error('Missing activity_id');

    // Fetch the activity from Prodify
    const { data: activity, error: actErr } = await admin
      .from('schedule_activities')
      .select('*')
      .eq('id', activity_id)
      .single();

    if (actErr || !activity) throw new Error('Activity not found');

    // Build Google Calendar event body
    const startTime = activity.start_time || '09:00';
    const endTime = activity.end_time || '10:00';
    const eventBody: Record<string, any> = {
      summary: activity.title,
      description: activity.description ?? '',
    };

    // Build start/end — use dateTime with timezone offset
    const actDate = activity.activity_date; // 'YYYY-MM-DD'
    eventBody.start = { dateTime: `${actDate}T${startTime}:00`, timeZone: 'America/Sao_Paulo' };
    eventBody.end = { dateTime: `${actDate}T${endTime}:00`, timeZone: 'America/Sao_Paulo' };

    let googleEventId = activity.google_event_id;

    if (googleEventId) {
      // Update existing event
      const patchRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        }
      );
      if (!patchRes.ok) {
        const errData = await patchRes.json();
        // If event was deleted on Google side, create a new one
        if (patchRes.status === 404 || patchRes.status === 410) {
          googleEventId = null; // will fall through to create
        } else {
          throw new Error(errData.error?.message || 'Failed to update event');
        }
      }
    }

    if (!googleEventId) {
      // Create new event
      const createRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        }
      );
      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error?.message || 'Failed to create event');
      }
      const created = await createRes.json();
      googleEventId = created.id;
    }

    // Save the google_event_id back to Prodify
    await admin
      .from('schedule_activities')
      .update({ google_event_id: googleEventId })
      .eq('id', activity_id);

    return new Response(JSON.stringify({ success: true, google_event_id: googleEventId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = (e as Error).message;
    return new Response(JSON.stringify({ error: msg }), {
      status: msg === 'Unauthorized' ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
