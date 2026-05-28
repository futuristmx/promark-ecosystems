'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, List, Tag } from 'lucide-react';
import { BrandVigencyDot } from '@/components/brand-vigency-dot';
import { BrandFilters } from './brand-filters';
import { ExportMenu } from '@/components/export-menu';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SerializedBrand {
  id: string;
  name: string;
  brand_type: string;
  legal_status: string;
  registration_number: string | null;
  expiration_date: string | null; // ISO string
  logos: unknown;
  company: { id: string; name: string };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const VISUAL_BRAND_TYPES = ['FIGURATIVE', 'MIXED', 'THREE_D', 'TRADE_DRESS', 'HOLOGRAM'];

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Solicitada',
  PUBLISHED: 'Publicada',
  REGISTERED: 'Registrada',
  RENEWED: 'Renovada',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
  OPPOSED: 'Opuesta',
  IN_LITIGATION: 'En litigio',
};

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  APPLIED: { bg: 'rgba(143,182,199,0.12)', color: '#355B6F', border: 'rgba(143,182,199,0.3)' },
  PUBLISHED: { bg: 'rgba(53,91,111,0.1)', color: '#355B6F', border: 'rgba(53,91,111,0.25)' },
  REGISTERED: { bg: 'rgba(15,46,61,0.08)', color: '#0F2E3D', border: 'rgba(15,46,61,0.2)' },
  RENEWED: { bg: 'rgba(47,107,79,0.08)', color: '#2F6B4F', border: 'rgba(47,107,79,0.2)' },
  EXPIRED: { bg: 'rgba(180,35,24,0.08)', color: '#B42318', border: 'rgba(180,35,24,0.2)' },
  CANCELLED: { bg: 'rgba(200,196,185,0.2)', color: '#C8C4B9', border: 'rgba(200,196,185,0.4)' },
  OPPOSED: { bg: 'rgba(211,154,43,0.1)', color: '#D39A2B', border: 'rgba(211,154,43,0.25)' },
  IN_LITIGATION: { bg: 'rgba(11,31,42,0.08)', color: '#0B1F2A', border: 'rgba(11,31,42,0.2)' },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseDate(iso: string | null): Date | null {
  return iso ? new Date(iso) : null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '---';
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function BrandLogoThumb({ logos, brandType }: { logos: unknown; brandType: string }) {
  if (!VISUAL_BRAND_TYPES.includes(brandType)) return <div className="h-10 w-10" />;
  let src: string | null = null;
  if (typeof logos === 'string' && logos.startsWith('data:')) src = logos;
  else if (Array.isArray(logos) && logos.length > 0) {
    const first = logos[0];
    src = typeof first === 'string' ? first : first?.url ?? first?.data ?? null;
  } else if (logos && typeof logos === 'object' && !Array.isArray(logos)) {
    const obj = logos as Record<string, unknown>;
    src = (obj.url ?? obj.data ?? obj.image) as string | null;
  }
  if (!src) return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-lg text-[10px] font-medium"
      style={{ background: 'rgba(143,182,199,0.12)', color: '#355B6F' }}
    >
      <Tag className="size-4" />
    </div>
  );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Logo" className="h-10 w-10 rounded-lg object-contain" style={{ background: '#FBF6EC' }} />;
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.APPLIED;
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface BrandCatalogViewProps {
  brands: SerializedBrand[];
  companies: Array<{ id: string; name: string }>;
  basePath: string;
  exportEndpoint: string;
  count: number;
  availableClasses?: number[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 24;

export function BrandCatalogView({
  brands,
  companies,
  basePath,
  exportEndpoint,
  count,
  availableClasses = [],
}: BrandCatalogViewProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  // B4: paginación cliente-side (24 cards por página)
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(brands.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedBrands = brands.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--tenant-primary, #D39A2B)' }}
          >
            Catálogo
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>
            Marcas
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
            Catálogo de marcas registradas.
            {count > 0 && (
              <span className="ml-1" style={{ color: '#C8C4B9' }}>
                ({count} marca{count !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        <ExportMenu endpoint={exportEndpoint} hint="Descarga el catálogo completo según tus permisos." />
      </div>

      {/* Filters bar (full width) */}
      <div className="mb-4">
        <BrandFilters companies={companies} basePath={basePath} availableClasses={availableClasses} />
      </div>

      {/* View toggle — high contrast segmented control */}
      <div className="mb-6 flex items-center justify-end">
        <div
          className="inline-flex items-center gap-0.5 rounded-xl border-[1.5px] p-0.5"
          style={{ borderColor: '#355B6F', background: '#FBF6EC' }}
        >
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
            style={
              viewMode === 'cards'
                ? {
                    background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                    color: '#FBF6EC',
                    boxShadow: '0 2px 6px rgba(15,46,61,0.25)',
                  }
                : { color: '#355B6F' }
            }
            title="Vista de tarjetas — muestra cada marca como una card con logo"
          >
            <LayoutGrid className="size-3.5" />
            Tarjetas
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
            style={
              viewMode === 'list'
                ? {
                    background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                    color: '#FBF6EC',
                    boxShadow: '0 2px 6px rgba(15,46,61,0.25)',
                  }
                : { color: '#355B6F' }
            }
            title="Vista de lista — tabla compacta con todas las columnas"
          >
            <List className="size-3.5" />
            Lista
          </button>
        </div>
      </div>

      {/* Content container — unifica criterios con el portafolio del staff:
       *   gris arena por fuera, cards marfil cálido dentro. */}
      {brands.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16"
          style={{ borderColor: '#C8C4B9', background: '#E2DED6' }}
        >
          <p className="text-sm" style={{ color: '#355B6F' }}>
            No se encontraron marcas con los filtros actuales.
          </p>
          <p className="mt-1 text-xs" style={{ color: '#C8C4B9' }}>
            Cuando se registren marcas a tu nombre aparecerán aquí.
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl border p-4"
          style={{ borderColor: '#C8C4B9', background: '#E2DED6', backgroundImage: 'none' }}
        >
          {viewMode === 'cards' ? (
            <CardsView brands={paginatedBrands} basePath={basePath} />
          ) : (
            <ListView brands={paginatedBrands} basePath={basePath} />
          )}
        </div>
      )}

      {/* B4: Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3 text-sm">
          <p style={{ color: '#355B6F' }}>
            Mostrando{' '}
            <strong style={{ color: '#0F2E3D' }}>
              {(safePage - 1) * PAGE_SIZE + 1}
              {' – '}
              {Math.min(safePage * PAGE_SIZE, brands.length)}
            </strong>{' '}
            de <strong style={{ color: '#0F2E3D' }}>{brands.length}</strong>
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#F1EDE3]"
              style={{ borderColor: '#E2DED6', color: '#355B6F', background: '#FBF6EC' }}
            >
              Anterior
            </button>
            <span className="px-3 text-xs" style={{ color: '#355B6F' }}>
              Página <strong style={{ color: '#0F2E3D' }}>{safePage}</strong> de{' '}
              <strong style={{ color: '#0F2E3D' }}>{totalPages}</strong>
            </span>
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#F1EDE3]"
              style={{ borderColor: '#E2DED6', color: '#355B6F', background: '#FBF6EC' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cards View                                                         */
/* ------------------------------------------------------------------ */

function CardsView({ brands, basePath }: { brands: SerializedBrand[]; basePath: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => (
        <Link key={brand.id} href={`${basePath}/${brand.id}`} className="group">
          <div
            className="rounded-2xl border p-4 transition-shadow hover:shadow-md"
            style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
          >
            <div className="mb-3 flex items-start justify-between">
              <BrandLogoThumb logos={brand.logos} brandType={brand.brand_type} />
              <StatusBadge status={brand.legal_status} />
            </div>
            <div className="flex items-center gap-2">
              <BrandVigencyDot
                expirationDate={parseDate(brand.expiration_date)}
                legalStatus={brand.legal_status}
              />
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                {brand.name}
              </h3>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              {brand.company.name}
            </p>
            <div
              className="mt-3 flex items-center justify-between text-xs"
              style={{ color: '#355B6F' }}
            >
              <span className="font-mono">{brand.registration_number ?? '---'}</span>
              <span>{formatDate(brand.expiration_date)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  List / Table View                                                  */
/* ------------------------------------------------------------------ */

function ListView({ brands, basePath }: { brands: SerializedBrand[]; basePath: string }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: '#F1EDE3', borderBottom: '1px solid #E2DED6' }}>
            <th className="w-10 px-4 py-3" />
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Logo
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Nombre
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Empresa
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Estado
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              No. Registro
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Expiración
            </th>
          </tr>
        </thead>
        <tbody>
          {brands.map((brand, i) => (
            <tr
              key={brand.id}
              className="group transition-colors hover:bg-[rgba(226,222,214,0.35)]"
              style={{
                borderBottom: i < brands.length - 1 ? '1px solid #E2DED6' : undefined,
              }}
            >
              <td className="px-4 py-3">
                <BrandVigencyDot
                  expirationDate={parseDate(brand.expiration_date)}
                  legalStatus={brand.legal_status}
                />
              </td>
              <td className="px-4 py-3">
                <BrandLogoThumb logos={brand.logos} brandType={brand.brand_type} />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`${basePath}/${brand.id}`}
                  className="font-semibold text-[#0F2E3D] transition-colors hover:text-[var(--tenant-primary,#D39A2B)]"
                >
                  {brand.name}
                </Link>
              </td>
              <td className="px-4 py-3" style={{ color: '#355B6F' }}>
                {brand.company.name}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={brand.legal_status} />
              </td>
              <td className="px-4 py-3 font-mono text-xs" style={{ color: '#355B6F' }}>
                {brand.registration_number ?? '---'}
              </td>
              <td className="px-4 py-3" style={{ color: '#355B6F' }}>
                {formatDate(brand.expiration_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
