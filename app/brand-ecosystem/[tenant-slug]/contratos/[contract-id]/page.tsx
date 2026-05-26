import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { VigencyDot } from '@/components/vigency-badge';
import { ArrowLeft } from 'lucide-react';
import {
  CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS,
} from '@/lib/i18n/status-labels';

interface Props {
  params: Promise<{ 'tenant-slug': string; 'contract-id': string }>;
}

const CONTRACT_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: 'rgba(47,107,79,0.08)', color: '#2F6B4F' },
  EXPIRED: { bg: 'rgba(180,35,24,0.08)', color: '#B42318' },
  TERMINATED: { bg: 'rgba(180,35,24,0.08)', color: '#B42318' },
  DRAFT: { bg: 'rgba(143,182,199,0.12)', color: '#355B6F' },
  RENEWED: { bg: 'rgba(47,107,79,0.08)', color: '#2F6B4F' },
  UNDER_REVIEW: { bg: 'rgba(211,154,43,0.1)', color: '#D39A2B' },
};

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
  const statusS = CONTRACT_STATUS_STYLE[contract.status] ?? CONTRACT_STATUS_STYLE.DRAFT;

  return (
    <div className="px-8 py-8">
      {/* Back */}
      <Link
        href={`/brand-ecosystem/${tenantSlug}/contratos`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: '#8FB6C7' }}
      >
        <ArrowLeft className="size-4" />
        Volver a contratos
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <h1 className="text-2xl font-bold" style={{ color: '#0F2E3D' }}>{contract.title}</h1>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{ background: 'rgba(143,182,199,0.12)', color: '#355B6F' }}
        >
          {CONTRACT_TYPE_LABELS[contract.contract_type]}
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: statusS.bg, color: statusS.color }}
        >
          {CONTRACT_STATUS_LABELS[contract.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
        >
          <h3 className="mb-4 text-sm font-bold" style={{ color: '#0F2E3D' }}>
            Información general
          </h3>
          <div className="space-y-4">
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
          </div>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
        >
          <h3 className="mb-4 text-sm font-bold" style={{ color: '#0F2E3D' }}>
            Marcas vinculadas
          </h3>
          <div className="flex flex-wrap gap-2">
            {contract.contract_brands.length === 0 ? (
              <p className="text-sm" style={{ color: '#C8C4B9' }}>Sin marcas vinculadas.</p>
            ) : (
              contract.contract_brands.map((cb) => (
                <span
                  key={cb.id}
                  className="rounded-full border px-3 py-1 text-xs font-medium"
                  style={{ borderColor: '#E2DED6', color: '#355B6F', background: '#FBF6EC' }}
                >
                  {cb.brand.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8FB6C7' }}>{label}</p>
      <div className="mt-0.5 text-sm font-medium" style={{ color: '#0F2E3D' }}>{children}</div>
    </div>
  );
}
function fmt(d: Date | null) {
  return d ? new Date(d).toLocaleDateString('es-MX') : '-';
}
