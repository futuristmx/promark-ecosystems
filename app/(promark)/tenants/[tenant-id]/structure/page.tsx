import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus, Pencil, Building2, Network } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Suspense } from 'react';
import { PageTitle, EmptyState } from '@/components/ds';
import { StructureCsvBar } from './structure-csv-bar';
import {
  HOLDING_STATUS_LABELS,
  COMPANY_STATUS_LABELS,
} from '@/lib/i18n/status-labels';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { StructureSheets } from './structure-sheets';

interface StructurePageProps {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function StructurePage({ params }: StructurePageProps) {
  const session = await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });

  if (!tenant) notFound();

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

  const canEdit = session.role !== 'ASSISTANT';

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

      {canEdit && (
        <StructureCsvBar tenantId={tenantId} className="mt-4" />
      )}

      {/* Separación generosa entre la barra CSV y la lista de holdings */}
      <div className="mt-16" />

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
        <div className="space-y-4">
          {holdings.map((holding) => (
            <Card key={holding.id}>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-slate-400" />
                  <CardTitle>{holding.name}</CardTitle>
                  <Badge variant="secondary">{HOLDING_STATUS_LABELS[holding.status] ?? holding.status}</Badge>
                </div>
                {canEdit && (
                  <CardAction>
                    <Link
                        href={`/tenants/${tenantId}/structure?action=edit-holding&id=${holding.id}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                    </Link>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Empresas
                  </p>
                  {canEdit && (
                    <Link
                        href={`/tenants/${tenantId}/structure?action=new-company&holding=${holding.id}`}
                        className={buttonVariants({ variant: "ghost", size: "xs" })}
                      >
                        <Plus className="h-3 w-3" />
                        Nueva Empresa
                    </Link>
                  )}
                </div>

                {holding.companies.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">
                    No hay empresas en este holding
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {holding.companies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {company.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {company.legal_name} &middot;{' '}
                              {company.company_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {company._count.brands}{' '}
                            {company._count.brands === 1 ? 'marca' : 'marcas'}
                          </Badge>
                          <Badge variant="secondary">{COMPANY_STATUS_LABELS[company.status] ?? company.status}</Badge>
                          {canEdit && (
                            <Link
                                href={`/tenants/${tenantId}/structure?action=edit-company&id=${company.id}`}
                                className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
                              >
                                <Pencil className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
