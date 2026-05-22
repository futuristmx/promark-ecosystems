'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { VigencyDot } from '@/components/vigency-badge';
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS } from '@/lib/i18n/status-labels';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

interface ContractItem {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  expiration_date: string | null;
  contract_brands: { brand: { id: string; name: string } }[];
}

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
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Contratos</h1>
      <p className="mb-6 text-sm text-slate-500">{contracts.length} contrato{contracts.length !== 1 && 's'} vigente{contracts.length !== 1 && 's'}</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Cargando…</div>
        ) : contracts.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">Sin contratos disponibles.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marcas vinculadas</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/brand-ecosystem/${tenantSlug}/contratos/${c.id}`}
                      className="font-medium text-blue-700 hover:underline">{c.title}</Link>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{CONTRACT_TYPE_LABELS[c.contract_type]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.contract_brands.map((cb) => <Badge key={cb.brand.id} variant="outline">{cb.brand.name}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <VigencyDot expirationDate={c.expiration_date} legalStatus={c.status} />
                      {c.expiration_date ? new Date(c.expiration_date).toLocaleDateString('es-MX') : '-'}
                    </span>
                  </TableCell>
                  <TableCell><Badge>{CONTRACT_STATUS_LABELS[c.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
