'use client';

import { useState } from 'react';
import { CsvToolbar } from '@/components/ds';
import { Tag, Users, Scroll, KeyRound } from 'lucide-react';

const ENTITIES = [
  {
    key: 'brands',
    label: 'Marcas',
    icon: Tag,
    columns: ['nombre', 'empresa', 'tipo', 'estado_legal', 'numero_registro', 'fecha_vencimiento', 'declaracion_de_uso'],
    example: ['Mi Marca', 'Mi Empresa', 'WORDMARK', 'APPLIED', '', '', ''],
  },
  {
    key: 'holders',
    label: 'Titulares',
    icon: Users,
    columns: ['nombre', 'tipo', 'rfc', 'curp', 'nacionalidad', 'estado', 'notas'],
    example: ['Juan Pérez', 'INDIVIDUAL', 'JUAP850101ABC', '', 'Mexicana', 'ACTIVE', ''],
  },
  {
    key: 'contracts',
    label: 'Contratos',
    icon: Scroll,
    columns: ['titulo', 'tipo', 'estado', 'fecha_inicio', 'fecha_vencimiento', 'ley_aplicable', 'notas'],
    example: ['Licencia Marca X', 'LICENSE_INTERNAL', 'ACTIVE', '2025-01-01', '2027-01-01', 'México', ''],
  },
  {
    key: 'licenses',
    label: 'Licencias',
    icon: KeyRound,
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
  const [transitioning, setTransitioning] = useState(false);
  const entity = ENTITIES.find((e) => e.key === active) ?? ENTITIES[0];

  function handleSwitch(key: string) {
    if (key === active) return;
    setTransitioning(true);
    setTimeout(() => {
      setActive(key);
      setTransitioning(false);
    }, 150);
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${className ?? ''}`}
      style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
    >
      {/* Entity selector row */}
      <div className="flex items-center gap-1 border-b px-4 py-3" style={{ borderColor: '#E2DED6' }}>
        <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
          Entidad CSV
        </span>
        {ENTITIES.map((e) => {
          const Icon = e.icon;
          const isActive = active === e.key;
          return (
            <button
              key={e.key}
              type="button"
              onClick={() => handleSwitch(e.key)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200"
              style={
                isActive
                  ? {
                      background: '#0F2E3D',
                      color: '#FBF6EC',
                      boxShadow: '0 2px 6px rgba(15,46,61,0.2)',
                      transform: 'scale(1.02)',
                    }
                  : { color: '#355B6F', background: 'transparent' }
              }
              onMouseEnter={(ev) => {
                if (!isActive) {
                  ev.currentTarget.style.background = 'rgba(15,46,61,0.06)';
                  ev.currentTarget.style.color = '#0F2E3D';
                }
              }}
              onMouseLeave={(ev) => {
                if (!isActive) {
                  ev.currentTarget.style.background = 'transparent';
                  ev.currentTarget.style.color = '#355B6F';
                }
              }}
            >
              <Icon className="size-3.5" />
              {e.label}
            </button>
          );
        })}
      </div>
      {/* CSV actions with transition */}
      <div
        className="transition-all duration-200"
        style={{
          opacity: transitioning ? 0.3 : 1,
          transform: transitioning ? 'translateY(4px)' : 'translateY(0)',
        }}
      >
        <CsvToolbar
          key={entity.key}
          endpoint={`/api/tenants/${tenantId}/csv?type=${entity.key}`}
          templateColumns={[...entity.columns]}
          templateExample={[...entity.example]}
          entityLabel={entity.label.toLowerCase()}
          onImportSuccess={onImportSuccess}
        />
      </div>
    </div>
  );
}
