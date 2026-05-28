import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { type Alert } from '@prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { Breadcrumb } from '@/components/breadcrumb';
import { PageTitle } from '@/components/ds';
import { AlertsView } from './alerts-view';

interface AlertsPageProps {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function AlertsPage({ params }: AlertsPageProps) {
  const session = await requirePromarkAuth();
  const { assertPromarkPermission } = await import('@/lib/auth/promark-permissions');
  await assertPromarkPermission(session.role, 'view_alerts');
  const { 'tenant-id': tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });
  if (!tenant) notFound();

  const [alerts, rules, counts] = await Promise.all([
    prisma.alert.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ status: 'asc' }, { expiry_date: 'asc' }],
      take: 100,
    }),
    prisma.alertRule.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ entity_type: 'asc' }, { trigger_days: 'desc' }],
    }),
    prisma.alert.groupBy({
      by: ['status'],
      where: { tenant_id: tenantId },
      _count: true,
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c: { status: string; _count: number }) => [c.status, c._count])
  ) as Record<string, number>;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          { label: tenant.name, href: `/tenants/${tenantId}/structure` },
          { label: 'Alertas' },
        ]}
      />

      <PageTitle
        eyebrow="Cliente"
        title="Centro de Alertas"
        subtitle="Vigencias, vencimientos y eventos detectados automáticamente."
      />

      <AlertsView
        tenantId={tenantId}
        initialAlerts={alerts.map((a: Alert) => ({
          ...a,
          expiry_date: a.expiry_date.toISOString(),
          sent_at: a.sent_at?.toISOString() ?? null,
          dismissed_at: a.dismissed_at?.toISOString() ?? null,
          resolved_at: a.resolved_at?.toISOString() ?? null,
          created_at: a.created_at.toISOString(),
        }))}
        rules={rules}
        countByStatus={countByStatus}
        role={session.role}
        canResolve={true}
      />
    </div>
  );
}
