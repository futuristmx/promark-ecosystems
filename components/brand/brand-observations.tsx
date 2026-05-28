import { AlertCircle, Calendar, FileText, Info } from 'lucide-react';

/**
 * BrandObservations
 * Renders free-text legal observations with structured visual hierarchy.
 * Splits content into paragraphs and bullets, highlights dates and key terms,
 * and surfaces "acción requerida" / fecha-clave callouts when detected.
 */
interface Props {
  text: string;
}

// Keywords that escalate a paragraph to "acción requerida"
const ACTION_KEYWORDS = [
  'acción requerida',
  'accion requerida',
  'pendiente',
  'requiere',
  'urgente',
  'vence',
  'vencimiento',
  'renovar',
  'renovación',
  'renovacion',
  'oposición',
  'oposicion',
  'plazo',
];

// Spanish month names for date detection
const DATE_REGEX =
  /\b(\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+\d{4})?|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\b/gi;

function isActionParagraph(p: string): boolean {
  const lower = p.toLowerCase();
  return ACTION_KEYWORDS.some((k) => lower.includes(k));
}

function highlightDates(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(DATE_REGEX);
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span
        key={`d-${m.index}`}
        className="rounded px-1 font-medium"
        style={{ background: 'rgba(211,154,43,0.18)', color: '#7A5A14' }}
      >
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

function splitParagraphs(raw: string): string[] {
  // Split by double-newline OR single-newline-followed-by bullet
  return raw
    .split(/\n\s*\n|\n(?=[-•*]\s)/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function BrandObservations({ text }: Props) {
  const paragraphs = splitParagraphs(text);

  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border"
      style={{
        borderColor: 'rgba(143,182,199,0.5)',
        background: 'linear-gradient(135deg, #DDEAF2 0%, #F1EDE3 100%)',
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-4 py-2.5"
        style={{
          borderColor: 'rgba(143,182,199,0.4)',
          background: 'rgba(255,255,255,0.35)',
        }}
      >
        <FileText className="size-4" style={{ color: '#355B6F' }} />
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#0F2E3D' }}
        >
          Observaciones legales
        </p>
      </div>

      <div className="space-y-3 p-4">
        {paragraphs.map((p, i) => {
          const isBullet = /^[-•*]\s/.test(p);
          const clean = isBullet ? p.replace(/^[-•*]\s+/, '') : p;
          const isAction = isActionParagraph(clean);

          if (isAction) {
            return (
              <div
                key={i}
                className="flex gap-2.5 rounded-lg border px-3 py-2.5"
                style={{
                  borderColor: 'rgba(211,154,43,0.45)',
                  background: 'rgba(211,154,43,0.10)',
                }}
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: '#A87614' }}
                />
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#3D2A07' }}
                >
                  {highlightDates(clean)}
                </p>
              </div>
            );
          }

          if (isBullet) {
            return (
              <div key={i} className="flex gap-2.5 pl-1">
                <Info
                  className="mt-1 size-3.5 shrink-0"
                  style={{ color: '#355B6F' }}
                />
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#0F2E3D' }}
                >
                  {highlightDates(clean)}
                </p>
              </div>
            );
          }

          // Plain paragraph — check if it contains a date to add a calendar accent
          const hasDate = DATE_REGEX.test(clean);
          DATE_REGEX.lastIndex = 0;

          return (
            <div key={i} className="flex gap-2.5">
              {hasDate ? (
                <Calendar
                  className="mt-1 size-3.5 shrink-0"
                  style={{ color: '#355B6F' }}
                />
              ) : (
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full"
                  style={{ background: '#355B6F' }}
                />
              )}
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#0F2E3D' }}
              >
                {highlightDates(clean)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
