'use client';

import { useState } from 'react';
import { CsvToolbar } from '@/components/ds';

const ENTITIES = [
  {
    key: 'brands',
    label: 'Marcas',
    columns: ['nombre', 'empresa', 'tipo', 'estado_legal', 'numero_registro', 'fecha_vencimiento'],
    example: ['Mi Marca', 'Mi Empresa', 'WORDMARK', 'APPLIED', '', ''],
  },
  {
    key: 'holders',
    label: 'Titulares',
    columns: ['nombre', 'tipo', 'rfc', 'curp', 'nacionalidad', 'estado', 'notas'],
    example: ['Juan Pérez', 'INDIVIDUAL', 'JUAP850101ABC', '', 'Mexicana', 'ACTIVE', ''],
  },
  {
    key: 'contracts',
    label: 'Contratos',
    columns: ['titulo', 'tipo', 'estado', 'fecha_inicio', 'fecha_vencimiento', 'ley_aplicable', 'notas'],
    example: ['Licencia Marca X', 'LICENSE_INTERNAL', 'ACTIVE', '2025-01-01', '2027-01-01', 'México', ''],
  },
  {
    key: 'licenses',
    label: 'Licencias',
    columns: ['marca', 'tipo', 'licenciatario', 'rfc_licenciatario', 'territorio', 'fecha_inicio', 'fecha_vencimiento', 'estado', 'notas'],
    example: ['Mi Marca', 'NON_EXCLUSIVE', 'Empresa Licenciataria', 'ELI850101ABC', 'México;USA', '2025-01-01', '2027-01-01', 'ACTIVE', ''],
  },
] as const;

interface PortfolioCsvBarProps {
  tenantId: string;
  onImportSuccess?: () => void;
  className?: string;
}

export function PortfolioCsvBar({ tenantId, onImportSuccess, className }: PortfolioCsvBarProps) {
  const [active, setActive] = useState<string>('brands');
  const entity = ENTITIES.find((e) => e.key === active) ?? ENTITIES[0];

  return (
    <div className={className}>
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
        onImportSuccess={onImportSuccess}
      />
    </div>
  );
}
