'use client';

import { useState } from 'react';
import { CsvToolbar } from '@/components/ds';

const ENTITIES = [
  {
    key: 'holdings',
    label: 'Holdings',
    columns: ['nombre', 'razon_social', 'rfc', 'pais', 'notas'],
    example: ['Mi Holding', 'Mi Holding S.A. de C.V.', 'MHO123456ABC', 'México', ''],
  },
  {
    key: 'companies',
    label: 'Empresas',
    columns: ['nombre', 'razon_social', 'holding', 'tipo', 'rfc', 'pais', 'estado_entidad'],
    example: ['Mi Empresa', 'Mi Empresa S.A. de C.V.', 'Mi Holding', 'SUBSIDIARY', 'MEM123456ABC', 'México', 'CDMX'],
  },
  {
    key: 'brands',
    label: 'Marcas',
    columns: ['nombre', 'empresa', 'tipo', 'estado_legal', 'numero_registro', 'fecha_vencimiento'],
    example: ['Mi Marca', 'Mi Empresa', 'WORDMARK', 'APPLIED', '', ''],
  },
] as const;

interface StructureCsvBarProps {
  tenantId: string;
  className?: string;
}

export function StructureCsvBar({ tenantId, className }: StructureCsvBarProps) {
  const [active, setActive] = useState<string>('holdings');
  const entity = ENTITIES.find((e) => e.key === active) ?? ENTITIES[0];

  return (
    <div className={className}>
      {/* Entity selector tabs */}
      <div className="mb-1 flex items-center gap-1 rounded-t-xl px-4 pt-2" style={{ background: '#F1EDE3' }}>
        {ENTITIES.map((e) => (
          <button
            key={e.key}
            type="button"
            onClick={() => setActive(e.key)}
            className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            style={
              active === e.key
                ? { background: '#0F2E3D', color: '#ffffff' }
                : { color: '#355B6F' }
            }
          >
            {e.label}
          </button>
        ))}
      </div>
      <CsvToolbar
        key={entity.key}
        endpoint={`/api/tenants/${tenantId}/csv?type=${entity.key}`}
        templateColumns={[...entity.columns]}
        templateExample={[...entity.example]}
        entityLabel={entity.label.toLowerCase()}
      />
    </div>
  );
}
