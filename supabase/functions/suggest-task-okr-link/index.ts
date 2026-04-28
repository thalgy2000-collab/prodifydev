const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KRInput { id: string; title: string; unit?: string; }
interface ObjectiveInput { id: string; title: string; quarter?: string; keyResults: KRInput[]; }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, objectives } = await req.json();
    if (!title || !Array.isArray(objectives) || objectives.length === 0) {
      return new Response(JSON.stringify({ error: 'title e objectives são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');

    const objectiveIds = objectives.map((o: ObjectiveInput) => o.id);
    const krIds = objectives.flatMap((o: ObjectiveInput) => o.keyResults.map(k => k.id));

    const okrCatalog = objectives.map((o: ObjectiveInput, i: number) => {
      const krs = o.keyResults.map((k, j) => `    - KR ${i + 1}.${j + 1} [${k.id}] ${k.title}${k.unit ? ` (${k.unit})` : ''}`).join('\n');
      return `Objetivo ${i + 1} [${o.id}]${o.quarter ? ` (${o.quarter})` : ''}: ${o.title}\n${krs || '    (sem KRs)'}`;
    }).join('\n\n');

    const systemPrompt = `Você é um Product Manager experiente. Sua tarefa é vincular uma tarefa de backlog ao Objetivo (OKR) e Key Result mais relevantes da lista fornecida. Sempre retorne IDs EXATOS da lista. Se nenhum item for verdadeiramente relevante, retorne objective_id e key_result_id como null. A confiança deve refletir o quão clara é a relação semântica (0.0 a 1.0).`;

    const userPrompt = `Tarefa:\nTítulo: ${title}\nDescrição: ${description || '(sem descrição)'}\n\nOKRs disponíveis:\n${okrCatalog}\n\nEscolha o objetivo e o KR mais relevantes (ou null se nada for adequado).`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'suggest_link',
            description: 'Retorna o objetivo e KR sugeridos para a tarefa.',
            parameters: {
              type: 'object',
              properties: {
                objective_id: { type: ['string', 'null'], description: 'ID do objetivo escolhido (deve estar na lista) ou null.' },
                key_result_id: { type: ['string', 'null'], description: 'ID do KR escolhido (deve pertencer ao objetivo) ou null.' },
                confidence: { type: 'number', description: 'Confiança da sugestão entre 0 e 1.' },
                rationale: { type: 'string', description: 'Justificativa curta (1-2 frases) em português.' },
              },
              required: ['objective_id', 'key_result_id', 'confidence', 'rationale'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'suggest_link' } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em instantes.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: 'Créditos da IA esgotados. Adicione créditos no workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const t = await resp.text();
      console.error('AI gateway error', resp.status, t);
      return new Response(JSON.stringify({ error: 'Erro no gateway de IA' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: any = {};
    try { parsed = args ? JSON.parse(args) : {}; } catch (e) { console.error('Failed parsing tool args', e); }

    // Sanitize: ensure ids exist in the provided lists
    let objective_id: string | null = parsed.objective_id ?? null;
    let key_result_id: string | null = parsed.key_result_id ?? null;
    if (objective_id && !objectiveIds.includes(objective_id)) objective_id = null;
    if (key_result_id && !krIds.includes(key_result_id)) key_result_id = null;
    // Ensure KR belongs to objective
    if (objective_id && key_result_id) {
      const obj = objectives.find((o: ObjectiveInput) => o.id === objective_id);
      if (!obj?.keyResults.some(k => k.id === key_result_id)) key_result_id = null;
    }

    return new Response(JSON.stringify({
      objective_id,
      key_result_id,
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
      rationale: typeof parsed.rationale === 'string' ? parsed.rationale : '',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('suggest-task-okr-link error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
