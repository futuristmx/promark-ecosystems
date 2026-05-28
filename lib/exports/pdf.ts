import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/* ── Promark icon (SVG) cargado una sola vez en cold start ────────────────── */
let promarkIconSvg: string | null = null;
function getPromarkIconSvg(): string | null {
  if (promarkIconSvg !== null) return promarkIconSvg;
  try {
    const path = join(process.cwd(), 'app', 'icon.svg');
    promarkIconSvg = readFileSync(path, 'utf-8');
    return promarkIconSvg;
  } catch {
    promarkIconSvg = '';
    return null;
  }
}

export interface PdfColumn {
  header: string;
  key: string;
  width: number; // points (1pt = 1/72 inch); landscape A4 width is ~762pts usable
}

interface BuildPdfArgs {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  rows: Record<string, unknown>[];
  tenantName?: string;
  /** Logo del tenant en Data URL (base64). Si está presente, va en el header. */
  tenantLogoDataUrl?: string | null;
  /** Color primario del tenant para acentos del header. */
  tenantPrimaryColor?: string;
}

/* ── Design System tokens ─────────────────────────────────────────────────── */
const DS = {
  marfil: '#FBF6EC',
  hueso: '#F1EDE3',
  arena: '#E2DED6',
  piedra: '#C8C4B9',
  carbon: '#1A1E23',
  pizarra: '#355B6F',
  marinoProfundo: '#0F2E3D',
  azulNoche: '#0B1F2A',
  ambar: '#D39A2B',
} as const;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  try {
    // pdfkit solo soporta PNG y JPEG en doc.image(); rechazar otros formatos
    // para no provocar un throw en runtime.
    const m = dataUrl.match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
    if (!m) return null;
    return Buffer.from(m[2], 'base64');
  } catch {
    return null;
  }
}

/**
 * Build a premium landscape A4 PDF report.
 *
 * Jerarquía visual:
 *   1) Cliente (logo + nombre + título del reporte) — protagonista del header
 *   2) Tabla de datos con espaciado generoso, zebra y headers con color primario
 *   3) Pie de página: numeración + marca "Promark®" en pequeño en la esquina
 *      inferior derecha (firma de la plataforma, no del documento)
 */
export function buildPdfBuffer(args: BuildPdfArgs): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0, // controlamos los márgenes manualmente
      // bufferPages permite volver a páginas anteriores para reescribir
      // el footer con la numeración final (página N de M).
      bufferPages: true,
      info: {
        Title: args.title,
        Author: args.tenantName ?? 'Promark®',
        Creator: 'Promark® — Inteligencia Marcaria',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const PAGE_W = doc.page.width;   // 842 landscape A4
    const PAGE_H = doc.page.height;  // 595 landscape A4
    const MARGIN_X = 48;
    const accent = args.tenantPrimaryColor && /^#[0-9a-f]{6}$/i.test(args.tenantPrimaryColor)
      ? args.tenantPrimaryColor
      : DS.ambar;

    /* ── 1. HEADER del cliente ──────────────────────────────────────────── */

    // Fondo hueso para el header
    doc.rect(0, 0, PAGE_W, 110).fill(DS.hueso);
    // Stripe acento (color primario del tenant) en la izquierda
    doc.rect(0, 0, 6, 110).fill(accent);

    // Logo del tenant (si existe)
    let headerTextX = MARGIN_X;
    if (args.tenantLogoDataUrl) {
      const buf = dataUrlToBuffer(args.tenantLogoDataUrl);
      if (buf) {
        try {
          doc.image(buf, MARGIN_X, 24, { fit: [62, 62] });
          headerTextX = MARGIN_X + 78;
        } catch {
          /* si el logo no es procesable, seguimos sin imagen */
        }
      }
    }

    // Eyebrow + nombre del cliente (PROTAGONISTA)
    doc.fillColor(accent).fontSize(8).font('Helvetica-Bold')
      .text(
        (args.subtitle ?? 'Reporte de marcas').toUpperCase(),
        headerTextX,
        28,
        { characterSpacing: 1.6 }
      );
    doc.fillColor(DS.marinoProfundo).fontSize(22).font('Helvetica-Bold')
      .text(args.tenantName ?? 'Cliente', headerTextX, 42, { lineBreak: false });
    doc.fillColor(DS.pizarra).fontSize(11).font('Helvetica')
      .text(args.title, headerTextX, 72, { lineBreak: false });

    // Meta (esquina derecha del header)
    const generatedAt = new Date().toLocaleString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    doc.fillColor(DS.pizarra).fontSize(8).font('Helvetica')
      .text('GENERADO', PAGE_W - MARGIN_X - 200, 30, { width: 200, align: 'right', characterSpacing: 1.4 });
    doc.fillColor(DS.marinoProfundo).fontSize(10).font('Helvetica-Bold')
      .text(generatedAt, PAGE_W - MARGIN_X - 200, 42, { width: 200, align: 'right' });
    doc.fillColor(DS.pizarra).fontSize(8).font('Helvetica')
      .text(`${args.rows.length} registro${args.rows.length === 1 ? '' : 's'}`,
        PAGE_W - MARGIN_X - 200, 62, { width: 200, align: 'right' });

    // Divider sutil bajo el header
    doc.moveTo(0, 110).lineTo(PAGE_W, 110).strokeColor(DS.arena).lineWidth(1).stroke();

    /* ── 2. TABLA ───────────────────────────────────────────────────────── */

    // Reajustar widths para usar el ancho disponible
    const tableLeft = MARGIN_X;
    const tableRight = PAGE_W - MARGIN_X;
    const availW = tableRight - tableLeft;
    const declaredW = args.columns.reduce((s, c) => s + c.width, 0);
    const scale = availW / declaredW;
    const cols = args.columns.map((c) => ({ ...c, width: c.width * scale }));

    const ROW_H = 28;
    const HEADER_H = 30;
    const CELL_PAD_X = 10;

    let cursorY = 140;

    function drawTableHeader(y: number) {
      // Banda del header de tabla — marino profundo
      doc.rect(tableLeft, y, availW, HEADER_H).fill(DS.marinoProfundo);
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      let x = tableLeft;
      for (const col of cols) {
        doc.text(col.header.toUpperCase(), x + CELL_PAD_X, y + 10, {
          width: col.width - CELL_PAD_X * 2,
          ellipsis: true,
          characterSpacing: 0.6,
        });
        x += col.width;
      }
      // borde inferior con color de acento
      doc.rect(tableLeft, y + HEADER_H - 2, availW, 2).fill(accent);
    }

    function drawFooter(pageIdx: number, totalPages: number) {
      const fy = PAGE_H - 30;

      // Marca Promark al pie derecho — icono SVG oficial + label
      const promarkLabel = 'Promark®';
      doc.fillColor(DS.pizarra).fontSize(8).font('Helvetica');
      const labelW = doc.widthOfString(promarkLabel);
      const iconSize = 14;
      const gap = 5;
      const blockX = PAGE_W - MARGIN_X - labelW - iconSize - gap;
      // Icono oficial (SVG → pdfkit). Si no se puede cargar, sólo va el texto.
      const svg = getPromarkIconSvg();
      if (svg) {
        try {
          SVGtoPDF(doc, svg, blockX, fy - 3, { width: iconSize, height: iconSize });
        } catch {
          /* si svg-to-pdfkit falla con este SVG, omitir el icono */
        }
      }
      doc.fillColor(DS.pizarra).fontSize(8).font('Helvetica')
        .text(promarkLabel, blockX + iconSize + gap, fy);

      // Paginación al pie izquierdo
      doc.fillColor(DS.piedra).fontSize(8).font('Helvetica')
        .text(`Página ${pageIdx} de ${totalPages}`, MARGIN_X, fy);
    }

    drawTableHeader(cursorY);
    cursorY += HEADER_H;

    let pageIndex = 1;
    const pageStartY = 140; // donde empieza la tabla en páginas nuevas
    const headerHeightSubsequent = HEADER_H;

    for (let i = 0; i < args.rows.length; i++) {
      // Page break preventivo
      if (cursorY + ROW_H > PAGE_H - 50) {
        // pintar páginas con número provisional; se reescriben al final
        doc.addPage();
        pageIndex++;
        cursorY = pageStartY - headerHeightSubsequent; // forzar redibujo del header
        drawTableHeader(cursorY);
        cursorY += HEADER_H;
      }

      // Zebra row
      if (i % 2 === 0) {
        doc.rect(tableLeft, cursorY, availW, ROW_H).fill(DS.marfil);
      }

      // Texto de la fila
      doc.fillColor(DS.carbon).fontSize(9).font('Helvetica');
      let x = tableLeft;
      for (const col of cols) {
        const value = String(args.rows[i][col.key] ?? '—');
        doc.text(value, x + CELL_PAD_X, cursorY + 9, {
          width: col.width - CELL_PAD_X * 2,
          ellipsis: true,
          lineBreak: false,
        });
        x += col.width;
      }

      // Border bottom sutil
      doc.moveTo(tableLeft, cursorY + ROW_H)
        .lineTo(tableRight, cursorY + ROW_H)
        .strokeColor(DS.arena).lineWidth(0.5).stroke();

      cursorY += ROW_H;
    }

    /* ── 3. Footer en todas las páginas ────────────────────────────────── */
    const totalPages = doc.bufferedPageRange().count;
    for (let p = 0; p < totalPages; p++) {
      doc.switchToPage(p);
      drawFooter(p + 1, totalPages);
    }

    doc.end();
  });
}
