import Link from 'next/link';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { BrandVigencyDot } from '@/components/brand-vigency-dot';
import { BrandFilters } from './brand-filters';
import { ExportMenu } from '@/components/export-menu';
import type { LegalStatus } from '@prisma/client';

interface BrandsPageProps {
  params: Promise<{ 'tenant-slug': string }>;
  searchParams: Promise<{
    search?: string;
    company?: string;
    status?: string;
    vigency?: string;
  }>;
}

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

function getVigencyBucket(expirationDate: Date | null, legalStatus: string): string {
  if (
    legalStatus === 'CANCELLED' ||
    legalStatus === 'APPLIED' ||
    legalStatus === 'PUBLISHED'
  ) {
    return 'gray';
  }
  if (legalStatus === 'EXPIRED') return 'red';
  if (!expirationDate) return 'gray';

  const diffDays = Math.ceil(
    (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return 'red';
  if (diffDays <= 30) return 'orange';
  if (diffDays <= 90) return 'yellow';
  return 'green';
}

export default async function BrandsPage({ params, searchParams }: BrandsPageProps) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientSession(tenantSlug);
  const filters = await searchParams;

  // Build where clause based on role
  const where: Record<string, unknown> = {
    tenant_id: session.tenant_id,
  };

  // LEGAL_REP: only show brands where the user is linked to a holder
  if (session.role === 'CLIENT_LEGAL_REP') {
    const assignments = await prisma.userClientHolder.findMany({
      where: {
        user_client_id: session.user_id,
        tenant_id: session.tenant_id,
        removed_at: null,
      },
      select: { holder_id: true },
    });
    const holderIds = assignments.map((a) => a.holder_id);

    if (holderIds.length === 0) {
      where.id = '__no_match__';
    } else {
      where.holders = {
        some: { holder_id: { in: holderIds } },
      };
    }
  }

  if (filters.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }
  if (filters.company) {
    where.company_id = filters.company;
  }
  if (filters.status) {
    where.legal_status = filters.status;
  }

  const brands = await prisma.brand.findMany({
    where,
    include: {
      company: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const filteredBrands = filters.vigency
    ? brands.filter(
        (b) => getVigencyBucket(b.expiration_date, b.legal_status) === filters.vigency
      )
    : brands;

  const companies = await prisma.company.findMany({
    where: { tenant_id: session.tenant_id, status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const basePath = `/brand-ecosystem/${tenantSlug}/brands`;

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#8FB6C7' }}>
            Catálogo
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>Marcas</h1>
          <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
            Catálogo de marcas registradas.
            {filteredBrands.length > 0 && (
              <span className="ml-1" style={{ color: '#C8C4B9' }}>
                ({filteredBrands.length} marca{filteredBrands.length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        <ExportMenu
          endpoint={`/api/client/${tenantSlug}/brands/export`}
          hint="Descarga el catálogo completo según tus permisos."
        />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <BrandFilters companies={companies} basePath={basePath} />
      </div>

      {/* Table */}
      {filteredBrands.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16"
          style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
        >
          <p className="text-sm" style={{ color: '#C8C4B9' }}>No se encontraron marcas.</p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F1EDE3', borderBottom: '1px solid #E2DED6' }}>
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>
                  No. Registro
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>
                  Expiración
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map((brand, i) => (
                <tr
                  key={brand.id}
                  className="group transition-colors"
                  style={{
                    borderBottom: i < filteredBrands.length - 1 ? '1px solid #E2DED6' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(226,222,214,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td className="px-4 py-3">
                    <BrandVigencyDot
                      expirationDate={brand.expiration_date}
                      legalStatus={brand.legal_status}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`${basePath}/${brand.id}`}
                      className="font-semibold transition-colors"
                      style={{ color: '#0F2E3D' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--tenant-primary, #D39A2B)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#0F2E3D';
                      }}
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
                    {brand.expiration_date
                      ? brand.expiration_date.toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '---'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LegalStatus }) {
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
