import PDFDocument from 'pdfkit';

export interface PdfColumn {
  header: string;
  key: string;
  width: number; // points (1pt = 1/72 inch); page width is ~540pts at 72dpi A4
}

interface BuildPdfArgs {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  rows: Record<string, unknown>[];
  tenantName?: string;
}

/**
 * Build a landscape A4 PDF report with header band + table and return the
 * binary buffer. Returns a Promise that resolves once the PDF stream ends.
 */
export function buildPdfBuffer(args: BuildPdfArgs): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      info: {
        Title: args.title,
        Author: 'Promark®',
        Creator: 'Promark®',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header band (navy)
    doc.rect(0, 0, doc.page.width, 70).fill('#1E3A5F');
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
      .text('Promark®', 40, 22);
    doc.fontSize(10).font('Helvetica')
      .text('Inteligencia Marcaria', 40, 48);

    if (args.tenantName) {
      doc.fontSize(10).font('Helvetica')
        .text(args.tenantName, 0, 28, { align: 'right', width: doc.page.width - 40 });
    }

    // Title
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold')
      .text(args.title, 40, 90);
    if (args.subtitle) {
      doc.fontSize(10).font('Helvetica').fillColor('#64748b')
        .text(args.subtitle, 40, 112);
    }

    // Generated at
    const generatedAt = new Date().toLocaleString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    doc.fontSize(8).fillColor('#94a3b8')
      .text(`Generado: ${generatedAt}`, 40, 90, { align: 'right', width: doc.page.width - 80 });

    // Table
    let cursorY = 140;
    const tableLeft = 40;

    // Header row
    doc.rect(tableLeft, cursorY, doc.page.width - 80, 22).fill('#f1f5f9');
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    let cursorX = tableLeft + 6;
    for (const col of args.columns) {
      doc.text(col.header, cursorX, cursorY + 7, { width: col.width - 6, ellipsis: true });
      cursorX += col.width;
    }
    cursorY += 22;

    // Data rows
    doc.font('Helvetica').fontSize(9);
    for (const row of args.rows) {
      // Page break check
      if (cursorY > doc.page.height - 60) {
        doc.addPage();
        cursorY = 50;
      }

      cursorX = tableLeft + 6;
      for (const col of args.columns) {
        const value = String(row[col.key] ?? '—');
        doc.fillColor('#334155')
          .text(value, cursorX, cursorY + 5, { width: col.width - 6, ellipsis: true });
        cursorX += col.width;
      }
      // Row separator
      doc.moveTo(tableLeft, cursorY + 22)
        .lineTo(doc.page.width - 40, cursorY + 22)
        .strokeColor('#e2e8f0')
        .stroke();
      cursorY += 22;
    }

    // Footer with row count
    if (cursorY > doc.page.height - 60) doc.addPage();
    doc.fontSize(8).fillColor('#94a3b8')
      .text(`Total: ${args.rows.length} registros`, 40, doc.page.height - 50);

    doc.end();
  });
}
