// Edge function: suggest-rice-scores
// Uses Google Gemini to suggest RICE values for a given task/initiative

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface KR {
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
}

interface HistoryEntry {
  title: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  score: number;
}

interface RequestBody {
  title: string;
  description?: string;
  keyResults?: KR[];
  history?: HistoryEntry[];
}

const SYSTEM_PROMPT = `Você é um especialista em Product Management e no framework RICE de priorização.
Analise a tarefa e o contexto do produto e sugira valores para os campos RICE.
Retorne APENAS um JSON válido neste formato:
{
  "reach": número inteiro (quantas pessoas impacta),
  "impact": número de 1 a 3 (1=baixo, 2=médio, 3=alto),
  "confidence": número inteiro de 0 a 100 (% de confiança),
  "effort": número decimal (semanas de trabalho),
  "justificativas": {
    "reach": "explicação curta em português",
    "impact": "explicação curta em português",
    "confidence": "explicação curta em português",
    "effort": "explicação curta em português"
  }
}
Calibre os valores com base no histórico de outras tarefas do produto para manter consistência.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = (await req.json()) as RequestBody;
    if (!body?.title || typeof body.title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Campo "title" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userPrompt = `Tarefa a priorizar:
Título: ${body.title}
Descrição: ${body.description || '(sem descrição)'}

Key Results do produto:
${(body.keyResults || []).length === 0 ? '(nenhum)' : (body.keyResults || []).map(k => `- ${k.title}: ${k.current_value}/${k.target_value} ${k.unit}`).join('\n')}

Histórico RICE de outras tarefas (para calibrar):
${(body.history || []).length === 0 ? '(sem histórico)' : (body.history || []).map(h => `- "${h.title}" → reach=${h.reach}, impact=${h.impact}, confidence=${h.confidence}, effort=${h.effort}, score=${h.score}`).join('\n')}

Sugira valores RICE coerentes com o contexto e o histórico acima.`;

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
        temperature: 0.4,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('AI Gateway error:', aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de uso da IA atingido. Tente novamente em instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione saldo em Settings → Cloud & AI balance.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({ error: `Falha na IA (${aiResp.status})`, details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await aiResp.json();
    const text = data?.choices?.[0]?.message?.content || '';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (_e) {
      // Try to extract JSON block
      const m = text.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error('Resposta da IA não é JSON válido');
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('suggest-rice-scores error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
