import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Buffer } from "node:buffer";
import { PDFParse } from "npm:pdf-parse@2.4.5";
import mammoth from "npm:mammoth@1.12.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_FILE_BYTES = 15 * 1024 * 1024;

const SYSTEM_PROMPT = `Você é um especialista em OKRs. Analise o conteúdo do arquivo enviado e extraia ou sugira Objetivos e Key Results estruturados.

Retorne APENAS um JSON válido, sem markdown, sem explicações, neste formato exato:
{
  "objectives": [
    {
      "title": "Título do objetivo",
      "category": "professional",
      "quarter": "Q2 2026",
      "key_results": [
        {
          "title": "Título do KR",
          "current_value": 0,
          "target_value": 100,
          "unit": "%"
        }
      ]
    }
  ]
}

Regras:
- category deve ser sempre "professional"
- quarter deve ser o trimestre mais próximo do contexto ou "Q2 2026"
- unit pode ser "%", "un", "R$", "h" conforme o contexto
- Gere no mínimo 1 e no máximo 5 objetivos
- Cada objetivo deve ter entre 1 e 4 key results`;

function extensionFromName(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0) return "";
  return fileName.slice(i + 1).toLowerCase();
}

async function extractTextFromUpload(
  fileBase64: string,
  fileName: string,
): Promise<string> {
  let buffer: Buffer;
  try {
    buffer = Buffer.from(fileBase64, "base64");
  } catch {
    throw new Error("fileBase64 inválido");
  }
  if (buffer.length === 0) {
    throw new Error("Arquivo vazio");
  }
  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error(`Arquivo muito grande (máx. ${MAX_FILE_BYTES / (1024 * 1024)} MB)`);
  }

  const ext = extensionFromName(fileName);

  if (ext === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      let text = (result.text || "").trim();
      text = text.replace(/\n--\s*\d+\s+of\s+\d+\s+--\s*\n?/g, "\n").trim();
      return text;
    } finally {
      await parser.destroy();
    }
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || "").trim();
  }

  if (ext === "txt" || ext === "md" || ext === "csv") {
    return new TextDecoder("utf-8", { fatal: false }).decode(buffer).trim();
  }

  throw new Error(`Formato não suportado para extração: .${ext || "?"}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as {
      fileBase64?: string;
      fileName?: string;
      /** @deprecated enviar fileBase64 + fileName ou text */
      fileContent?: string;
      text?: string;
      product_id?: string;
      quarter?: string;
    };

    let textForAi: string;

    if (body.fileBase64 != null && typeof body.fileBase64 === "string" && body.fileBase64.length > 0) {
      const name = typeof body.fileName === "string" && body.fileName.trim()
        ? body.fileName.trim()
        : "upload.bin";
      textForAi = await extractTextFromUpload(body.fileBase64, name);
    } else if (body.text != null && typeof body.text === "string" && body.text.trim().length > 0) {
      textForAi = body.text.trim();
    } else if (body.fileContent != null && typeof body.fileContent === "string") {
      textForAi = body.fileContent.trim();
    } else {
      return new Response(
        JSON.stringify({ error: "Envie 'text' (conteúdo) ou 'fileBase64' + 'fileName'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const quarterHint = typeof body.quarter === "string" && body.quarter.trim()
      ? body.quarter.trim()
      : "Q2 2026";

    if (!textForAi) {
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair texto do arquivo. Tente outro PDF ou formato." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Trimestre alvo: ${quarterHint}.\n\nAnalise o seguinte conteúdo e extraia OKRs:\n\n${textForAi}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(JSON.stringify({ error: "IA retornou formato inválido", raw: content }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-okrs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
