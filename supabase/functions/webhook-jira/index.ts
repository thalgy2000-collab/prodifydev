import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    
    // O Jira envia a chave da issue (ex: PROJ-123) no webhook (dependendo do evento)
    const issueKey = payload?.issue?.key;
    const newStatus = payload?.issue?.fields?.status?.name;

    if (!issueKey || !newStatus) {
      return new Response(JSON.stringify({ error: 'Payload inválido' }), { status: 400 });
    }

    // Usar a chave de serviço para bypass do RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Atualiza a tarefa correspondente
    const { error } = await supabaseClient
      .from('backlog_tasks')
      .update({ external_status: newStatus })
      .eq('external_id', issueKey)
      .eq('sync_provider', 'jira');

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error('Erro no webhook do Jira:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
