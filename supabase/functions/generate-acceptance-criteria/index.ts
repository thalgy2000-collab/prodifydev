const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { title, description } = await req.json();
    if (!title || typeof title !== 'string') {
      return new Response(JSON.stringify({ error: 'title é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');

    const systemPrompt = `Você é um Product Manager experiente. Dada uma tarefa, gere entre 3 e 7 critérios de aceite claros, testáveis, em português, no estilo checklist (frases curtas, verbos no infinitivo ou "Deve..."). Não numere. Não inclua explicações.`;
    const userPrompt = `Título da tarefa: ${title}\n\nDescrição: ${description || '(sem descrição)'}\n\nGere os critérios de aceite.`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_criteria',
            description: 'Retorna a lista de critérios de aceite gerados.',
            parameters: {
              type: 'object',
              properties: {
                criteria: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Lista de critérios de aceite (3 a 7 itens).',
                },
              },
              required: ['criteria'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_criteria' } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos da IA esgotados. Adicione créditos no workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await resp.text();
      console.error('AI gateway error', resp.status, t);
      return new Response(JSON.stringify({ error: 'Erro no gateway de IA' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let criteria: string[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        criteria = Array.isArray(parsed.criteria) ? parsed.criteria : [];
      } catch (e) {
        console.error('Failed parsing tool args', e);
      }
    }
    criteria = criteria.map((s) => String(s).trim()).filter(Boolean).slice(0, 10);

    return new Response(JSON.stringify({ criteria }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-acceptance-criteria error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
