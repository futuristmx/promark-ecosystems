'use client';

import { useState, useRef, useCallback } from 'react';
import { NICE_CLASS_DESCRIPTIONS } from '@/lib/i18n/impi-classes';

interface NizaBoardProps {
  registeredClasses: number[];
}

export default function NizaBoard({ registeredClasses }: NizaBoardProps) {
  const [hoveredClass, setHoveredClass] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleMouseEnter = useCallback((classNum: number) => {
    const el = cellRefs.current.get(classNum);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
    setHoveredClass(classNum);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredClass(null);
  }, []);

  const registeredSet = new Set(registeredClasses);
  const coverage = registeredSet.size;

  return (
    <div className="relative">
      {/* B5: header con contexto de cobertura */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
            Clases de Niza
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: '#355B6F' }}>
            Cobertura de clases registradas. Pasa el cursor para ver descripción.
          </p>
        </div>
        <div
          className="shrink-0 rounded-lg border px-3 py-1.5 text-right"
          style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
            Cobertura
          </p>
          <p className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
            {coverage} <span className="text-[11px] font-medium" style={{ color: '#355B6F' }}>de 45</span>
          </p>
        </div>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}
      >
        {Array.from({ length: 45 }, (_, i) => i + 1).map((classNum) => {
          const isActive = registeredSet.has(classNum);
          return (
            <div
              key={classNum}
              ref={(el) => {
                if (el) cellRefs.current.set(classNum, el);
              }}
              onMouseEnter={() => handleMouseEnter(classNum)}
              onMouseLeave={handleMouseLeave}
              className="flex items-center justify-center rounded-md text-xs cursor-default select-none transition-colors"
              style={{
                aspectRatio: '1',
                fontWeight: isActive ? 700 : 400,
                backgroundColor: isActive
                  ? 'rgba(15,46,61,0.12)'
                  : 'rgba(200,196,185,0.15)',
                color: isActive ? '#0F2E3D' : '#C8C4B9',
                border: `1.5px solid ${isActive ? 'rgba(15,46,61,0.25)' : 'transparent'}`,
              }}
            >
              {classNum}
            </div>
          );
        })}
      </div>

      {hoveredClass !== null && (
        <div
          style={{
            position: 'fixed',
            zIndex: 9999,
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%) translateY(-8px)',
            backgroundColor: '#0B1F2A',
            color: '#FBF6EC',
            maxWidth: '12rem',
            pointerEvents: 'none',
          }}
          className="rounded-lg text-xs px-3 py-2 shadow-xl"
        >
          <span className="font-semibold">Clase {hoveredClass}:</span>{' '}
          {NICE_CLASS_DESCRIPTIONS[hoveredClass] ?? '—'}
        </div>
      )}
    </div>
  );
}
