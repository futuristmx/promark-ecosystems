import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus, Pencil, Building2, Network, Users, ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Suspense } from 'react';
import { PageTitle, DsCard, HelpTip } from '@/components/ds';
import { StructureCsvBar } from './structure-csv-bar';
import {
  HOLDING_STATUS_LABELS,
  COMPANY_STATUS_LABELS,
} from '@/lib/i18n/status-labels';
import { StructureSheets } from './structure-sheets';
import { MonolithicStructure } from './monolithic-structure';
import type { TenantConfig } from '@/lib/validations/tenant-config.schema';

interface StructurePageProps {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function StructurePage({ params }: StructurePageProps) {
  const session = await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, config: true },
  });

  if (!tenant) notFound();

  const cfg = (tenant.config ?? {}) as TenantConfig;
  const primaryColor = cfg.branding?.primary_color ?? '#0F2E3D';

  const holdings = await prisma.holding.findMany({
    where: { tenant_id: tenantId },
    orderBy: { name: 'asc' },
    include: {
      companies: {
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { brands: true },
          },
        },
      },
    },
  });

  // Counts globales para el visual (titulares por tenant + breakdown marcas)
  const holdingIds = holdings.map((h) => h.id);
  const companyIdsByHolding = new Map<string, string[]>();
  for (const h of holdings) {
    companyIdsByHolding.set(
      h.id,
      h.companies.map((c) => c.id),
    );
  }

  const allCompanyIds = holdings.flatMap((h) => h.companies.map((c) => c.id));

  const [holdersCount, brandsGrouped] = await Promise.all([
    prisma.holder.count({ where: { tenant_id: tenantId } }),
    allCompanyIds.length
      ? prisma.brand.groupBy({
          by: ['company_id', 'legal_status'],
          where: { tenant_id: tenantId, company_id: { in: allCompanyIds } },
          _count: { _all: true },
        })
      : Promise.resolve([] as Array<{ company_id: string; legal_status: string; _count: { _all: number } }>),
  ]);

  // Indexar marcas por holding
  const brandsByHolding = new Map<
    string,
    { total: number; byStatus: Map<string, number> }
  >();
  for (const id of holdingIds) {
    brandsByHolding.set(id, { total: 0, byStatus: new Map() });
  }
  for (const row of brandsGrouped) {
    // encontrar holding que contiene este company_id
    for (const [holdingId, companyIds] of companyIdsByHolding) {
      if (companyIds.includes(row.company_id)) {
        const bucket = brandsByHolding.get(holdingId)!;
        const n = row._count._all;
        bucket.total += n;
        bucket.byStatus.set(
          row.legal_status,
          (bucket.byStatus.get(row.legal_status) ?? 0) + n,
        );
        break;
      }
    }
  }

  const canEdit = session.role !== 'ASSISTANT';
  const { getPromarkPermissions } = await import('@/lib/auth/promark-permissions');
  const perms = await getPromarkPermissions(session.role);
  const canExport = perms.export_data === true;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          { label: tenant.name, href: `/tenants/${tenantId}/panel` },
          { label: 'Estructura Corporativa' },
        ]}
      />

      <PageTitle
        eyebrow={tenant.name}
        title="Estructura Corporativa"
        subtitle={`Holdings, empresas y distribución de marcas de ${tenant.name}.`}
        actions={
          canEdit ? (
            <Link
              href={`/tenants/${tenantId}/structure?action=new-holding`}
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <Plus className="size-4" />
              Nuevo Holding
            </Link>
          ) : null
        }
      />

      {canEdit && canExport && (
        <StructureCsvBar tenantId={tenantId} className="mt-4" />
      )}

      <div className="mt-10" />

      {holdings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Network className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            Sin estructura corporativa registrada
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Crea un holding para comenzar a construir la estructura corporativa.
          </p>
          {canEdit && (
            <Link
              href={`/tenants/${tenantId}/structure?action=new-holding`}
              className={`${buttonVariants()} mt-4 inline-flex`}
            >
              <Plus className="h-4 w-4" />
              Crear holding
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {holdings.map((holding) => {
            const brandsBucket = brandsByHolding.get(holding.id) ?? {
              total: 0,
              byStatus: new Map<string, number>(),
            };
            const brandsByStatus = Array.from(brandsBucket.byStatus.entries())
              .map(([status, count]) => ({ status, count }))
              .sort((a, b) => b.count - a.count);

            return (
              <section key={holding.id} className="space-y-6">
                {/* Visualización monolítica 3D */}
                <DsCard variant="standard" padding="lg">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#355B6F]">
                        Visión jerárquica
                        <HelpTip>
                          Bloques apilados que muestran cómo se compone el holding:
                          empresas en el medio, titulares y marcas en la base.
                        </HelpTip>
                      </div>
                      <h3 className="text-xl font-semibold text-[#0F2E3D]">
                        {holding.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#355B6F]">
                        {holding.companies.length}{' '}
                        {holding.companies.length === 1 ? 'empresa' : 'empresas'}{' '}
                        · {brandsBucket.total}{' '}
                        {brandsBucket.total === 1 ? 'marca' : 'marcas'}
                        {' '}· {holdersCount}{' '}
                        {holdersCount === 1 ? 'titular' : 'titulares (tenant)'}
                      </p>
                    </div>
                    <div className="-mx-2 lg:mx-0 lg:max-w-[720px]">
                      <MonolithicStructure
                        primaryColor={primaryColor}
                        holding={{ id: holding.id, name: holding.name }}
                        companies={holding.companies.map((c) => ({
                          id: c.id,
                          name: c.name,
                          brandCount: c._count.brands,
                        }))}
                        holdersCount={holdersCount}
                        brandsCount={brandsBucket.total}
                        brandsByStatus={brandsByStatus}
                      />
                    </div>
                  </div>
                </DsCard>

                {/* Jerarquía editable — card del Holding */}
                <article
                  className="overflow-hidden rounded-2xl border shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${darken(primaryColor, 18)} 100%)`,
                    borderColor: darken(primaryColor, 30),
                  }}
                >
                  <header className="flex items-start justify-between gap-4 px-6 py-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                          style={{
                            background: 'rgba(251,246,236,0.18)',
                            color: '#FBF6EC',
                          }}
                        >
                          <Network className="h-3 w-3" />
                          Holding
                        </span>
                        <Badge
                          variant="secondary"
                          className="border-0"
                          style={{
                            background: 'rgba(251,246,236,0.92)',
                            color: '#0F2E3D',
                          }}
                        >
                          {HOLDING_STATUS_LABELS[holding.status] ?? holding.status}
                        </Badge>
                        <HelpTip>
                          Estructura corporativa que agrupa empresas
                          relacionadas bajo un mismo grupo.
                        </HelpTip>
                      </div>
                      <h2 className="mt-2 truncate text-lg font-semibold text-[#FBF6EC]">
                        {holding.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-[#FBF6EC]/70">
                        {holding.companies.length}{' '}
                        {holding.companies.length === 1
                          ? 'empresa registrada'
                          : 'empresas registradas'}
                      </p>
                    </div>
                    {canEdit && (
                      <Link
                        href={`/tenants/${tenantId}/structure?action=edit-holding&id=${holding.id}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#FBF6EC] transition-colors hover:bg-white/20"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Link>
                    )}
                  </header>

                  {/* Cuerpo: empresas */}
                  <div
                    className="rounded-t-2xl px-5 py-5"
                    style={{ background: '#FBF6EC' }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#355B6F]">
                          Empresas
                        </p>
                        <HelpTip>
                          Entidad legal que ejerce derechos sobre marcas.
                        </HelpTip>
                      </div>
                      {canEdit && (
                        <Link
                          href={`/tenants/${tenantId}/structure?action=new-company&holding=${holding.id}`}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#355B6F] transition-colors hover:bg-[#E2DED6]"
                        >
                          <Plus className="h-3 w-3" />
                          Nueva empresa
                        </Link>
                      )}
                    </div>

                    {holding.companies.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-[#E2DED6] py-6 text-center text-sm text-[#355B6F]/70">
                        No hay empresas en este holding.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        {holding.companies.map((company) => (
                          <div
                            key={company.id}
                            className="group relative rounded-xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,46,61,0.05)] transition-shadow hover:shadow-[0_4px_12px_rgba(15,46,61,0.08)]"
                            style={{
                              borderLeft: `4px solid ${primaryColor}`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-1.5">
                                  <Building2
                                    className="h-3.5 w-3.5 shrink-0"
                                    style={{ color: primaryColor }}
                                  />
                                  <span
                                    className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
                                    style={{
                                      background: '#F1EDE3',
                                      color: '#355B6F',
                                    }}
                                  >
                                    Empresa
                                  </span>
                                </div>
                                <p className="truncate text-sm font-semibold text-[#0F2E3D]">
                                  {company.name}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] text-[#355B6F]">
                                  {company.legal_name} · {company.company_type}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className="h-5 border-[#E2DED6] bg-[#FBF6EC] text-[10px] text-[#355B6F]"
                                  >
                                    {company._count.brands}{' '}
                                    {company._count.brands === 1 ? 'marca' : 'marcas'}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="h-5 bg-[#F1EDE3] text-[10px] text-[#0F2E3D]"
                                  >
                                    {COMPANY_STATUS_LABELS[company.status] ?? company.status}
                                  </Badge>
                                </div>
                              </div>
                              {canEdit && (
                                <Link
                                  href={`/tenants/${tenantId}/structure?action=edit-company&id=${company.id}`}
                                  className="rounded-md p-1.5 text-[#355B6F] opacity-0 transition-opacity hover:bg-[#F1EDE3] group-hover:opacity-100"
                                  aria-label={`Editar ${company.name}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pie: titulares (informativo) */}
                    <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#E2DED6] bg-white px-4 py-2.5">
                      <Users className="h-3.5 w-3.5 text-[#355B6F]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#355B6F]">
                        Titulares
                      </span>
                      <HelpTip>
                        Persona física o moral registrada como dueña ante el IMPI.
                      </HelpTip>
                      <ChevronRight className="h-3 w-3 text-[#355B6F]/60" />
                      <span className="text-xs text-[#0F2E3D]">
                        {holdersCount}{' '}
                        {holdersCount === 1
                          ? 'titular en el tenant'
                          : 'titulares en el tenant'}
                      </span>
                      <Link
                        href={`/tenants/${tenantId}/holders`}
                        className="ml-auto text-[11px] font-medium text-[#355B6F] hover:text-[#0F2E3D]"
                      >
                        Gestionar →
                      </Link>
                    </div>
                  </div>
                </article>
              </section>
            );
          })}
        </div>
      )}
      <Suspense fallback={null}>
        <StructureSheets
          tenantId={tenantId}
          holdings={holdings.map((h) => ({ id: h.id, name: h.name }))}
        />
      </Suspense>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Helpers locales — oscurece un hex para gradient del header del holding
// ────────────────────────────────────────────────────────────────

function darken(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(safe, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const f = 1 - percent / 100;
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r * f)}${toHex(g * f)}${toHex(b * f)}`;
}
