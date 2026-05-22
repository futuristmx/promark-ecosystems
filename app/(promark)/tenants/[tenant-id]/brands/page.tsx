'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Tag } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { VigencyBadge, VigencyDot } from '@/components/vigency-badge';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface BrandsPageProps {
  params: Promise<{ 'tenant-id': string }>;
}

interface BrandItem {
  id: string;
  name: string;
  company: { id: string; name: string };
  legal_status: string;
  registration_number: string | null;
  expiration_date: string | null;
  brand_type: string;
}

interface Company {
  id: string;
  name: string;
}

const LEGAL_STATUSES = [
  'APPLIED',
  'PUBLISHED',
  'REGISTERED',
  'RENEWED',
  'EXPIRED',
  'CANCELLED',
  'OPPOSED',
  'IN_LITIGATION',
];

const VIGENCY_FILTERS = ['Todas', 'Vigentes', 'Por vencer', 'Vencidas'] as const;

function getVigencyCategory(
  expirationDate: string | null,
  legalStatus: string
): string {
  if (
    legalStatus === 'CANCELLED' ||
    legalStatus === 'OPPOSED' ||
    legalStatus === 'APPLIED' ||
    legalStatus === 'PUBLISHED'
  ) {
    return 'Other';
  }
  if (!expirationDate) return 'Other';
  const diffDays = Math.ceil(
    (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 90) return 'Expiring';
  return 'Active';
}

function getLegalStatusColor(status: string): string {
  switch (status) {
    case 'REGISTERED':
    case 'RENEWED':
      return 'bg-green-100 text-green-800';
    case 'APPLIED':
    case 'PUBLISHED':
      return 'bg-blue-100 text-blue-800';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600';
    case 'OPPOSED':
    case 'IN_LITIGATION':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export default function BrandsPage({ params }: BrandsPageProps) {
  const { 'tenant-id': tenantId } = use(params);
  const router = useRouter();

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vigencyFilter, setVigencyFilter] =
    useState<(typeof VIGENCY_FILTERS)[number]>('Todas');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/brands`);
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBrands(data.brands || []);
        setCompanies(data.companies || []);
        setUserRole(data.userRole || '');
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBrands = brands.filter((brand) => {
    if (
      searchQuery &&
      !brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (companyFilter && brand.company.id !== companyFilter) return false;
    if (statusFilter && brand.legal_status !== statusFilter) return false;
    if (vigencyFilter !== 'Todas') {
      const category = getVigencyCategory(
        brand.expiration_date,
        brand.legal_status
      );
      if (vigencyFilter === 'Vigentes' && category !== 'Active') return false;
      if (vigencyFilter === 'Por vencer' && category !== 'Expiring') return false;
      if (vigencyFilter === 'Vencidas' && category !== 'Expired') return false;
    }
    return true;
  });

  const canCreate = userRole !== 'ASSISTANT';

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          {
            label: '...',
            href: `/tenants/${tenantId}/structure`,
          },
          { label: 'Marcas' },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Marcas</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filteredBrands.length} marca{filteredBrands.length !== 1 && 's'}
          </p>
        </div>
        {canCreate && (
          <Link href={`/tenants/${tenantId}/brands/new`} className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Nueva Marca
          </Link>
        )}
      </div>

      {/* Filters bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar marcas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Todas las empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Todos los estados</option>
          {LEGAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {VIGENCY_FILTERS.map((v) => (
            <button
              key={v}
              onClick={() => setVigencyFilter(v)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                vigencyFilter === v
                  ? 'bg-[#3E6AE1] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#3E6AE1]" />
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="py-20 text-center">
            <Tag className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              {brands.length === 0
                ? 'Este cliente no tiene marcas registradas'
                : 'Sin resultados para los filtros aplicados'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {brands.length === 0
                ? 'Registra la primera marca para comenzar.'
                : 'Ajusta los filtros para ver más resultados.'}
            </p>
            {brands.length === 0 && canCreate && (
              <Link
                href={`/tenants/${tenantId}/brands/new`}
                className={`${buttonVariants()} mt-4 inline-flex`}
              >
                <Plus className="h-4 w-4" />
                Nueva Marca
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>N° de registro</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="w-10">Vigencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => (
                <TableRow
                  key={brand.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/tenants/${tenantId}/brands/${brand.id}`
                    )
                  }
                >
                  <TableCell className="px-4 font-medium text-slate-900">
                    {brand.name}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {brand.company.name}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLegalStatusColor(brand.legal_status)}`}
                    >
                      {brand.legal_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {brand.registration_number || '-'}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {brand.expiration_date
                      ? new Date(brand.expiration_date).toLocaleDateString(
                          'es-MX'
                        )
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <VigencyDot
                      expirationDate={brand.expiration_date}
                      legalStatus={brand.legal_status}
                    />
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
