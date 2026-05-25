import ExcelJS from 'exceljs';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Build an Excel workbook with one sheet and return its buffer.
 * The first row is bolded, frozen, and styled with a brand color.
 */
export async function buildExcelBuffer(
  sheetName: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
  options?: { title?: string }
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Promark®';
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName);

  let titleRowOffset = 0;
  if (options?.title) {
    ws.mergeCells(1, 1, 1, columns.length);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = options.title;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(1).height = 28;
    titleRowOffset = 1;
  }

  // Header row
  const headerRow = ws.getRow(titleRowOffset + 1);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' }, // Promark navy
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    if (col.width) ws.getColumn(i + 1).width = col.width;
  });
  headerRow.height = 20;
  ws.views = [
    { state: 'frozen', xSplit: 0, ySplit: titleRowOffset + 1 },
  ];

  // Data rows
  rows.forEach((row) => {
    const values = columns.map((col) => row[col.key] ?? '');
    ws.addRow(values);
  });

  // AutoSize remaining columns when width not provided
  columns.forEach((col, i) => {
    if (!col.width) {
      const colObj = ws.getColumn(i + 1);
      let maxLen = col.header.length;
      colObj.eachCell({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? '').length;
        if (len > maxLen) maxLen = len;
      });
      colObj.width = Math.min(Math.max(maxLen + 2, 10), 50);
    }
  });

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
