import Link from 'next/link';
import { Users, Tag } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { PageTitle, DsCard, EmptyState } from '@/components/ds';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StatusDonut } from '@/components/dashboard/charts/status-donut';
import { PortfolioSankey, type SankeyDatum } from '@/components/dashboard/charts/portfolio-sankey';
import { ImpiClassHeatmap } from '@/components/dashboard/charts/impi-class-heatmap';

const LEGAL_STATUS_LABELS_ES: Record<string, string> = {
  APPLIED: 'Solicitada',
  PUBLISHED: 'Publicada',
  REGISTERED: 'Registrada',
  RENEWED: 'Renovada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  OPPOSED: 'Opuesta',
  IN_LITIGATION: 'En litigio',
  IN_PROGRESS: 'En trámite',
  ABANDONED: 'Abandonada',
};

const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#8FB6C7',       // azul niebla
  PUBLISHED: '#355B6F',     // azul pizarra
  REGISTERED: '#0F2E3D',    // azul marino profundo
  RENEWED: '#2F6B4F',       // verde estratégico
  EXPIRED: '#B42318',       // estado crítico
  CANCELLED: '#C8C4B9',     // gris piedra cálido
  OPPOSED: '#D39A2B',       // ámbar sutil
  IN_LITIGATION: '#0B1F2A', // azul noche
  IN_PROGRESS: '#355B6F',
  ABANDONED: '#C8C4B9',
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
    tenantStatusGroups,
    statusGroups,
    classGroups,
    statusClassRows,
    recentBrandHistory,
    recentContractHistory,
  ] = await Promise.all([
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.brand.count(),
    prisma.contract.count({ where: { status: 'ACTIVE', deleted_at: null } }),
    prisma.alert.count({
      where: { status: 'PENDING', expiry_date: { lte: in30Days } },
    }),
    // Sankey level 1: tenant → status
    prisma.brand.groupBy({
      by: ['tenant_id', 'legal_status'],
      _count: { _all: true },
    }),
    // Donut
    prisma.brand.groupBy({
      by: ['legal_status'],
      _count: { _all: true },
    }),
    // Heatmap: all classes across all tenants
    prisma.brandClass.groupBy({
      by: ['class_number'],
      _count: { _all: true },
    }),
    // Sankey level 2: status → class (via join Brand+BrandClass)
    prisma.brandClass.findMany({
      select: {
        class_number: true,
        brand: { select: { legal_status: true } },
      },
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

  // Tenant names (top by total brands)
  const tenantTotals = new Map<string, number>();
  for (const g of tenantStatusGroups) {
    tenantTotals.set(g.tenant_id, (tenantTotals.get(g.tenant_id) ?? 0) + g._count._all);
  }
  const topTenantIds = Array.from(tenantTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: topTenantIds } },
    select: { id: true, name: true },
  });
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  // Build sankey data
  const sankeyData: SankeyDatum[] = [];

  // Level 1: tenant -> status (only for top tenants to keep it readable)
  const topTenantSet = new Set(topTenantIds);
  for (const g of tenantStatusGroups) {
    if (!topTenantSet.has(g.tenant_id)) continue;
    const tenantName = tenantMap.get(g.tenant_id) ?? 'Sin nombre';
    sankeyData.push({
      source: tenantName,
      target: g.legal_status,
      value: g._count._all,
      sourceType: 'tenant',
      targetType: 'status',
    });
  }

  // Level 2: status -> class
  const classCountsTotal = new Map<number, number>();
  for (const row of statusClassRows) {
    classCountsTotal.set(row.class_number, (classCountsTotal.get(row.class_number) ?? 0) + 1);
  }
  const topClasses = Array.from(classCountsTotal.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c]) => c);
  const topClassSet = new Set(topClasses);

  const statusClassAgg = new Map<string, number>();
  for (const row of statusClassRows) {
    if (!topClassSet.has(row.class_number)) continue;
    const key = `${row.brand.legal_status}|${row.class_number}`;
    statusClassAgg.set(key, (statusClassAgg.get(key) ?? 0) + 1);
  }
  for (const [key, value] of statusClassAgg.entries()) {
    const [status, classNumberStr] = key.split('|');
    sankeyData.push({
      source: status,
      target: `Clase ${classNumberStr}`,
      value,
      sourceType: 'status',
      targetType: 'class',
    });
  }

  const statusDistribution = statusGroups.map((g) => ({
    label: LEGAL_STATUS_LABELS_ES[g.legal_status] ?? g.legal_status,
    value: g._count._all,
    color: STATUS_COLORS[g.legal_status] ?? '#64748b',
  }));

  const heatmapData = classGroups.map((g) => ({
    class_number: g.class_number,
    count: g._count._all,
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

      {/* HERO DUAL — Clientes activos + Total de marcas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <HeroCard
          label="Clientes activos"
          value={totalTenants}
          icon={<Users className="size-7" />}
          href="/tenants"
          ctaLabel="Ver clientes"
        />
        <HeroCard
          label="Total de marcas"
          value={totalBrands}
          icon={<Tag className="size-7" />}
          href="/tenants"
          ctaLabel="Ver marcas"
        />
      </div>

      {/* FACT STRIP — Contratos vigentes · Alertas críticas */}
      <div
        className="flex items-center justify-center gap-8 rounded-xl border px-6 py-4"
        style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
      >
        <FactStat label="Contratos vigentes" value={activeContracts} />
        <span className="h-8 w-px" style={{ background: '#E2DED6' }} aria-hidden="true" />
        <FactStat
          label="Alertas críticas"
          value={pendingAlerts}
          valueColor={pendingAlerts > 0 ? '#B42318' : undefined}
        />
      </div>

      <DsCard variant="standard">
        <StatusDonut
          data={statusDistribution}
          title="Distribución por estado legal"
        />
      </DsCard>

      <DsCard variant="standard">
        {totalBrands < 5 ? (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
              Flujo del portafolio: clientes → estatus → clases IMPI
            </h3>
            <div
              className="flex h-72 items-center justify-center rounded-lg text-sm"
              style={{ background: '#FBF6EC', color: '#8FB6C7', border: '1px dashed #E2DED6' }}
            >
              Necesitas al menos 5 marcas para ver el flujo del portafolio.
            </div>
          </div>
        ) : (
          <PortfolioSankey data={sankeyData} />
        )}
      </DsCard>

      <DsCard variant="standard">
        <ImpiClassHeatmap data={heatmapData} />
      </DsCard>

      <RecentActivity
        items={activity}
        hint={`Últimos ${activity.length} eventos`}
      />
    </div>
  );
}

// ─── Hero dual card ───────────────────────────────────────────────────────────

interface HeroCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  ctaLabel: string;
}

function HeroCard({ label, value, icon, href, ctaLabel }: HeroCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl p-7 transition-shadow hover:shadow-md"
      style={{
        background: 'linear-gradient(135deg, #FBF6EC 0%, #F1EDE3 100%)',
        border: '1.5px solid #E2DED6',
      }}
    >
      <div className="flex items-start justify-between gap-6">
        {/* Columna izquierda: datos */}
        <div className="flex-1">
          <p
            className="text-[10px] font-semibold uppercase leading-tight tracking-[0.12em]"
            style={{ color: '#355B6F' }}
          >
            {label}
          </p>
          <p
            className="mt-3 font-extrabold leading-none tracking-tight tabular-nums text-5xl"
            style={{ color: '#0F2E3D' }}
          >
            {value.toLocaleString('es-MX')}
          </p>
        </div>

        {/* Columna derecha: icono + CTA */}
        <div className="flex flex-col items-end justify-between gap-6 self-stretch">
          <span
            className="flex size-12 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(211,154,43,0.22) 0%, rgba(245,201,122,0.12) 100%)',
              color: '#D39A2B',
              border: '1px solid rgba(211,154,43,0.18)',
            }}
          >
            {icon}
          </span>
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold transition-colors group-hover:underline"
            style={{ color: '#355B6F' }}
          >
            {ctaLabel}
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Fact strip stat ──────────────────────────────────────────────────────────

interface FactStatProps {
  label: string;
  value: number;
  valueColor?: string;
}

function FactStat({ label, value, valueColor }: FactStatProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-[10px] font-semibold uppercase leading-tight tracking-[0.12em]"
        style={{ color: '#355B6F' }}
      >
        {label}
      </span>
      <span
        className="text-xl font-bold tabular-nums leading-none"
        style={{ color: valueColor ?? '#0F2E3D' }}
      >
        {value.toLocaleString('es-MX')}
      </span>
    </div>
  );
}

function UserAvatarBlock({ avatar, name }: { avatar: unknown; name: string }) {
  let src: string | null = null;
  if (typeof avatar === 'string' && (avatar.startsWith('data:') || avatar.startsWith('http'))) src = avatar;
  else if (Array.isArray(avatar) && avatar.length > 0) {
    const first = avatar[0];
    src = typeof first === 'string' ? first : first?.url ?? first?.data ?? null;
  } else if (avatar && typeof avatar === 'object') {
    const obj = avatar as Record<string, unknown>;
    src = (obj.url ?? obj.dataUrl ?? obj.data ?? obj.image) as string | null;
  }

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative shrink-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-16 w-16 rounded-full object-cover" style={{ border: '3px solid #E2DED6' }} />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold" style={{ background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)', color: '#FBF6EC', border: '3px solid #E2DED6' }}>
          {initials}
        </div>
      )}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: '#FBF6EC', border: '2px solid #E2DED6' }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#2F6B4F' }} />
      </span>
    </div>
  );
}
