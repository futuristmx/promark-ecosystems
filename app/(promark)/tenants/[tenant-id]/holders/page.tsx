'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Users } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

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
          { label: 'Tenants', href: '/tenants' },
          { label: '...', href: `/tenants/${tenantId}/structure` },
          { label: 'Holders' },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Holders</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filteredHolders.length} holder
            {filteredHolders.length !== 1 && 's'} found
          </p>
        </div>
        {canCreate && (
          <Link href={`/tenants/${tenantId}/holders/new`} className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              New Holder
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or RFC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#3E6AE1]" />
          </div>
        ) : filteredHolders.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              No holders found
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Create a new holder to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>RFC</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolders.map((holder) => (
                <TableRow
                  key={holder.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/tenants/${tenantId}/holders/${holder.id}`
                    )
                  }
                >
                  <TableCell className="px-4 font-medium text-slate-900">
                    {holder.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{holder.holder_type}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {holder.rfc || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        holder.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {holder.status}
                    </span>
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
