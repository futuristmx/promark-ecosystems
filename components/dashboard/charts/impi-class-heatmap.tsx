'use client';

import { useState } from 'react';

interface ImpiClassHeatmapProps {
  data: Array<{ class_number: number; count: number }>;
  title?: string;
  /** Color de acento para los buckets más altos. Default: azul marino DS. */
  accentColor?: string;
}

// Etiquetas cortas en español para las 45 clases del catálogo de Niza.
// Fuente: clasificación oficial IMPI / OMPI.
const NICE_CLASS_LABELS: Record<number, string> = {
  1: 'Productos químicos',
  2: 'Pinturas y barnices',
  3: 'Cosméticos y limpieza',
  4: 'Aceites y combustibles',
  5: 'Productos farmacéuticos',
  6: 'Metales comunes',
  7: 'Máquinas y herramientas',
  8: 'Herramientas manuales',
  9: 'Aparatos eléctricos / software',
  10: 'Aparatos médicos',
  11: 'Iluminación y climatización',
  12: 'Vehículos',
  13: 'Armas de fuego',
  14: 'Joyería y relojería',
  15: 'Instrumentos musicales',
  16: 'Papelería e impresos',
  17: 'Caucho y plásticos',
  18: 'Cuero y marroquinería',
  19: 'Materiales de construcción',
  20: 'Muebles',
  21: 'Utensilios de cocina',
  22: 'Cuerdas y textiles',
  23: 'Hilos para uso textil',
  24: 'Tejidos',
  25: 'Vestimenta y calzado',
  26: 'Encajes y bordados',
  27: 'Alfombras y tapices',
  28: 'Juegos y juguetes',
  29: 'Carnes y lácteos',
  30: 'Café, té y harinas',
  31: 'Productos agrícolas frescos',
  32: 'Cervezas y bebidas no alcohólicas',
  33: 'Bebidas alcohólicas',
  34: 'Tabaco',
  35: 'Publicidad y negocios',
  36: 'Servicios financieros',
  37: 'Construcción y reparación',
  38: 'Telecomunicaciones',
  39: 'Transporte y logística',
  40: 'Tratamiento de materiales',
  41: 'Educación y entretenimiento',
  42: 'Servicios científicos y tecnológicos',
  43: 'Restaurantes y hospedaje',
  44: 'Servicios médicos y veterinarios',
  45: 'Servicios jurídicos y de seguridad',
};

// Escala de azul marino: low → high
function colorForCount(count: number, accent?: string): { fill: string; opacity: number; textColor: string } {
  if (count === 0) return { fill: '#E2DED6', opacity: 0.55, textColor: '#A8A39B' };
  if (count <= 5) return { fill: '#BFD8E3', opacity: 1, textColor: '#0F2E3D' };
  if (count <= 20) return { fill: '#5C8195', opacity: 1, textColor: '#FBF6EC' };
  if (count <= 50) return { fill: accent ?? '#1C3F55', opacity: 1, textColor: '#FBF6EC' };
  return { fill: accent ?? '#0F2E3D', opacity: 1, textColor: '#FBF6EC' };
}

export function ImpiClassHeatmap({
  data,
  title = 'Cobertura por clase IMPI (Niza)',
  accentColor,
}: ImpiClassHeatmapProps) {
  const [hover, setHover] = useState<number | null>(null);

  const counts = new Map<number, number>();
  for (const d of data) counts.set(d.class_number, d.count);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
          {title}
        </h3>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#8FB6C7' }}>
          Clases 1–45 · catálogo IMPI
        </span>
      </div>

      <div
        className="mx-auto grid gap-1"
        style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))', maxWidth: 480 }}
      >
        {Array.from({ length: 45 }, (_, i) => i + 1).map((classNumber) => {
          const count = counts.get(classNumber) ?? 0;
          const { fill, opacity, textColor } = colorForCount(count, accentColor);
          const isHover = hover === classNumber;
          const label = NICE_CLASS_LABELS[classNumber] ?? '';
          return (
            <div
              key={classNumber}
              className="group relative aspect-square rounded transition-transform duration-150"
              style={{
                background: fill,
                opacity,
                transform: isHover ? 'scale(1.18)' : 'scale(1)',
                boxShadow: isHover ? '0 0 0 1.5px #D39A2B, 0 6px 16px rgba(15,46,61,0.18)' : 'none',
                cursor: 'pointer',
                zIndex: isHover ? 5 : 1,
              }}
              onMouseEnter={() => setHover(classNumber)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className="flex h-full w-full flex-col items-center justify-center"
                style={{ color: textColor, fontFamily: 'var(--font-manrope, Manrope, sans-serif)' }}
              >
                <span className="text-[9px] font-bold leading-none">{classNumber}</span>
                {count > 0 && (
                  <span className="mt-0.5 text-[7.5px] font-semibold leading-none" style={{ opacity: 0.9 }}>
                    {count}
                  </span>
                )}
              </div>

              {isHover && (
                <div
                  className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-medium shadow-lg"
                  style={{
                    bottom: 'calc(100% + 6px)',
                    background: '#0B1F2A',
                    color: '#FBF6EC',
                    fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
                  }}
                >
                  <div className="font-semibold">Clase {classNumber}: {count} marca(s)</div>
                  {label && <div style={{ color: '#8FB6C7' }}>{label}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex items-center justify-center gap-3 text-[10px] uppercase tracking-wider" style={{ color: '#355B6F' }}>
        <span className="font-semibold">Intensidad</span>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded" style={{ background: '#E2DED6', opacity: 0.55 }} />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded" style={{ background: '#BFD8E3' }} />
          <span>1–5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded" style={{ background: '#5C8195' }} />
          <span>6–20</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded" style={{ background: accentColor ?? '#0F2E3D' }} />
          <span>20+</span>
        </div>
      </div>
    </div>
  );
}
