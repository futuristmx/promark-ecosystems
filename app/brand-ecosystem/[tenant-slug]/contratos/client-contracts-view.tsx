'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { VigencyDot } from '@/components/vigency-badge';
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS } from '@/lib/i18n/status-labels';
import { ExportMenu } from '@/components/export-menu';

interface ContractItem {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  expiration_date: string | null;
  contract_brands: { brand: { id: string; name: string } }[];
}

const CONTRACT_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: 'rgba(47,107,79,0.08)', color: '#2F6B4F' },
  EXPIRED: { bg: 'rgba(180,35,24,0.08)', color: '#B42318' },
  TERMINATED: { bg: 'rgba(180,35,24,0.08)', color: '#B42318' },
  DRAFT: { bg: 'rgba(143,182,199,0.12)', color: '#355B6F' },
  RENEWED: { bg: 'rgba(47,107,79,0.08)', color: '#2F6B4F' },
  UNDER_REVIEW: { bg: 'rgba(211,154,43,0.1)', color: '#D39A2B' },
};

export function ClientContractsView({ tenantSlug }: { tenantSlug: string }) {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/client/${tenantSlug}/contracts`)
      .then((r) => r.ok ? r.json() : { contracts: [] })
      .then((d) => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContracts(d.contracts || []);
        setLoading(false);
      });
  }, [tenantSlug]);

  return (
    <div className="px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--tenant-primary, #D39A2B)' }}>
            Gestión contractual
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>Contratos</h1>
          <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
            {contracts.length} contrato{contracts.length !== 1 && 's'} vigente
            {contracts.length !== 1 && 's'}
          </p>
        </div>
        <ExportMenu
          endpoint={`/api/client/${tenantSlug}/contracts/export`}
          hint="Exporta contratos vigentes y marcas vinculadas."
        />
      </div>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
      >
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: '#C8C4B9' }}>Cargando…</div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'rgba(143,182,199,0.12)' }}
            >
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-sm font-medium" style={{ color: '#0F2E3D' }}>
              Sin contratos vigentes
            </p>
            <p className="mt-1 max-w-sm text-xs" style={{ color: '#355B6F' }}>
              Tu equipo legal cargará licencias, cesiones y contratos relacionados con tus marcas aquí.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F1EDE3', borderBottom: '1px solid #E2DED6' }}>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Título</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Tipo</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Marcas vinculadas</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Vencimiento</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c, i) => {
                const statusS = CONTRACT_STATUS_STYLE[c.status] ?? CONTRACT_STATUS_STYLE.DRAFT;
                return (
                  <tr
                    key={c.id}
                    className="transition-colors"
                    style={{
                      borderBottom: i < contracts.length - 1 ? '1px solid #E2DED6' : undefined,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(226,222,214,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/brand-ecosystem/${tenantSlug}/contratos/${c.id}`}
                        className="font-semibold transition-colors"
                        style={{ color: '#0F2E3D' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--tenant-primary, #D39A2B)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#0F2E3D';
                        }}
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ background: 'rgba(143,182,199,0.12)', color: '#355B6F' }}
                      >
                        {CONTRACT_TYPE_LABELS[c.contract_type] ?? c.contract_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.contract_brands.map((cb) => (
                          <span
                            key={cb.brand.id}
                            className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                            style={{ borderColor: '#E2DED6', color: '#355B6F' }}
                          >
                            {cb.brand.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2" style={{ color: '#355B6F' }}>
                        <VigencyDot expirationDate={c.expiration_date} legalStatus={c.status} />
                        {c.expiration_date ? new Date(c.expiration_date).toLocaleDateString('es-MX') : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ background: statusS.bg, color: statusS.color }}
                      >
                        {CONTRACT_STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
