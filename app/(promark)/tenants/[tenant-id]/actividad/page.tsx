import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { PageTitle } from '@/components/ds';
import { ActivityFilters } from './activity-filters';
import { ActivityList } from './activity-list';

interface Props {
  params: Promise<{ 'tenant-id': string }>;
  searchParams: Promise<{
    entity?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function ActivityPage({ params, searchParams }: Props) {
  await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;
  const sp = await searchParams;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true },
  });
  if (!tenant) notFound();

  // Date range
  const from = sp.from ? new Date(sp.from) : null;
  const to = sp.to ? new Date(sp.to) : null;
  if (to) to.setHours(23, 59, 59, 999);

  const entityFilter = sp.entity ?? null;

  // BrandHistory
  const brandHistoryPromise =
    entityFilter && entityFilter !== 'BRAND' && entityFilter !== 'ALL'
      ? Promise.resolve([])
      : prisma.brandHistory.findMany({
          where: {
            brand: { tenant_id: tenantId },
            ...(from || to
              ? {
                  created_at: {
                    ...(from ? { gte: from } : {}),
                    ...(to ? { lte: to } : {}),
                  },
                }
              : {}),
          },
          orderBy: { created_at: 'desc' },
          take: 200,
          select: {
            id: true,
            change_type: true,
            event_type: true,
            description: true,
            created_at: true,
            actor_type: true,
            brand: { select: { id: true, name: true } },
          },
        });

  // ContractHistory
  const contractHistoryPromise =
    entityFilter && entityFilter !== 'CONTRACT' && entityFilter !== 'ALL'
      ? Promise.resolve([])
      : prisma.contractHistory.findMany({
          where: {
            contract: { tenant_id: tenantId },
            ...(from || to
              ? {
                  created_at: {
                    ...(from ? { gte: from } : {}),
                    ...(to ? { lte: to } : {}),
                  },
                }
              : {}),
          },
          orderBy: { created_at: 'desc' },
          take: 200,
          select: {
            id: true,
            change_type: true,
            summary: true,
            created_at: true,
            changed_by_user_type: true,
            contract: { select: { id: true, title: true } },
          },
        });

  const [brandHistory, contractHistory] = await Promise.all([
    brandHistoryPromise,
    contractHistoryPromise,
  ]);

  // Merge + sort
  const events = [
    ...brandHistory.map((h) => ({
      id: `bh-${h.id}`,
      timestamp: h.created_at.toISOString(),
      actorType: h.actor_type,
      entityType: 'BRAND' as const,
      entityId: h.brand.id,
      entityName: h.brand.name,
      action: h.change_type ?? h.event_type,
      summary: h.description,
      href: `/tenants/${tenantId}/brands/${h.brand.id}`,
    })),
    ...contractHistory.map((h) => ({
      id: `ch-${h.id}`,
      timestamp: h.created_at.toISOString(),
      actorType: h.changed_by_user_type,
      entityType: 'CONTRACT' as const,
      entityId: h.contract.id,
      entityName: h.contract.title,
      action: h.change_type,
      summary: h.summary,
      href: `/tenants/${tenantId}/contratos/${h.contract.id}`,
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-6">
      <Link
        href={`/tenants/${tenantId}/panel`}
        className="mb-3 inline-flex items-center gap-1 text-sm transition-colors hover:opacity-80"
        style={{ color: '#8FB6C7' }}
      >
        <ChevronLeft className="size-4" />
        Volver al panel
      </Link>

      <PageTitle
        eyebrow="Auditoría"
        title="Actividad"
        subtitle={`Historial de cambios sobre marcas y contratos de ${tenant.name}.`}
      />

      <ActivityFilters basePath={`/tenants/${tenantId}/actividad`} />

      <div className="mt-6">
        <ActivityList events={events} />
      </div>
    </div>
  );
}
