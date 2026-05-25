'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, KeyRound } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VigencyDot } from '@/components/vigency-badge';
import { LICENSE_TYPE_LABELS, LICENSE_STATUS_LABELS } from '@/lib/i18n/status-labels';
import { PageTitle, EmptyState } from '@/components/ds';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

interface LicenseItem {
  id: string;
  licensee_name: string;
  license_type: string;
  status: string;
  expiration_date: string | null;
  territory: string[];
  brand: { id: string; name: string };
}

const TYPES = ['EXCLUSIVE','NON_EXCLUSIVE','SUBLICENSE'];
const STATUSES = ['DRAFT','ACTIVE','EXPIRED','TERMINATED','SUSPENDED'];

export function LicensesListView({ tenantId, userRole }: { tenantId: string; userRole: string }) {
  const router = useRouter();
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
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
    const res = await fetch(`/api/tenants/${tenantId}/licenses?${qs}`);
    if (res.ok) {
      const data = await res.json();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLicenses(data.licenses || []);
    }
    setLoading(false);
  }, [tenantId, search, type, status, vigency]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const canCreate = userRole !== 'ASSISTANT';

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Clientes', href: '/tenants' },
        { label: '...', href: `/tenants/${tenantId}/structure` },
        { label: 'Licencias' },
      ]} />
      <PageTitle
        eyebrow="Cliente"
        title="Licencias"
        subtitle={`${licenses.length} licencia${licenses.length !== 1 ? 's' : ''} registrada${licenses.length !== 1 ? 's' : ''}.`}
        actions={
          canCreate ? (
            <Link
              href={`/tenants/${tenantId}/licencias/nueva`}
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <Plus className="size-4" />
              Nueva Licencia
            </Link>
          ) : null
        }
      />

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar por licenciatario..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TYPES.map((t) => <option key={t} value={t}>{LICENSE_TYPE_LABELS[t]}</option>)}
        </select>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{LICENSE_STATUS_LABELS[s]}</option>)}
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
        ) : licenses.length === 0 ? (
          <div className="py-20 text-center">
            <KeyRound className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Sin licencias</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Marca</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Licenciatario</TableHead>
                <TableHead>Territorio</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((l) => (
                <TableRow key={l.id} className="cursor-pointer"
                  onClick={() => router.push(`/tenants/${tenantId}/licencias/${l.id}`)}>
                  <TableCell className="px-4 font-medium">{l.brand.name}</TableCell>
                  <TableCell><Badge variant="secondary">{LICENSE_TYPE_LABELS[l.license_type]}</Badge></TableCell>
                  <TableCell>{l.licensee_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {l.territory.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <VigencyDot expirationDate={l.expiration_date} legalStatus={l.status} />
                      {l.expiration_date ? new Date(l.expiration_date).toLocaleDateString('es-MX') : '-'}
                    </span>
                  </TableCell>
                  <TableCell><Badge>{LICENSE_STATUS_LABELS[l.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
