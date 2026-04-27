// Receives Google OAuth code, exchanges for tokens, stores per-user
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function htmlResponse(message: string, redirect?: string) {
  const meta = redirect ? `<meta http-equiv="refresh" content="2;url=${redirect}">` : '';
  return new Response(
    `<!doctype html><html><head>${meta}<title>Google Calendar</title>
    <style>body{font-family:system-ui;background:#0F0F0F;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px}</style>
    </head><body><div><h2>${message}</h2><p>Redirecionando…</p></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!;
  const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!;

  let returnUrl = '/agenda';
  let userId: string | null = null;
  if (stateRaw) {
    try {
      const parsed = JSON.parse(atob(stateRaw));
      userId = parsed.uid;
      if (parsed.r) returnUrl = parsed.r;
    } catch {}
  }

  if (errorParam) return htmlResponse(`Autorização cancelada: ${errorParam}`, returnUrl);
  if (!code || !userId) return htmlResponse('Parâmetros inválidos', returnUrl);

  try {
    const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description || 'Token exchange failed');

    // get email
    let email: string | null = null;
    try {
      const ui = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (ui.ok) email = (await ui.json()).email;
    } catch {}

    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.from('google_calendar_tokens').upsert({
      user_id: userId,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      expires_at: expiresAt,
      scope: tokens.scope,
      email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw error;

    return htmlResponse('✅ Google Calendar conectado!', returnUrl);
  } catch (e) {
    return htmlResponse(`Erro: ${(e as Error).message}`, returnUrl);
  }
});
