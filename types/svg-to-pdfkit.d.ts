// Type declaration mínimo para svg-to-pdfkit (no publica @types).
// Firma según el README oficial: SVGtoPDF(doc, svg, x, y, options?)
declare module 'svg-to-pdfkit' {
  import type PDFKit from 'pdfkit';

  interface SVGtoPDFOptions {
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
    useCSS?: boolean;
    fontCallback?: (family: string, bold: boolean, italic: boolean) => string;
    imageCallback?: (link: string) => string;
    colorCallback?: (color: [number, number, number, number]) => [number, number, number, number];
    documentCallback?: (link: string) => string;
    warningCallback?: (warning: string) => void;
    assumePt?: boolean;
    precision?: number;
  }

  export default function SVGtoPDF(
    doc: PDFKit.PDFDocument,
    svg: string,
    x?: number,
    y?: number,
    options?: SVGtoPDFOptions
  ): void;
}
