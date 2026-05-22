import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VigencyDot } from '@/components/vigency-badge';
import {
  CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS,
} from '@/lib/i18n/status-labels';

interface Props {
  params: Promise<{ 'tenant-slug': string; 'contract-id': string }>;
}

export default async function ClientContractDetailPage({ params }: Props) {
  const { 'tenant-slug': tenantSlug, 'contract-id': contractId } = await params;
  const session = await requireClientSession(tenantSlug);

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug }, select: { id: true, config: true },
  });
  if (!tenant) notFound();
  const cfg = tenant.config as { features?: { show_contracts?: boolean } } | null;
  if (!cfg?.features?.show_contracts) notFound();
  if (session.role === 'CLIENT_VIEWER') notFound();

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, tenant_id: tenant.id, deleted_at: null, status: 'ACTIVE' },
    include: { contract_brands: { include: { brand: { select: { id: true, name: true } } } } },
  });
  if (!contract) notFound();

  if (session.role === 'CLIENT_LEGAL_REP') {
    const assignments = await prisma.userClientHolder.findMany({
      where: { user_client_id: session.user_id, tenant_id: tenant.id, removed_at: null },
      select: { holder_id: true },
    });
    const bh = await prisma.brandHolder.findMany({
      where: { holder_id: { in: assignments.map((a) => a.holder_id) } },
      select: { brand_id: true },
    });
    const allowed = new Set(bh.map((b) => b.brand_id));
    const ok = contract.contract_brands.some((cb) => allowed.has(cb.brand_id));
    if (!ok) notFound();
  }

  const parties = contract.parties as { otorgante?: string; receptor?: string } | null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{contract.title}</h1>
        <Badge variant="secondary">{CONTRACT_TYPE_LABELS[contract.contract_type]}</Badge>
        <Badge>{CONTRACT_STATUS_LABELS[contract.status]}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <F label="Otorgante">{parties?.otorgante ?? '-'}</F>
            <F label="Receptor">{parties?.receptor ?? '-'}</F>
            <F label="Entrada en vigor">{fmt(contract.effective_date)}</F>
            <F label="Vencimiento">
              <span className="inline-flex items-center gap-2">
                <VigencyDot expirationDate={contract.expiration_date} legalStatus={contract.status} />
                {fmt(contract.expiration_date)}
              </span>
            </F>
            {contract.description && <F label="Descripción">{contract.description}</F>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Marcas vinculadas</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {contract.contract_brands.length === 0 ? (
                <p className="text-sm text-slate-500">Sin marcas vinculadas.</p>
              ) : (
                contract.contract_brands.map((cb) => (
                  <Badge key={cb.id} variant="outline">{cb.brand.name}</Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
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
