import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId } = await req.json();
    if (!taskId) throw new Error('taskId é obrigatório');

    // Inicializa o cliente do Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Busca a tarefa
    const { data: task, error: taskError } = await supabaseClient
      .from('backlog_tasks')
      .select('*, products(id)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) throw new Error('Tarefa não encontrada');

    // 2. Busca token de integração
    const { data: tokens, error: tokenError } = await supabaseClient
      .from('integration_tokens')
      .select('*')
      .eq('product_id', task.product_id);

    if (tokenError || !tokens || tokens.length === 0) {
      throw new Error('Nenhuma integração configurada para este produto');
    }

    // Pega o primeiro token disponível (Jira ou Linear)
    const tokenRecord = tokens[0];
    const provider = tokenRecord.provider; // 'jira' ou 'linear'

    let externalId = '';
    let externalUrl = '';

    if (provider === 'jira') {
      // Mock da requisição para o Jira (em um cenário real, faríamos um fetch para a API do Jira)
      // fetch(`${tokenRecord.workspace_url}/rest/api/3/issue`, { ... })
      externalId = `PROJ-${Math.floor(Math.random() * 1000)}`;
      externalUrl = `${tokenRecord.workspace_url || 'https://jira.com'}/browse/${externalId}`;
    } else if (provider === 'linear') {
      // Mock da requisição para o Linear
      externalId = `LIN-${Math.floor(Math.random() * 1000)}`;
      externalUrl = `https://linear.app/issue/${externalId}`;
    }

    // 3. Atualiza a tarefa no banco
    const { error: updateError } = await supabaseClient
      .from('backlog_tasks')
      .update({
        external_id: externalId,
        external_url: externalUrl,
        external_status: 'To Do',
        sync_provider: provider
      })
      .eq('id', taskId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, externalId, externalUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro na sincronização:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
