// Envia por e-mail (Resend) o lembrete diário das tarefas abertas da sprint ativa.
// Chamada pelo pg_cron a cada hora; só envia para quem escolheu a hora atual (BRT).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-cron-secret',
};

const APP_URL = Deno.env.get('APP_URL') ?? 'https://prodifydev.lovable.app';
const FROM = Deno.env.get('DIGEST_FROM') ?? 'Prodify <onboarding@resend.dev>';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const currentHourBRT = () =>
  Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo',
    }).format(new Date()),
  ) % 24;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Autenticação simples por segredo compartilhado com o cron
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    return new Response('RESEND_API_KEY não configurada', { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Permite teste manual: { "force": true, "userId": "..." } ignora a hora
  const body = await req.json().catch(() => ({}));
  const hour = currentHourBRT();

  let usersQuery = supabase
    .from('profiles')
    .select('id, email, display_name, sprint_digest_hour')
    .eq('sprint_digest_enabled', true)
    .not('email', 'is', null);
  if (body.userId) usersQuery = usersQuery.eq('id', body.userId);
  else if (!body.force) usersQuery = usersQuery.eq('sprint_digest_hour', hour);

  const { data: users, error: usersErr } = await usersQuery;
  if (usersErr) {
    return new Response(JSON.stringify({ error: usersErr.message }), { status: 500, headers: corsHeaders });
  }

  let sent = 0;
  const skipped: string[] = [];

  for (const user of users ?? []) {
    // Produtos dos quais o usuário é membro
    const { data: memberships } = await supabase
      .from('product_members').select('product_id').eq('user_id', user.id);
    const { data: owned } = await supabase
      .from('products').select('id').eq('owner_id', user.id);
    const productIds = [...new Set([
      ...(memberships ?? []).map((m: any) => m.product_id),
      ...(owned ?? []).map((p: any) => p.id),
    ])];
    if (productIds.length === 0) { skipped.push(`${user.email}: sem produtos`); continue; }

    const { data: sprints } = await supabase
      .from('sprints').select('id, name, goal, end_date, product_id')
      .eq('status', 'active').in('product_id', productIds);
    if (!sprints || sprints.length === 0) { skipped.push(`${user.email}: sem sprint ativa`); continue; }

    const { data: products } = await supabase
      .from('products').select('id, name').in('id', productIds);
    const productName = new Map((products ?? []).map((p: any) => [p.id, p.name]));

    let sections = '';
    let totalOpen = 0;

    for (const sprint of sprints) {
      const { data: tasks } = await supabase
        .from('backlog_tasks').select('id, title, status, assignee_id, due_date')
        .eq('sprint_id', sprint.id);
      const all = tasks ?? [];
      const done = all.filter((t: any) => t.status === 'done').length;
      // Minhas tarefas abertas = atribuídas a mim OU sem responsável
      const open = all.filter((t: any) =>
        t.status !== 'done' && (t.assignee_id === user.id || !t.assignee_id));
      if (open.length === 0) continue;
      totalOpen += open.length;

      const items = open.map((t: any) =>
        `<li style="margin:4px 0">${esc(t.title)}${t.due_date ? ` <span style="color:#888">(até ${t.due_date.split('-').reverse().join('/')})</span>` : ''}</li>`,
      ).join('');

      sections += `
        <h3 style="margin:24px 0 4px">${esc(sprint.name)} <span style="font-weight:normal;color:#888">— ${esc(productName.get(sprint.product_id) ?? '')}</span></h3>
        <p style="margin:0 0 8px;color:#555">${done} de ${all.length} tarefas concluídas</p>
        <ul style="padding-left:20px;margin:0">${items}</ul>`;
    }

    // Nada aberto = nada a perguntar, não envia
    if (totalOpen === 0) { skipped.push(`${user.email}: nada em aberto`); continue; }

    const name = esc(user.display_name ?? 'tudo bem');
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
        <h2 style="margin-bottom:4px">Olá, ${name}! 👋</h2>
        <p>Você já realizou alguma dessas atividades da sprint atual?</p>
        ${sections}
        <p style="margin-top:28px">
          <a href="${APP_URL}/sprints" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Abrir sprint no Prodify</a>
        </p>
        <p style="color:#999;font-size:12px;margin-top:32px">Você recebe este lembrete diário porque ativou a opção em Perfil → App. Para parar, desative lá.</p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [user.email],
        subject: `Sprint: ${totalOpen} ${totalOpen === 1 ? 'atividade em aberto' : 'atividades em aberto'} — já fez alguma?`,
        html,
      }),
    });

    if (res.ok) sent++;
    else skipped.push(`${user.email}: Resend ${res.status} ${await res.text()}`);
  }

  return new Response(JSON.stringify({ hour, sent, skipped }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
