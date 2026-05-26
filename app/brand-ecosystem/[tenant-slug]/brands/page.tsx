import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { BrandCatalogView } from './brand-catalog-view';
import type { SerializedBrand } from './brand-catalog-view';

interface BrandsPageProps {
  params: Promise<{ 'tenant-slug': string }>;
  searchParams: Promise<{
    search?: string;
    company?: string;
    status?: string;
    vigency?: string;
  }>;
}

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

  // Serialize brands for client component (dates → ISO strings)
  const serializedBrands: SerializedBrand[] = filteredBrands.map((b) => ({
    id: b.id,
    name: b.name,
    brand_type: b.brand_type,
    legal_status: b.legal_status,
    registration_number: b.registration_number,
    expiration_date: b.expiration_date ? b.expiration_date.toISOString() : null,
    logos: b.logos,
    company: b.company,
  }));

  return (
    <BrandCatalogView
      brands={serializedBrands}
      companies={companies}
      basePath={basePath}
      exportEndpoint={`/api/client/${tenantSlug}/brands/export`}
      count={filteredBrands.length}
    />
  );
}
