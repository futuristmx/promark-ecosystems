import Link from 'next/link';
import { Users, Tag, Scroll, Bell } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { PageTitle, KpiCard, KpiGrid, DsCard, EmptyState } from '@/components/ds';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StatusDonut } from '@/components/dashboard/charts/status-donut';
import { TopTenantsBar } from '@/components/dashboard/charts/top-tenants-bar';

const LEGAL_STATUS_LABELS_ES: Record<string, string> = {
  APPLIED: 'Solicitada',
  PUBLISHED: 'Publicada',
  REGISTERED: 'Registrada',
  RENEWED: 'Renovada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  OPPOSED: 'Opuesta',
  IN_LITIGATION: 'En litigio',
};

const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#8FB6C7',       // azul niebla
  PUBLISHED: '#355B6F',     // azul pizarra
  REGISTERED: '#0F2E3D',    // azul marino profundo
  RENEWED: '#1C3F55',       // indigo estratégico
  EXPIRED: '#B42318',       // estado crítico
  CANCELLED: '#C8C4B9',     // gris piedra cálido
  OPPOSED: '#D39A2B',       // ámbar sutil
  IN_LITIGATION: '#0B1F2A', // azul noche
};

export default async function DashboardPage() {
  const session = await requirePromarkAuth();

  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const [
    totalTenants,
    totalBrands,
    activeContracts,
    pendingAlerts,
    topTenantsRaw,
    statusGroups,
    recentBrandHistory,
    recentContractHistory,
  ] = await Promise.all([
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.brand.count(),
    prisma.contract.count({ where: { status: 'ACTIVE', deleted_at: null } }),
    prisma.alert.count({
      where: { status: 'PENDING', expiry_date: { lte: in30Days } },
    }),
    prisma.brand.groupBy({
      by: ['tenant_id'],
      _count: { _all: true },
      orderBy: { _count: { tenant_id: 'desc' } },
      take: 5,
    }),
    prisma.brand.groupBy({
      by: ['legal_status'],
      _count: { _all: true },
    }),
    prisma.brandHistory.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        brand: { select: { id: true, name: true, tenant_id: true } },
        performed_by: { select: { full_name: true } },
      },
    }),
    prisma.contractHistory.findMany({
      where: { contract: { deleted_at: null } },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        contract: { select: { id: true, title: true, tenant_id: true } },
      },
    }),
  ]);

  const topTenantIds = topTenantsRaw.map((t) => t.tenant_id);
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: topTenantIds } },
    select: { id: true, name: true },
  });
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));
  const topTenants = topTenantsRaw
    .map((t) => ({
      tenant_id: t.tenant_id,
      name: tenantMap.get(t.tenant_id) ?? 'Sin nombre',
      count: t._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const statusDistribution = statusGroups.map((g) => ({
    label: LEGAL_STATUS_LABELS_ES[g.legal_status] ?? g.legal_status,
    value: g._count._all,
    color: STATUS_COLORS[g.legal_status] ?? '#64748b',
  }));

  const activity = [
    ...recentBrandHistory.map((h) => ({
      id: `bh-${h.id}`,
      actorName: h.performed_by?.full_name ?? 'Sistema',
      actionLabel: h.event_type,
      entityType: 'BRAND',
      entityId: h.brand_id,
      entityLabel: h.brand.name,
      href: `/tenants/${h.brand.tenant_id}/brands/${h.brand_id}`,
      createdAt: h.created_at.toISOString(),
    })),
    ...recentContractHistory.map((h) => ({
      id: `ch-${h.id}`,
      actorName: 'Sistema',
      actionLabel: h.change_type,
      entityType: 'CONTRACT',
      entityId: h.contract_id,
      entityLabel: h.contract.title,
      href: `/tenants/${h.contract.tenant_id}/contratos/${h.contract_id}`,
      createdAt: h.created_at.toISOString(),
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const allEmpty =
    totalTenants === 0 &&
    totalBrands === 0 &&
    activeContracts === 0 &&
    pendingAlerts === 0;

  if (allEmpty) {
    return (
      <div>
        <div className="flex items-center gap-5">
          <UserAvatarBlock avatar={session.avatar} name={session.full_name} />
          <div className="flex-1">
            <PageTitle
              eyebrow="Panel ejecutivo"
              title={`Bienvenido, ${session.full_name}`}
              subtitle="Vista general de todos los clientes"
            />
          </div>
        </div>
        <EmptyState
          icon={<Users className="size-6" />}
          title="Sin datos disponibles aún"
          description="Comienza creando tu primer cliente para registrar marcas, contratos y alertas."
          action={
            <Link
              href="/tenants/new"
              className="ds-btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium"
            >
              + Crear primer cliente
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-5">
        <UserAvatarBlock avatar={session.avatar} name={session.full_name} />
        <div className="flex-1">
          <PageTitle
            eyebrow="Panel ejecutivo"
            title={`Bienvenido, ${session.full_name}`}
            subtitle="Vista general de todos los clientes"
          />
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border px-4 py-2.5" style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}>
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ background: '#2F6B4F' }} />
            <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: '#2F6B4F' }} />
          </span>
          <span className="text-xs font-semibold" style={{ color: '#2F6B4F' }}>Sistema activo</span>
        </div>
      </div>

      <KpiGrid>
        <KpiCard
          label="Clientes activos"
          value={totalTenants}
          icon={<Users className="size-4" />}
          href="/tenants"
        />
        <KpiCard
          label="Total de marcas"
          value={totalBrands}
          icon={<Tag className="size-4" />}
          href="/tenants"
        />
        <KpiCard
          label="Contratos vigentes"
          value={activeContracts}
          icon={<Scroll className="size-4" />}
          href="/tenants"
        />
        <KpiCard
          label="Alertas críticas"
          value={pendingAlerts}
          icon={<Bell className="size-4" />}
          tone={pendingAlerts > 0 ? 'danger' : 'default'}
          href="/alertas"
        />
      </KpiGrid>

      <DsCard variant="standard">
        <StatusDonut
          data={statusDistribution}
          title="Distribución por estado legal"
        />
      </DsCard>

      <DsCard variant="standard">
        <TopTenantsBar data={topTenants} />
      </DsCard>

      <RecentActivity
        items={activity}
        hint={`Últimos ${activity.length} eventos`}
      />
    </div>
  );
}

function UserAvatarBlock({ avatar, name }: { avatar: unknown; name: string }) {
  let src: string | null = null;
  if (typeof avatar === 'string' && avatar.startsWith('data:')) src = avatar;
  else if (Array.isArray(avatar) && avatar.length > 0) {
    const first = avatar[0];
    src = typeof first === 'string' ? first : first?.url ?? first?.data ?? null;
  } else if (avatar && typeof avatar === 'object') {
    const obj = avatar as Record<string, unknown>;
    src = (obj.url ?? obj.data ?? obj.image) as string | null;
  }

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative shrink-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-16 w-16 rounded-2xl object-cover" style={{ border: '3px solid #E2DED6' }} />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold" style={{ background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)', color: '#FBF6EC', border: '3px solid #E2DED6' }}>
          {initials}
        </div>
      )}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: '#FBF6EC', border: '2px solid #E2DED6' }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#2F6B4F' }} />
      </span>
    </div>
  );
}
