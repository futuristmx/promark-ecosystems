import Link from 'next/link';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { BrandVigencyDot } from '@/components/brand-vigency-dot';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BrandFilters } from './brand-filters';
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
      // No assignments — will show empty state
      where.id = '__no_match__';
    } else {
      where.holders = {
        some: { holder_id: { in: holderIds } },
      };
    }
  }

  // Apply search filter
  if (filters.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }

  // Apply company filter
  if (filters.company) {
    where.company_id = filters.company;
  }

  // Apply status filter
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

  // Apply vigency filter client-side (requires date computation)
  const filteredBrands = filters.vigency
    ? brands.filter(
        (b) => getVigencyBucket(b.expiration_date, b.legal_status) === filters.vigency
      )
    : brands;

  // Get unique companies for the filter dropdown
  const companies = await prisma.company.findMany({
    where: { tenant_id: session.tenant_id, status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const basePath = `/brand-ecosystem/${tenantSlug}/brands`;

  return (
    <div className="px-6 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Marcas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Catalogo de marcas registradas.
          {filteredBrands.length > 0 && (
            <span className="ml-1 text-slate-400">
              ({filteredBrands.length} marca{filteredBrands.length !== 1 ? 's' : ''})
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <BrandFilters companies={companies} basePath={basePath} />
      </div>

      {/* Table */}
      {filteredBrands.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16">
          <p className="text-sm text-slate-500">No se encontraron marcas.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>No. Registro</TableHead>
                <TableHead>Expiracion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => (
                <TableRow key={brand.id} className="group">
                  <TableCell>
                    <BrandVigencyDot
                      expirationDate={brand.expiration_date}
                      legalStatus={brand.legal_status}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`${basePath}/${brand.id}`}
                      className="font-medium text-slate-900 hover:underline"
                      style={{ textDecorationColor: 'var(--tenant-primary)' }}
                    >
                      {brand.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {brand.company.name}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={brand.legal_status} />
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {brand.registration_number ?? '---'}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {brand.expiration_date
                      ? brand.expiration_date.toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '---'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LegalStatus }) {
  const label = STATUS_LABELS[status] ?? status;

  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    REGISTERED: 'default',
    RENEWED: 'default',
    APPLIED: 'secondary',
    PUBLISHED: 'secondary',
    EXPIRED: 'destructive',
    CANCELLED: 'destructive',
    OPPOSED: 'outline',
    IN_LITIGATION: 'outline',
  };

  return <Badge variant={variantMap[status] ?? 'secondary'}>{label}</Badge>;
}
