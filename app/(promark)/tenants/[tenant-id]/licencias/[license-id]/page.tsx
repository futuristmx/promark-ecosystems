import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VigencyDot } from '@/components/vigency-badge';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/ds';
import type { StatusTone } from '@/components/ds';

const LICENSE_STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  DRAFT: 'muted',
  EXPIRED: 'error',
  TERMINATED: 'muted',
  SUSPENDED: 'warning',
};
import { LICENSE_TYPE_LABELS, LICENSE_STATUS_LABELS } from '@/lib/i18n/status-labels';

interface Props {
  params: Promise<{ 'tenant-id': string; 'license-id': string }>;
}

export default async function LicenseDetailPage({ params }: Props) {
  const session = await requirePromarkAuth();
  const { 'tenant-id': tenantId, 'license-id': licenseId } = await params;

  const license = await prisma.license.findFirst({
    where: { id: licenseId, tenant_id: tenantId, deleted_at: null },
    include: {
      brand: { select: { id: true, name: true } },
      contract: { select: { id: true, title: true } },
    },
  });
  if (!license) notFound();
  const canEdit = session.role === 'SUPERADMIN' || session.role === 'LAWYER';

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Clientes', href: '/tenants' },
        { label: 'Licencias', href: `/tenants/${tenantId}/licencias` },
        { label: license.licensee_name },
      ]} />
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0066FF]">
            Licencia · {LICENSE_TYPE_LABELS[license.license_type]}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {license.licensee_name}
            </h1>
            <StatusBadge
              tone={LICENSE_STATUS_TONE[license.status] ?? 'muted'}
              label={LICENSE_STATUS_LABELS[license.status] ?? license.status}
            />
          </div>
        </div>
        {canEdit && (
          <Link href={`/tenants/${tenantId}/licencias/${license.id}/editar`}
            className={buttonVariants({ variant: 'outline' })}>
            <Pencil className="size-4" />Editar
          </Link>
        )}
      </div>
      <Card>
        <CardHeader><CardTitle>Información de la licencia</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <F label="Marca">{license.brand.name}</F>
          <F label="Contrato">{license.contract ? (
            <Link href={`/tenants/${tenantId}/contratos/${license.contract.id}`} className="text-blue-600 hover:underline">
              {license.contract.title}
            </Link>
          ) : '-'}</F>
          <F label="RFC del licenciatario">{license.licensee_rfc ?? '-'}</F>
          <F label="Territorio">
            <div className="flex flex-wrap gap-1">
              {license.territory.length === 0 ? '-' : license.territory.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
            </div>
          </F>
          <F label="Entrada en vigor">{fmt(license.effective_date)}</F>
          <F label="Vencimiento">
            <span className="inline-flex items-center gap-2">
              <VigencyDot expirationDate={license.expiration_date} legalStatus={license.status} />
              {fmt(license.expiration_date)}
            </span>
          </F>
          <F label="Tasa de regalía">{license.royalty_rate ? `${license.royalty_rate.toString()}%` : '-'}</F>
          {license.permitted_uses && <div className="md:col-span-2"><p className="text-xs text-slate-500">Usos permitidos</p><p className="text-sm">{license.permitted_uses}</p></div>}
          {license.prohibited_uses && <div className="md:col-span-2"><p className="text-xs text-slate-500">Usos prohibidos</p><p className="text-sm">{license.prohibited_uses}</p></div>}
          {license.royalty_terms && <div className="md:col-span-2"><p className="text-xs text-slate-500">Términos de regalías</p><p className="text-sm">{license.royalty_terms}</p></div>}
          {license.notes && <div className="md:col-span-2"><p className="text-xs text-slate-500">Notas</p><p className="text-sm">{license.notes}</p></div>}
        </CardContent>
      </Card>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  );
}
function fmt(d: Date | null) {
  return d ? new Date(d).toLocaleDateString('es-MX') : '-';
}
