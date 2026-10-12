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
  // Data de hoje em Brasília no formato YYYY-MM-DD (comparável com as datas das tarefas)
  const nowBRT = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(nowBRT);
  const weekdayBRT = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Sao_Paulo' }).format(nowBRT);
  // Toda segunda-feira (ou quando forçado via includeUpcoming) envia também o planejamento completo da sprint
  const isMonday = weekdayBRT === 'Mon' || Boolean(body.includeUpcoming);

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
    let totalOverdue = 0;
    let totalToday = 0;
    let totalUpcoming = 0;

    const fmt = (d: string) => d.split('-').reverse().join('/');

    interface DigestItem {
      title: string;
      parentTitle?: string;
      effectiveDate: string;
      dueTime?: string | null;
      sortOrder: number;
    }

    const renderGroupedByDate = (rows: DigestItem[], color: string) => {
      const byDate = new Map<string, DigestItem[]>();
      for (const item of rows) {
        const arr = byDate.get(item.effectiveDate) ?? [];
        arr.push(item);
        byDate.set(item.effectiveDate, arr);
      }

      let out = '';
      for (const [dateStr, dateItems] of byDate.entries()) {
        const itemsHtml = dateItems.map((item) => {
          const timePart = item.dueTime ? ` <span style="color:${color}">(às ${esc(item.dueTime.slice(0, 5))})</span>` : '';
          const parentPart = item.parentTitle
            ? `<div style="font-size:12px;color:#777;margin-top:2px">↳ ${esc(item.parentTitle)}</div>`
            : '';
          return `<div style="margin:6px 0 8px 0"><div>${esc(item.title)}${timePart}</div>${parentPart}</div>`;
        }).join('');

        out += `
          <div style="margin:12px 0 14px 0">
            <div style="font-weight:bold;color:#111;margin-bottom:4px">${fmt(dateStr)}</div>
            ${itemsHtml}
          </div>`;
      }
      return out;
    };

    for (const sprint of sprints) {
      const { data: tasks } = await supabase
        .from('backlog_tasks').select('id, title, status, assignee_id, due_date')
        .eq('sprint_id', sprint.id);
      const all = tasks ?? [];

      const openTasks = all.filter((t: any) => t.status !== 'done' && (t.assignee_id === user.id || !t.assignee_id));
      if (openTasks.length === 0) continue;

      const taskIds = openTasks.map((t: any) => t.id);
      const { data: criteriaRows } = await supabase
        .from('acceptance_criteria')
        .select('id, task_id, title, completed, due_date, due_time, sort_order')
        .in('task_id', taskIds)
        .order('sort_order', { ascending: true });

      const criteriaByTask = new Map<string, any[]>();
      for (const c of criteriaRows ?? []) {
        const arr = criteriaByTask.get(c.task_id) ?? [];
        arr.push(c);
        criteriaByTask.set(c.task_id, arr);
      }

      const items: DigestItem[] = [];
      for (const t of openTasks) {
        const taskCriteria = criteriaByTask.get(t.id) ?? [];
        if (taskCriteria.length > 0) {
          // Segue as datas das subtarefas (critérios de aceite) não concluídas
          for (const c of taskCriteria) {
            if (c.completed) continue;
            const effectiveDate = c.due_date ?? t.due_date ?? sprint.end_date;
            if (!effectiveDate) continue;
            items.push({
              title: c.title,
              parentTitle: t.title,
              effectiveDate,
              dueTime: c.due_time,
              sortOrder: c.sort_order ?? 0,
            });
          }
        } else {
          // Sem subtarefas: usa a data da própria tarefa (ou fim da sprint)
          const effectiveDate = t.due_date ?? sprint.end_date;
          if (!effectiveDate) continue;
          items.push({
            title: t.title,
            effectiveDate,
            dueTime: null,
            sortOrder: 0,
          });
        }
      }

      const sortFn = (a: DigestItem, b: DigestItem) =>
        a.effectiveDate.localeCompare(b.effectiveDate) ||
        (a.dueTime ?? '99:99').localeCompare(b.dueTime ?? '99:99') ||
        a.sortOrder - b.sortOrder;

      const overdue = items.filter((i) => i.effectiveDate < today).sort(sortFn);
      const dueToday = items.filter((i) => i.effectiveDate === today).sort(sortFn);
      // Só inclui as próximas da sprint nas segundas-feiras
      const upcoming = isMonday ? items.filter((i) => i.effectiveDate > today).sort(sortFn) : [];

      if (overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0) continue;

      totalOverdue += overdue.length;
      totalToday += dueToday.length;
      totalUpcoming += upcoming.length;

      sections += `
        <h3 style="margin:24px 0 4px">${esc(sprint.name)} <span style="font-weight:normal;color:#888">— ${esc(productName.get(sprint.product_id) ?? '')}</span></h3>`;
      if (dueToday.length > 0) {
        sections += `
        <p style="margin:14px 0 6px;font-weight:bold;color:#16a34a">📅 Para hoje (${dueToday.length})</p>
        ${renderGroupedByDate(dueToday, '#16a34a')}`;
      }
      if (overdue.length > 0) {
        sections += `
        <p style="margin:14px 0 6px;font-weight:bold;color:#b91c1c">⚠️ Atrasadas (${overdue.length})</p>
        ${renderGroupedByDate(overdue, '#b91c1c')}`;
      }
      if (upcoming.length > 0) {
        sections += `
        <p style="margin:14px 0 6px;font-weight:bold;color:#2563eb">🚀 Planejamento da semana na Sprint (${upcoming.length})</p>
        ${renderGroupedByDate(upcoming, '#555')}`;
      }
    }

    const total = totalToday + totalOverdue + totalUpcoming;
    if (total === 0) { skipped.push(`${user.email}: nada para hoje/atrasado`); continue; }

    const name = esc(user.display_name ?? 'tudo bem');
    const introText = isMonday
      ? 'Boa semana! Aqui estão suas atividades de hoje, eventuais pendências atrasadas e o cronograma completo da sua sprint para a semana:'
      : 'Estas são as atividades da sua sprint programadas para hoje e as que estão atrasadas. Já realizou alguma?';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
        <h2 style="margin-bottom:4px">Bom dia, ${name}! ☀️</h2>
        <p>${introText}</p>
        ${sections}
        <p style="margin-top:28px">
          <a href="${APP_URL}/sprints" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Abrir sprint no Prodify</a>
        </p>
        <p style="color:#999;font-size:12px;margin-top:32px">Você recebe este lembrete diário porque ativou a opção em Perfil → App. Para parar, desative lá.</p>
      </div>`;

    const parts = [
      totalToday > 0 ? `${totalToday} para hoje` : '',
      totalOverdue > 0 ? `${totalOverdue} atrasada${totalOverdue === 1 ? '' : 's'}` : '',
      isMonday && totalUpcoming > 0 ? `${totalUpcoming} na semana` : '',
    ].filter(Boolean).join(' · ');

    const subjectPrefix = isMonday ? 'Planejamento da Sprint' : 'Sprint de hoje';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [user.email],
        subject: `${subjectPrefix}: ${parts} (${total} ${total === 1 ? 'atividade' : 'atividades'})`,
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
