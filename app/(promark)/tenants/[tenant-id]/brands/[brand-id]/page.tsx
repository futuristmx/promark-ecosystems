import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil, Clock, Users, FileText } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { Breadcrumb } from '@/components/breadcrumb';
import { VigencyBadge } from '@/components/vigency-badge';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DocumentsPanel } from '@/components/documents-panel';
import { BRAND_CLASS_STATUS_LABELS } from '@/lib/i18n/status-labels';

interface BrandDetailPageProps {
  params: Promise<{ 'tenant-id': string; 'brand-id': string }>;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    REGISTRATION: 'Registro',
    RENEWAL: 'Renovación',
    TRANSFER: 'Transferencia',
    OPPOSITION: 'Oposición',
    CANCELLATION: 'Cancelación',
    STATUS_CHANGE: 'Cambio de estado',
    MODIFICATION: 'Modificación',
    LITIGATION_START: 'Inicio de litigio',
    LITIGATION_END: 'Fin de litigio',
    ASSIGNMENT: 'Cesión',
    LICENSE_GRANT: 'Licencia otorgada',
  };
  return labels[eventType] || eventType;
}

export default async function BrandDetailPage({
  params,
}: BrandDetailPageProps) {
  const session = await requirePromarkAuth();
  const { 'tenant-id': tenantId, 'brand-id': brandId } = await params;

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, tenant_id: tenantId },
    include: {
      company: {
        select: { id: true, name: true, legal_name: true },
      },
      classes: {
        orderBy: { class_number: 'asc' },
      },
      history: {
        orderBy: { event_date: 'desc' },
        take: 10,
        include: {
          performed_by: {
            select: { full_name: true },
          },
        },
      },
      holders: {
        include: {
          holder: {
            select: { id: true, name: true, holder_type: true, status: true },
          },
        },
      },
      contract_brands: {
        include: {
          contract: {
            select: {
              id: true,
              title: true,
              contract_type: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!brand) notFound();

  const canEdit = session.role !== 'ASSISTANT';

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          { label: '...', href: `/tenants/${tenantId}/structure` },
          { label: 'Marcas', href: `/tenants/${tenantId}/brands` },
          { label: brand.name },
        ]}
      />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{brand.name}</h1>
            <VigencyBadge
              expirationDate={brand.expiration_date}
              legalStatus={brand.legal_status}
            />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {brand.company.name} &middot; {brand.brand_type}
          </p>
        </div>
        {canEdit && (
          <Link href={`/tenants/${tenantId}/brands/${brand.id}/edit`} className={buttonVariants()}>
              <Pencil className="h-4 w-4" />
              Editar marca
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Brand Details Card */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Detalles de la marca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Estado legal
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {brand.legal_status}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Tipo de marca
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {brand.brand_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Número de registro
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {brand.registration_number || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Número de solicitud
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {brand.application_number || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Fecha de solicitud
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatDate(brand.application_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Fecha de registro
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatDate(brand.registration_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Fecha de vencimiento
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatDate(brand.expiration_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Fecha de renovación
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatDate(brand.renewal_date)}
                  </p>
                </div>
              </div>

              {brand.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Descripción
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {brand.description}
                    </p>
                  </div>
                </>
              )}

              {brand.disclaimers && (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Reservas
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {brand.disclaimers}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nice Classes */}
          {brand.classes.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Clases de Niza</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {brand.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
                    >
                      <Badge variant="secondary">
                        Clase {cls.class_number}
                      </Badge>
                      <div className="flex-1">
                        {cls.class_description && (
                          <p className="text-sm text-slate-700">
                            {cls.class_description}
                          </p>
                        )}
                        {cls.specification && (
                          <p className="mt-1 text-xs text-slate-500">
                            {cls.specification}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{BRAND_CLASS_STATUS_LABELS[cls.status] ?? cls.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <DocumentsPanel
            tenantId={tenantId}
            entityType="BRAND"
            entityId={brand.id}
            canUpload={canEdit}
            canDelete={canEdit}
            canDownload={true}
          />

          {/* History Timeline */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <CardTitle>Historial</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {brand.history.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  Sin entradas en el historial
                </p>
              ) : (
                <div className="relative space-y-0">
                  {brand.history.map((entry, index) => (
                    <div key={entry.id} className="relative flex gap-4 pb-6">
                      {/* Timeline line */}
                      {index < brand.history.length - 1 && (
                        <div className="absolute left-[7px] top-6 h-full w-px bg-slate-200" />
                      )}
                      {/* Dot */}
                      <div className="relative z-10 mt-1.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-[#3E6AE1] bg-white" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {getEventTypeLabel(entry.event_type)}
                        </p>
                        {entry.description && (
                          <p className="mt-0.5 text-sm text-slate-500">
                            {entry.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(entry.event_date)}
                          {entry.performed_by &&
                            ` por ${entry.performed_by.full_name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Holders */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <CardTitle>Titulares</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {brand.holders.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Sin titulares vinculados
                </p>
              ) : (
                <div className="space-y-3">
                  {brand.holders.map((bh) => (
                    <Link
                      key={bh.id}
                      href={`/tenants/${tenantId}/holders/${bh.holder.id}`}
                      className="block rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {bh.holder.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {bh.role} &middot; {bh.holder.holder_type}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contracts */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <CardTitle>Contratos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {brand.contract_brands.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Sin contratos vinculados
                </p>
              ) : (
                <div className="space-y-3">
                  {brand.contract_brands.map((cb) => (
                    <div
                      key={cb.id}
                      className="rounded-lg border border-slate-100 p-3"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {cb.contract.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cb.contract.contract_type} &middot;{' '}
                        {cb.contract.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
