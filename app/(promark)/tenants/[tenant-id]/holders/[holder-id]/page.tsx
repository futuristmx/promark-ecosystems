import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil, Tag } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { Breadcrumb } from '@/components/breadcrumb';
import { VigencyDot } from '@/components/vigency-badge';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HOLDER_STATUS_LABELS } from '@/lib/i18n/status-labels';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface HolderDetailPageProps {
  params: Promise<{ 'tenant-id': string; 'holder-id': string }>;
}

export default async function HolderDetailPage({
  params,
}: HolderDetailPageProps) {
  const session = await requirePromarkAuth();
  const { 'tenant-id': tenantId, 'holder-id': holderId } = await params;

  const holder = await prisma.holder.findFirst({
    where: { id: holderId, tenant_id: tenantId },
    include: {
      brand_holders: {
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              legal_status: true,
              expiration_date: true,
              brand_type: true,
              company: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!holder) notFound();

  const contactInfo = holder.contact_info as Record<string, string> | null;
  const canEdit = session.role !== 'ASSISTANT';

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          { label: '...', href: `/tenants/${tenantId}/structure` },
          { label: 'Titulares', href: `/tenants/${tenantId}/holders` },
          { label: holder.name },
        ]}
      />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {holder.name}
            </h1>
            <Badge variant="secondary">{holder.holder_type}</Badge>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                holder.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {HOLDER_STATUS_LABELS[holder.status] ?? holder.status}
            </span>
          </div>
        </div>
        {canEdit && (
          <Link
              href={`/tenants/${tenantId}/holders/${holder.id}?action=edit`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pencil className="h-4 w-4" />
              Editar
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Holder Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Tipo
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {holder.holder_type}
                  </p>
                </div>

                {holder.rfc && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      RFC
                    </p>
                    <p className="mt-1 text-sm text-slate-900">{holder.rfc}</p>
                  </div>
                )}

                {holder.curp && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      CURP
                    </p>
                    <p className="mt-1 text-sm text-slate-900">{holder.curp}</p>
                  </div>
                )}

                {holder.nationality && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Nacionalidad
                    </p>
                    <p className="mt-1 text-sm text-slate-900">
                      {holder.nationality}
                    </p>
                  </div>
                )}

                {contactInfo?.email && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Correo electrónico
                    </p>
                    <p className="mt-1 text-sm text-slate-900">
                      {contactInfo.email}
                    </p>
                  </div>
                )}

                {contactInfo?.phone && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Teléfono
                    </p>
                    <p className="mt-1 text-sm text-slate-900">
                      {contactInfo.phone}
                    </p>
                  </div>
                )}

                {holder.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Notas internas
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {holder.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Linked Brands */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <CardTitle>Marcas vinculadas</CardTitle>
              </div>
              <CardAction>
                <Badge variant="outline">
                  {holder.brand_holders.length} marca
                  {holder.brand_holders.length !== 1 && 's'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {holder.brand_holders.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No hay marcas vinculadas a este titular
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {holder.brand_holders.map((bh) => (
                    <Link
                      key={bh.id}
                      href={`/tenants/${tenantId}/brands/${bh.brand.id}`}
                      className="flex items-center justify-between py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <VigencyDot
                          expirationDate={bh.brand.expiration_date}
                          legalStatus={bh.brand.legal_status}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {bh.brand.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {bh.brand.company.name} &middot;{' '}
                            {bh.brand.brand_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{bh.role}</Badge>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            bh.brand.legal_status === 'REGISTERED' ||
                            bh.brand.legal_status === 'RENEWED'
                              ? 'bg-green-100 text-green-800'
                              : bh.brand.legal_status === 'EXPIRED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {bh.brand.legal_status}
                        </span>
                      </div>
                    </Link>
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
