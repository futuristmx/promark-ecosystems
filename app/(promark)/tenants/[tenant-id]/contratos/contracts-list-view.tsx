'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Scroll } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { useTenantName } from '@/hooks/use-tenant-name';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VigencyDot } from '@/components/vigency-badge';
import { PageTitle, EmptyState } from '@/components/ds';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
} from '@/lib/i18n/status-labels';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';

interface ContractItem {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  expiration_date: string | null;
  parties: { otorgante?: string; receptor?: string } | null;
  contract_brands: { brand: { id: string; name: string } }[];
}

interface Props {
  tenantId: string;
  userRole: string;
}

const TYPES = ['LICENSE_INTERNAL','LICENSE_EXTERNAL','COEXISTENCE','ASSIGNMENT','FRANCHISE','DISTRIBUTION','SETTLEMENT','NDA'];
const STATUSES = ['DRAFT','ACTIVE','EXPIRED','TERMINATED','RENEWED','UNDER_REVIEW'];

export function ContractsListView({ tenantId, userRole }: Props) {
  const router = useRouter();
  const tenantName = useTenantName(tenantId);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [vigency, setVigency] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (type) qs.set('type', type);
    if (status) qs.set('status', status);
    if (vigency) qs.set('vigency', vigency);
    const res = await fetch(`/api/tenants/${tenantId}/contracts?${qs}`);
    if (res.ok) {
      const data = await res.json();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContracts(data.contracts || []);
    }
    setLoading(false);
  }, [tenantId, search, type, status, vigency]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const canCreate = userRole !== 'ASSISTANT';

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Clientes', href: '/tenants' },
        { label: tenantName || tenantId, href: `/tenants/${tenantId}/structure` },
        { label: 'Contratos' },
      ]} />
      <PageTitle
        eyebrow="Cliente"
        title="Contratos"
        subtitle={`${contracts.length} contrato${contracts.length !== 1 ? 's' : ''} registrado${contracts.length !== 1 ? 's' : ''}.`}
        actions={
          canCreate ? (
            <Link
              href={`/tenants/${tenantId}/contratos/nuevo`}
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <Plus className="size-4" />
              Nuevo contrato
            </Link>
          ) : null
        }
      />

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar por título..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TYPES.map((t) => <option key={t} value={t}>{CONTRACT_TYPE_LABELS[t]}</option>)}
        </select>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>)}
        </select>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={vigency} onChange={(e) => setVigency(e.target.value)}>
          <option value="">Todas las vigencias</option>
          <option value="vigentes">Vigentes</option>
          <option value="por_vencer">Por vencer</option>
          <option value="vencidos">Vencidos</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#3E6AE1]" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-20 text-center">
            <Scroll className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No hay contratos registrados</p>
            <p className="mt-1 text-sm text-slate-400">Registra el primer contrato del cliente.</p>
            {canCreate && (
              <Link
                href={`/tenants/${tenantId}/contratos/nuevo`}
                className="ds-btn-primary mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
              >
                <Plus className="size-4" />
                Nuevo Contrato
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marcas vinculadas</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id} className="cursor-pointer"
                  onClick={() => router.push(`/tenants/${tenantId}/contratos/${c.id}`)}>
                  <TableCell className="px-4 font-medium text-slate-900">{c.title}</TableCell>
                  <TableCell><Badge variant="secondary">{CONTRACT_TYPE_LABELS[c.contract_type] ?? c.contract_type}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.contract_brands.map((cb) => (
                        <Badge key={cb.brand.id} variant="outline">{cb.brand.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <VigencyDot expirationDate={c.expiration_date} legalStatus={c.status} />
                      {c.expiration_date ? new Date(c.expiration_date).toLocaleDateString('es-MX') : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge>{CONTRACT_STATUS_LABELS[c.status] ?? c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
