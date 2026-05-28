'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Pequeño icono de ayuda con tooltip al hover/focus.
 * Para encabezados de cards de configuración o controles que necesitan
 * una explicación extra sin ocupar espacio en la UI.
 */
export function HelpTip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Ayuda"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center rounded-full transition-colors"
        style={{ color: '#8FB6C7' }}
      >
        <HelpCircle className="size-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-56 -translate-x-1/2 rounded-lg px-3 py-2 text-[11px] leading-snug shadow-lg"
          style={{
            background: '#0F2E3D',
            color: '#FBF6EC',
            boxShadow: '0 10px 24px rgba(11,31,42,0.18)',
          }}
        >
          {children}
        </span>
      )}
    </span>
  );
}
