import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Buffer } from "node:buffer";
import { getDocumentProxy, extractText } from "https://esm.sh/unpdf@0.12.1";
import mammoth from "npm:mammoth@1.12.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_FILE_BYTES = 15 * 1024 * 1024;

const SYSTEM_PROMPT = `Você é um Product Manager experiente. Analise o conteúdo enviado e extraia ou gere uma lista de TAREFAS de backlog acionáveis.

Retorne APENAS um JSON válido, sem markdown, sem explicações, neste formato exato:
{
  "tasks": [
    {
      "title": "Título curto e claro da tarefa",
      "description": "Descrição detalhada do que deve ser feito",
      "priority": "high",
      "status": "open"
    }
  ]
}

Regras:
- priority deve ser "high", "medium" ou "low"
- status deve ser sempre "open"
- title deve ser objetivo e acionável (verbo no infinitivo: "Implementar...", "Criar...")
- description deve ter 1-3 frases explicando o escopo
- Gere entre 3 e 15 tarefas, quebrando o épico em partes menores e independentes`;

function extensionFromName(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0) return "";
  return fileName.slice(i + 1).toLowerCase();
}

async function extractTextFromUpload(fileBase64: string, fileName: string): Promise<string> {
  let buffer: Buffer;
  try { buffer = Buffer.from(fileBase64, "base64"); }
  catch { throw new Error("fileBase64 inválido"); }
  if (buffer.length === 0) throw new Error("Arquivo vazio");
  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error(`Arquivo muito grande (máx. ${MAX_FILE_BYTES / (1024 * 1024)} MB)`);
  }
  const ext = extensionFromName(fileName);
  if (ext === "pdf") {
    const uint8 = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8);
    const { text } = await extractText(pdf, { mergePages: true });
    const merged = (Array.isArray(text) ? text.join("\n") : text || "").trim();
    return merged.replace(/\n--\s*\d+\s+of\s+\d+\s+--\s*\n?/g, "\n").trim();
  }
  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || "").trim();
  }
  if (ext === "txt" || ext === "md" || ext === "csv") {
    return new TextDecoder("utf-8", { fatal: false }).decode(buffer).trim();
  }
  throw new Error(`Formato não suportado: .${ext || "?"}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as {
      fileBase64?: string;
      fileName?: string;
      text?: string;
    };

    let textForAi: string;
    if (body.fileBase64 && body.fileBase64.length > 0) {
      const name = body.fileName?.trim() || "upload.bin";
      textForAi = await extractTextFromUpload(body.fileBase64, name);
    } else if (body.text && body.text.trim().length > 0) {
      textForAi = body.text.trim();
    } else {
      return new Response(JSON.stringify({ error: "Envie 'text' ou 'fileBase64' + 'fileName'." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!textForAi) {
      return new Response(JSON.stringify({ error: "Não foi possível extrair texto." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analise o conteúdo abaixo e extraia tarefas:\n\n${textForAi}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(content); }
    catch {
      return new Response(JSON.stringify({ error: "IA retornou formato inválido", raw: content }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-tasks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
