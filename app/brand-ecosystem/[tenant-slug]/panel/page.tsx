import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Tag, FileText, Shield, Sparkles } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import {
  brandIdsForLegalRep,
  computeTenantAggregates,
} from '@/lib/dashboard/tenant-aggregates';
import { KpiCard, KpiGrid, DsCard } from '@/components/ds';
import { StatusDonut } from '@/components/dashboard/charts/status-donut';
import { AlluvialVigency } from '@/components/dashboard/charts/alluvial-vigency';
import { RecentActivity } from '@/components/dashboard/recent-activity';

const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#8FB6C7',
  PUBLISHED: '#355B6F',
  REGISTERED: '#0F2E3D',
  RENEWED: '#1C3F55',
  EXPIRED: '#B42318',
  CANCELLED: '#C8C4B9',
  OPPOSED: '#D39A2B',
  IN_LITIGATION: '#0B1F2A',
};

interface ClientPanelPageProps {
  params: Promise<{ 'tenant-slug': string }>;
}

function PromarkProtectionCard() {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: 'rgba(211,154,43,0.35)',
        background:
          'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 60%, #355B6F 100%)',
        boxShadow: '0 8px 24px rgba(15,46,61,0.18)',
      }}
    >
      <div className="flex items-center gap-4 px-6 py-5">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(245,201,122,0.28), rgba(245,201,122,0.10))',
            border: '1px solid rgba(245,201,122,0.35)',
          }}
        >
          <Shield className="size-5" style={{ color: '#F5C97A' }} />
        </div>
        <div className="flex-1">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'rgba(245,201,122,0.85)' }}
          >
            Protección continua
          </p>
          <p
            className="mt-1 text-sm font-medium leading-relaxed"
            style={{ color: '#FBF6EC' }}
          >
            Tu portafolio de intangibles está siendo protegido por{' '}
            <strong style={{ color: '#F5C97A' }}>Promark®</strong> con tecnología y profesionalismo.
          </p>
        </div>
        <Sparkles className="hidden size-5 md:block" style={{ color: 'rgba(245,201,122,0.55)' }} />
      </div>
    </div>
  );
}

function WelcomeHeader({ tenantName, subtitle, userName }: { tenantName: string; subtitle: string; userName?: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'var(--tenant-primary, #D39A2B)' }}
        >
          Panel ejecutivo
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight" style={{ color: '#0F2E3D' }}>
          {greeting}{userName ? `, ${userName.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-base" style={{ color: '#355B6F' }}>
          {tenantName} — {subtitle}
        </p>
      </div>
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-2"
        style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
            style={{ background: '#2F6B4F' }}
          />
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ background: '#2F6B4F' }}
          />
        </span>
        <span className="text-[11px] font-semibold" style={{ color: '#2F6B4F' }}>
          Portafolio sincronizado
        </span>
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon: Icon,
  label,
  count,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border p-5 transition-all"
      style={{
        borderColor: '#E2DED6',
        background: '#FBF6EC',
        boxShadow: '0 1px 2px rgba(15,46,61,0.04)',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-105"
          style={{
            background: 'rgba(53,91,111,0.08)',
            color: '#355B6F',
          }}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tabular-nums" style={{ color: '#0F2E3D' }}>
              {count}
            </p>
            <p className="text-sm font-semibold" style={{ color: '#0F2E3D' }}>
              {label}
            </p>
          </div>
          <p className="mt-0.5 text-xs" style={{ color: '#355B6F' }}>
            {description}
          </p>
        </div>
        <div
          className="text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: '#D39A2B' }}
        >
          →
        </div>
      </div>
    </Link>
  );
}

export default async function ClientPanelPage({ params }: ClientPanelPageProps) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientSession(tenantSlug);

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true },
  });
  if (!tenant) notFound();

  const hrefPrefix = `/brand-ecosystem/${tenantSlug}`;

  // Get user name for greeting
  const user = await prisma.userClient.findUnique({
    where: { id: session.user_id },
    select: { full_name: true },
  });

  const docsCount = await prisma.document.count({
    where: { tenant_id: tenant.id, deleted_at: null },
  });

  if (session.role === 'CLIENT_VIEWER') {
    const brandIds = await brandIdsForLegalRep(session.user_id, tenant.id);
    const brandsCount = brandIds.length
      ? await prisma.brand.count({
          where: { tenant_id: tenant.id, id: { in: brandIds } },
        })
      : 0;

    return (
      <div className="space-y-10 p-8 md:p-12">
        <WelcomeHeader
          tenantName={tenant.name}
          subtitle="resumen de tus marcas asignadas"
          userName={user?.full_name}
        />
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <NavCard
            href={`${hrefPrefix}/brands`}
            icon={Tag}
            label="marcas"
            count={brandsCount}
            description="Catálogo bajo tu cargo"
          />
          <NavCard
            href={`${hrefPrefix}/documents`}
            icon={FileText}
            label="documentos"
            count={docsCount}
            description="Contratos, certificados y más"
          />
        </div>
        <PromarkProtectionCard />
      </div>
    );
  }

  const brandIdsFilter =
    session.role === 'CLIENT_LEGAL_REP'
      ? await brandIdsForLegalRep(session.user_id, tenant.id)
      : undefined;

  const aggregates = await computeTenantAggregates({
    tenantId: tenant.id,
    brandIdsFilter,
    hrefPrefix,
  });

  const donutData = aggregates.statusDistribution.map((s) => ({
    label: s.label,
    value: s.value,
    color: STATUS_COLORS[s.status] ?? '#64748b',
  }));

  return (
    <div className="space-y-12 p-8 md:p-12">
      <WelcomeHeader
        tenantName={tenant.name}
        subtitle={
          session.role === 'CLIENT_LEGAL_REP'
            ? 'indicadores de las marcas a tu cargo'
            : 'indicadores del ecosistema de marcas'
        }
        userName={user?.full_name}
      />

      {/* Nav cards: solo 2, sutiles */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <NavCard
          href={`${hrefPrefix}/brands`}
          icon={Tag}
          label="marcas"
          count={aggregates.totals.brands}
          description="Portafolio bajo gestión"
        />
        <NavCard
          href={`${hrefPrefix}/documents`}
          icon={FileText}
          label="documentos"
          count={docsCount}
          description="Contratos, certificados, comunicaciones"
        />
      </div>

      {/* Distribución por estado legal */}
      <DsCard variant="standard">
        <StatusDonut data={donutData} title="Distribución por estado legal" />
      </DsCard>

      {/* Alluvial — vencimientos próximos */}
      <DsCard variant="standard">
        <AlluvialVigency
          data={aggregates.expirationsByMonth}
          title="Flujo de vencimientos (24 meses)"
        />
      </DsCard>

      <RecentActivity items={aggregates.recentActivity} />

      <PromarkProtectionCard />
    </div>
  );
}
