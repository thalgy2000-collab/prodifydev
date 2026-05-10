import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    
    // O Linear envia dados diferentes no webhook
    const action = payload?.action;
    const type = payload?.type;
    
    if (type !== 'Issue' || action !== 'update') {
      return new Response(JSON.stringify({ message: 'Evento ignorado' }), { status: 200 });
    }

    const issueIdentifier = payload?.data?.identifier; // ex: LIN-123
    const newStatus = payload?.data?.state?.name;

    if (!issueIdentifier || !newStatus) {
      return new Response(JSON.stringify({ error: 'Payload incompleto' }), { status: 400 });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseClient
      .from('backlog_tasks')
      .update({ external_status: newStatus })
      .eq('external_id', issueIdentifier)
      .eq('sync_provider', 'linear');

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error('Erro no webhook do Linear:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
