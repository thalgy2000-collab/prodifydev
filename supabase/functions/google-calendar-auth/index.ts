// Generates Google OAuth URL for the authenticated user
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!clientId || !supabaseUrl) throw new Error('Missing env');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth');

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Unauthorized');

    const body = await req.json().catch(() => ({}));
    const returnUrl: string = body.returnUrl || '';

    const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-callback`;
    // state encodes user_id and where to redirect back
    const state = btoa(JSON.stringify({ uid: user.id, r: returnUrl }));

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPES);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('include_granted_scopes', 'true');
    url.searchParams.set('state', state);

    return new Response(JSON.stringify({ url: url.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
