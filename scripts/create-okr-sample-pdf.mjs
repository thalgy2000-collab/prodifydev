/**
 * Gera testdata/OKRs_Empresa_Generica.pdf com 3 objetivos em português
 * (mesmo nome de ficheiro pedido para testes manuais).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const testdata = path.join(root, 'testdata');
fs.mkdirSync(testdata, { recursive: true });

const lines = [
  'OKRs Empresa Genérica',
  '',
  'Objetivo 1: Elevar a satisfação do cliente (NPS) para 50 pontos',
  'Objetivo 2: Crescer a receita recorrente em 20% no trimestre',
  'Objetivo 3: Contratar 15 novos talentos para engenharia de produto',
];

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([595.28, 841.89]);
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
let y = 780;
for (const line of lines) {
  page.drawText(line, { x: 50, y, size: 11, font, color: rgb(0, 0, 0) });
  y -= 18;
}

const bytes = await pdfDoc.save();
const out = path.join(testdata, 'OKRs_Empresa_Generica.pdf');
fs.writeFileSync(out, bytes);
console.log('PDF de exemplo criado:', out);
