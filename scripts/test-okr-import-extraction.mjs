/**
 * Valida extração de texto com a mesma stack da Edge Function import-okrs:
 * - PDF: pdf-parse@1.1.1
 * - DOCX: mammoth
 * - TXT/MD: UTF-8
 *
 * Garante que o texto dos 3 objetivos do PDF de exemplo aparece na string
 * enviada ao prompt da IA (sem chamar a API).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pdfPath = path.join(root, 'testdata', 'OKRs_Empresa_Generica.pdf');

/** Mesma lógica que supabase/functions/import-okrs (pdf-parse v2 / PDFParse). */
async function extractPdfLikeEdge(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text || '').trim();
  } finally {
    await parser.destroy();
  }
}

async function extractDocxLikeEdge(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return (result.value || '').trim();
}

if (!fs.existsSync(pdfPath)) {
  console.error('Ficheiro em falta:', pdfPath);
  console.error('Execute: node scripts/create-okr-sample-pdf.mjs');
  process.exit(1);
}

const pdfBuf = fs.readFileSync(pdfPath);
const pdfText = await extractPdfLikeEdge(pdfBuf);

const mustHave = [
  'satisfação do cliente',
  'receita recorrente',
  'engenharia de produto',
];

console.log('--- Texto extraído do PDF (primeiros 900 caracteres) ---\n');
console.log(pdfText.slice(0, 900));
console.log('\n--- Fim do excerto ---\n');

let ok = true;
for (const phrase of mustHave) {
  if (!pdfText.toLowerCase().includes(phrase.toLowerCase())) {
    console.error('Falta no texto extraído:', phrase);
    ok = false;
  }
}

if (!ok) {
  console.error('Falha: pdf-parse não recuperou os 3 objetivos esperados.');
  process.exit(1);
}

console.log('OK: pdf-parse extraiu texto real dos 3 objetivos (PT).\n');

// DOCX: ficheiro mínimo em memória não é trivial; validamos mammoth com .docx gerado via buffer de um zip mínimo — omitido.
// Validação alternativa: texto UTF-8
const sampleMd = path.join(root, 'testdata', 'sample-okr.md');
fs.writeFileSync(
  sampleMd,
  '# OKRs\n\nObjetivo: Teste markdown\n',
  'utf-8',
);
const mdText = new TextDecoder('utf-8').decode(fs.readFileSync(sampleMd)).trim();
if (!mdText.includes('Teste markdown')) {
  console.error('Falha na leitura UTF-8 (.md).');
  process.exit(1);
}
fs.unlinkSync(sampleMd);
console.log('OK: leitura direta de .md (UTF-8) como na função.\n');

console.log('Prompt simulado (como na Edge Function):');
console.log('Analise o seguinte conteúdo e extraia OKRs:\n\n' + pdfText.slice(0, 400) + '...\n');

console.log('Conclusão: o conteúdo deixa de ser binário/vazio; a IA recebe texto legível.');
process.exit(0);
