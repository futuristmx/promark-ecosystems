'use client';

import { useState } from 'react';
import { CsvToolbar } from '@/components/ds';
import { Building2, Building, Tag } from 'lucide-react';

const ENTITIES = [
  {
    key: 'holdings',
    label: 'Holdings',
    icon: Building2,
    columns: ['nombre', 'razon_social', 'rfc', 'pais', 'notas'],
    example: ['Mi Holding', 'Mi Holding S.A. de C.V.', 'MHO123456ABC', 'México', ''],
  },
  {
    key: 'companies',
    label: 'Empresas',
    icon: Building,
    columns: ['nombre', 'razon_social', 'holding', 'tipo', 'rfc', 'pais', 'estado_entidad'],
    example: ['Mi Empresa', 'Mi Empresa S.A. de C.V.', 'Mi Holding', 'SUBSIDIARY', 'MEM123456ABC', 'México', 'CDMX'],
  },
  {
    key: 'brands',
    label: 'Marcas',
    icon: Tag,
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
        <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#C8C4B9' }}>
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
        />
      </div>
    </div>
  );
}
