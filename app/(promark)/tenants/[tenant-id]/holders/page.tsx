'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Users } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HOLDER_STATUS_LABELS } from '@/lib/i18n/status-labels';
import {
  PageTitle,
  EmptyState,
  DsDataTable,
  StatusBadge,
} from '@/components/ds';
import type { DsColumn } from '@/components/ds';

interface HoldersPageProps {
  params: Promise<{ 'tenant-id': string }>;
}

interface HolderItem {
  id: string;
  name: string;
  holder_type: string;
  rfc: string | null;
  status: string;
}

export default function HoldersPage({ params }: HoldersPageProps) {
  const { 'tenant-id': tenantId } = use(params);
  const router = useRouter();

  const [holders, setHolders] = useState<HolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/holders`);
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHolders(data.holders || []);
        setUserRole(data.userRole || '');
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredHolders = holders.filter((holder) => {
    if (
      searchQuery &&
      !holder.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(holder.rfc || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const canCreate = userRole !== 'ASSISTANT';

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          { label: '...', href: `/tenants/${tenantId}/structure` },
          { label: 'Titulares' },
        ]}
      />

      <PageTitle
        eyebrow="Cliente"
        title="Titulares"
        subtitle={`${filteredHolders.length} titular${filteredHolders.length !== 1 ? 'es' : ''} registrado${filteredHolders.length !== 1 ? 's' : ''}.`}
        actions={
          canCreate ? (
            <Link
              href={`/tenants/${tenantId}/holders/new`}
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <Plus className="size-4" />
              Nuevo Titular
            </Link>
          ) : null
        }
      />

      {/* Search */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o RFC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DsDataTable<HolderItem>
        columns={[
          {
            key: 'name',
            header: 'Nombre',
            sortable: true,
            cell: (h) => (
              <strong className="text-slate-900">{h.name}</strong>
            ),
          },
          {
            key: 'holder_type',
            header: 'Tipo',
            sortable: true,
            cell: (h) => <Badge variant="secondary">{h.holder_type}</Badge>,
          },
          {
            key: 'rfc',
            header: 'RFC',
            cell: (h) => (
              <span className="font-mono text-xs text-slate-500">
                {h.rfc || '—'}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            cell: (h) => (
              <StatusBadge
                tone={h.status === 'ACTIVE' ? 'success' : 'muted'}
                label={HOLDER_STATUS_LABELS[h.status] ?? h.status}
              />
            ),
          },
        ]}
        rows={filteredHolders}
        getRowId={(h) => h.id}
        loading={loading}
        empty={{
          icon: <Users className="size-6" />,
          title: 'Sin titulares registrados',
          description: 'Crea un nuevo titular para comenzar.',
          ...(canCreate && {
            action: (
              <Link
                href={`/tenants/${tenantId}/holders/new`}
                className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
              >
                <Plus className="size-4" />
                Nuevo titular
              </Link>
            ),
          }),
        }}
        onRowClick={(h) =>
          router.push(`/tenants/${tenantId}/holders/${h.id}`)
        }
      />
    </div>
  );
}
