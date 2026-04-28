// Edge function: suggest-task-impact
// Suggests a roadmap_impact percentage (0-100) for a backlog task relative to its initiative

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SiblingTask {
  title: string;
  story_points?: number | null;
  roadmap_impact?: number | null;
}

interface RequestBody {
  task: { title: string; description?: string; story_points?: number | null };
  initiative: { title: string; description?: string };
  siblings?: SiblingTask[];
}

const SYSTEM_PROMPT = `Você é um Product Manager experiente. Estime quanto uma tarefa contribui (em %) para a conclusão de uma iniciativa do roadmap.
Considere o escopo da tarefa em relação ao escopo total da iniciativa, o esforço (story points) e como ela se compara às outras tarefas vinculadas.
A soma dos impactos das tarefas de uma mesma iniciativa idealmente fica próxima de 100%.
Seja realista: tarefas pequenas raramente passam de 15-20%, tarefas centrais podem chegar a 30-50%.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY não configurada' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body?.task?.title || !body?.initiative?.title) {
      return new Response(JSON.stringify({ error: 'task.title e initiative.title são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const siblingsText = (body.siblings || []).length === 0
      ? '(nenhuma outra tarefa vinculada)'
      : (body.siblings || []).map(s => `- "${s.title}" (pts: ${s.story_points ?? '?'}, impacto atual: ${s.roadmap_impact ?? 0}%)`).join('\n');

    const userPrompt = `Iniciativa do Roadmap:
Título: ${body.initiative.title}
Descrição: ${body.initiative.description || '(sem descrição)'}

Tarefa a estimar:
Título: ${body.task.title}
Descrição: ${body.task.description || '(sem descrição)'}
Story Points: ${body.task.story_points ?? '?'}

Outras tarefas já vinculadas a esta iniciativa (para calibrar):
${siblingsText}

Sugira o impacto percentual desta tarefa na conclusão da iniciativa.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_impact',
            description: 'Retorna o impacto estimado da tarefa na iniciativa',
            parameters: {
              type: 'object',
              properties: {
                impact: { type: 'integer', minimum: 0, maximum: 100, description: 'Impacto percentual (0-100)' },
                rationale: { type: 'string', description: 'Justificativa curta em português' },
                confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confiança de 0 a 1' },
              },
              required: ['impact', 'rationale', 'confidence'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_impact' } },
        temperature: 0.3,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('AI Gateway error:', aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de uso da IA atingido. Tente novamente em instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione saldo em Settings → Cloud & AI balance.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: `Falha na IA (${aiResp.status})` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) throw new Error('IA não retornou tool_call esperado');
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;

    const impact = Math.max(0, Math.min(100, Math.round(parsed.impact ?? 0)));
    return new Response(JSON.stringify({
      impact,
      rationale: parsed.rationale || '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('suggest-task-impact error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
