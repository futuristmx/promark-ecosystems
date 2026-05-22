import type { Prisma, Alert } from '@prisma/client';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { ClientAlertsView } from './client-alerts-view';

interface ClientAlertsPageProps {
  params: Promise<{ 'tenant-slug': string }>;
}

export default async function ClientAlertsPage({ params }: ClientAlertsPageProps) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientSession(tenantSlug);

  // CLIENT_VIEWER does not get alerts
  if (session.role === 'CLIENT_VIEWER') {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-slate-500">
          Su rol no tiene acceso al centro de alertas.
        </p>
      </div>
    );
  }

  // Build query: LEGAL_REP only sees alerts for brands they're assigned to
  const where: Prisma.AlertWhereInput = {
    tenant_id: session.tenant_id,
  };

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
      where.entity_id = '__no_match__';
    } else {
      const brandHolders = await prisma.brandHolder.findMany({
        where: { holder_id: { in: holderIds } },
        select: { brand_id: true },
      });
      const brandIds = brandHolders.map((bh) => bh.brand_id);
      where.OR = [{ entity_type: 'BRAND', entity_id: { in: brandIds } }];
    }
  }

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: [{ status: 'asc' }, { expiry_date: 'asc' }],
    take: 100,
  });

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Alertas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vigencias por vencer y eventos detectados en tu catálogo.
        </p>
      </div>

      <ClientAlertsView
        tenantId={session.tenant_id}
        alerts={alerts.map((a: Alert) => ({
          ...a,
          expiry_date: a.expiry_date.toISOString(),
          created_at: a.created_at.toISOString(),
        }))}
      />
    </div>
  );
}
