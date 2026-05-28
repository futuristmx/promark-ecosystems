'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Tag, Users, Scroll, KeyRound } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { VigencyDot } from '@/components/vigency-badge';
import {
  BRAND_STATUS_LABELS,
  BRAND_TYPE_LABELS,
  HOLDER_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  LICENSE_TYPE_LABELS,
  LICENSE_STATUS_LABELS,
} from '@/lib/i18n/status-labels';
import { DsDataTable, StatusBadge, EmptyState } from '@/components/ds';
import type { StatusTone } from '@/components/ds';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { PortfolioCsvBar } from './portfolio-csv-bar';
import {
  SmartFilterBar,
  buildOptions,
  vigencyBucket,
  VIGENCY_LABELS,
  type ActiveFilters,
} from '@/components/portfolio/smart-filter-bar';

const BRAND_STATUS_TONE: Record<string, StatusTone> = {
  REGISTERED: 'success', RENEWED: 'success', APPLIED: 'info', PUBLISHED: 'info',
  EXPIRED: 'error', CANCELLED: 'muted', OPPOSED: 'warning', IN_LITIGATION: 'warning',
};

interface PortfolioTabsProps {
  tenantId: string;
  userRole: string;
}

/* ──────────────── Types ──────────────── */
interface BrandItem {
  id: string; name: string; company: { id: string; name: string };
  legal_status: string; registration_number: string | null;
  expiration_date: string | null; brand_type: string; logos: unknown;
}
interface HolderItem { id: string; name: string; holder_type: string; rfc: string | null; status: string; }
interface ContractItem {
  id: string; title: string; contract_type: string; status: string;
  expiration_date: string | null; contract_brands: { brand: { id: string; name: string } }[];
}
interface LicenseItem {
  id: string; licensee_name: string; license_type: string; status: string;
  expiration_date: string | null; territory: string[]; brand: { id: string; name: string };
}


const VISUAL_BRAND_TYPES = ['FIGURATIVE', 'MIXED', 'THREE_D', 'TRADE_DRESS', 'HOLOGRAM'];

function BrandLogoThumb({ logos, brandType }: { logos: unknown; brandType: string }) {
  if (!VISUAL_BRAND_TYPES.includes(brandType)) return <div className="h-10 w-10" />;

  let src: string | null = null;
  if (typeof logos === 'string' && logos.startsWith('data:')) {
    src = logos;
  } else if (Array.isArray(logos) && logos.length > 0) {
    const first = logos[0];
    src = typeof first === 'string' ? first : first?.url ?? first?.data ?? null;
  } else if (logos && typeof logos === 'object' && !Array.isArray(logos)) {
    const obj = logos as Record<string, unknown>;
    src = (obj.url ?? obj.data ?? obj.image) as string | null;
  }

  if (!src) {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg text-[10px] font-semibold"
        style={{ background: '#F1EDE3', color: '#355B6F' }}
      >
        IMG
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Logo"
      className="h-10 w-10 rounded-lg object-contain"
      style={{ background: '#FBF6EC' }}
    />
  );
}

export function PortfolioTabs({ tenantId, userRole }: PortfolioTabsProps) {
  const router = useRouter();
  const canCreate = userRole !== 'ASSISTANT';

  /* ── Brands ── */
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandFilters, setBrandFilters] = useState<ActiveFilters>({});
  const [brandsView, setBrandsView] = useState<'table' | 'cards'>('cards');

  const fetchBrands = useCallback(async () => {
    setBrandsLoading(true);
    const res = await fetch(`/api/tenants/${tenantId}/brands`);
    if (res.ok) { const d = await res.json(); setBrands(d.brands || []); }
    setBrandsLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      if (brandSearch) {
        const q = brandSearch.toLowerCase();
        const hay = `${b.name} ${b.company.name} ${b.registration_number ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (brandFilters.status && !brandFilters.status.includes(b.legal_status)) return false;
      if (brandFilters.type && !brandFilters.type.includes(b.brand_type)) return false;
      if (brandFilters.company && !brandFilters.company.includes(b.company.id)) return false;
      if (brandFilters.vigency) {
        const bucket = vigencyBucket(b.expiration_date) ?? '';
        if (!brandFilters.vigency.includes(bucket)) return false;
      }
      return true;
    });
  }, [brands, brandSearch, brandFilters]);

  const brandFilterFields = useMemo(
    () => [
      { key: 'status', label: 'Estado', options: buildOptions(brands, (b) => b.legal_status, BRAND_STATUS_LABELS) },
      { key: 'type', label: 'Tipo', options: buildOptions(brands, (b) => b.brand_type, BRAND_TYPE_LABELS) },
      { key: 'company', label: 'Empresa', options: buildOptions(brands, (b) => b.company.id, Object.fromEntries(brands.map((b) => [b.company.id, b.company.name]))) },
      { key: 'vigency', label: 'Vigencia', options: buildOptions(brands, (b) => vigencyBucket(b.expiration_date), VIGENCY_LABELS) },
    ],
    [brands],
  );

  /* ── Holders ── */
  const [holders, setHolders] = useState<HolderItem[]>([]);
  const [holdersLoading, setHoldersLoading] = useState(true);
  const [holderSearch, setHolderSearch] = useState('');
  const [holderFilters, setHolderFilters] = useState<ActiveFilters>({});

  const fetchHolders = useCallback(async () => {
    setHoldersLoading(true);
    const res = await fetch(`/api/tenants/${tenantId}/holders`);
    if (res.ok) { const d = await res.json(); setHolders(d.holders || []); }
    setHoldersLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchHolders(); }, [fetchHolders]);

  const filteredHolders = useMemo(() => {
    return holders.filter((h) => {
      if (holderSearch) {
        const q = holderSearch.toLowerCase();
        const hay = `${h.name} ${h.rfc ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (holderFilters.type && !holderFilters.type.includes(h.holder_type)) return false;
      if (holderFilters.status && !holderFilters.status.includes(h.status)) return false;
      return true;
    });
  }, [holders, holderSearch, holderFilters]);

  const holderFilterFields = useMemo(
    () => [
      { key: 'type', label: 'Tipo', options: buildOptions(holders, (h) => h.holder_type) },
      { key: 'status', label: 'Estado', options: buildOptions(holders, (h) => h.status, HOLDER_STATUS_LABELS) },
    ],
    [holders],
  );

  /* ── Contracts ── */
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractSearch, setContractSearch] = useState('');
  const [contractFilters, setContractFilters] = useState<ActiveFilters>({});

  const fetchContracts = useCallback(async () => {
    setContractsLoading(true);
    const res = await fetch(`/api/tenants/${tenantId}/contracts`);
    if (res.ok) { const d = await res.json(); setContracts(d.contracts || []); }
    setContractsLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (contractSearch && !c.title.toLowerCase().includes(contractSearch.toLowerCase())) return false;
      if (contractFilters.type && !contractFilters.type.includes(c.contract_type)) return false;
      if (contractFilters.status && !contractFilters.status.includes(c.status)) return false;
      if (contractFilters.vigency) {
        const bucket = vigencyBucket(c.expiration_date) ?? '';
        if (!contractFilters.vigency.includes(bucket)) return false;
      }
      return true;
    });
  }, [contracts, contractSearch, contractFilters]);

  const contractFilterFields = useMemo(
    () => [
      { key: 'type', label: 'Tipo', options: buildOptions(contracts, (c) => c.contract_type, CONTRACT_TYPE_LABELS) },
      { key: 'status', label: 'Estado', options: buildOptions(contracts, (c) => c.status, CONTRACT_STATUS_LABELS) },
      { key: 'vigency', label: 'Vigencia', options: buildOptions(contracts, (c) => vigencyBucket(c.expiration_date), VIGENCY_LABELS) },
    ],
    [contracts],
  );

  /* ── Licenses ── */
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(true);
  const [licenseSearch, setLicenseSearch] = useState('');
  const [licenseFilters, setLicenseFilters] = useState<ActiveFilters>({});

  const fetchLicenses = useCallback(async () => {
    setLicensesLoading(true);
    const res = await fetch(`/api/tenants/${tenantId}/licenses`);
    if (res.ok) { const d = await res.json(); setLicenses(d.licenses || []); }
    setLicensesLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  const filteredLicenses = useMemo(() => {
    return licenses.filter((l) => {
      if (licenseSearch) {
        const q = licenseSearch.toLowerCase();
        const hay = `${l.licensee_name} ${l.brand.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (licenseFilters.type && !licenseFilters.type.includes(l.license_type)) return false;
      if (licenseFilters.status && !licenseFilters.status.includes(l.status)) return false;
      if (licenseFilters.vigency) {
        const bucket = vigencyBucket(l.expiration_date) ?? '';
        if (!licenseFilters.vigency.includes(bucket)) return false;
      }
      return true;
    });
  }, [licenses, licenseSearch, licenseFilters]);

  const licenseFilterFields = useMemo(
    () => [
      { key: 'type', label: 'Tipo', options: buildOptions(licenses, (l) => l.license_type, LICENSE_TYPE_LABELS) },
      { key: 'status', label: 'Estado', options: buildOptions(licenses, (l) => l.status, LICENSE_STATUS_LABELS) },
      { key: 'vigency', label: 'Vigencia', options: buildOptions(licenses, (l) => vigencyBucket(l.expiration_date), VIGENCY_LABELS) },
    ],
    [licenses],
  );

  const refetchAll = useCallback(() => {
    fetchBrands(); fetchHolders(); fetchContracts(); fetchLicenses();
  }, [fetchBrands, fetchHolders, fetchContracts, fetchLicenses]);

  return (
    <div className="space-y-4">
      {canCreate && (
        <PortfolioCsvBar tenantId={tenantId} onImportSuccess={refetchAll} />
      )}
    <Tabs defaultValue="brands" className="w-full">
      <TabsList>
        <TabsTrigger value="brands">
          <Tag className="mr-1.5 h-3.5 w-3.5" />
          Marcas ({brands.length})
        </TabsTrigger>
        <TabsTrigger value="holders">
          <Users className="mr-1.5 h-3.5 w-3.5" />
          Titulares ({holders.length})
        </TabsTrigger>
        <TabsTrigger value="contracts">
          <Scroll className="mr-1.5 h-3.5 w-3.5" />
          Contratos ({contracts.length})
        </TabsTrigger>
        <TabsTrigger value="licenses">
          <KeyRound className="mr-1.5 h-3.5 w-3.5" />
          Licencias ({licenses.length})
        </TabsTrigger>
      </TabsList>

      {/* ── MARCAS ── */}
      <TabsContent value="brands" className="space-y-4 pt-4">
        <SmartFilterBar
          searchValue={brandSearch}
          onSearchChange={setBrandSearch}
          searchPlaceholder="Buscar marcas por nombre, empresa o N° de registro…"
          fields={brandFilterFields}
          active={brandFilters}
          onActiveChange={setBrandFilters}
          totalResults={filteredBrands.length}
          totalUnfiltered={brands.length}
          rightSlot={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: '#F1EDE3' }}>
                <button type="button" onClick={() => setBrandsView('table')}
                  className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                  style={brandsView === 'table' ? { background: '#0F2E3D', color: '#fff' } : { color: '#355B6F' }}>
                  Tabla
                </button>
                <button type="button" onClick={() => setBrandsView('cards')}
                  className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                  style={brandsView === 'cards' ? { background: '#0F2E3D', color: '#fff' } : { color: '#355B6F' }}>
                  Cards
                </button>
              </div>
              {canCreate && (
                <Link href={`/tenants/${tenantId}/brands/new`}
                  className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                  <Plus className="size-3.5" /> Nueva
                </Link>
              )}
            </div>
          }
        />
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: '#C8C4B9',
            background: '#E2DED6',
            backgroundImage: 'none',
          }}
        >
          {brandsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C8C4B9] border-t-[#D39A2B]" />
            </div>
          ) : filteredBrands.length === 0 ? (
            <EmptyState icon={<Tag className="size-6" />}
              title={brands.length === 0 ? 'Sin marcas registradas' : 'Sin resultados'}
              description={brands.length === 0 ? 'Registra la primera marca.' : 'Ajusta la búsqueda.'} />
          ) : brandsView === 'cards' ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 p-4">
              {filteredBrands.map((b) => (
                <div
                  key={b.id}
                  onClick={() => router.push(`/tenants/${tenantId}/brands/${b.id}`)}
                  className="cursor-pointer rounded-2xl border p-4 transition-all"
                  style={{
                    borderColor: '#E2DED6',
                    background: '#FBF6EC',
                    backgroundImage: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(15,46,61,0.10)';
                    e.currentTarget.style.borderColor = '#D39A2B';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E2DED6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <BrandLogoThumb logos={b.logos} brandType={b.brand_type} />
                    <VigencyDot expirationDate={b.expiration_date} legalStatus={b.legal_status} />
                  </div>
                  <p className="text-sm font-bold truncate" style={{ color: '#0F2E3D' }}>{b.name}</p>
                  <p className="text-xs font-medium truncate" style={{ color: '#355B6F' }}>{b.company.name}</p>
                  <div className="mt-2">
                    <StatusBadge tone={BRAND_STATUS_TONE[b.legal_status] ?? 'muted'}
                      label={BRAND_STATUS_LABELS[b.legal_status] ?? b.legal_status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Logo</TableHead>
                  <TableHead className="px-4">Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>N° registro</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Vigencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer"
                    onClick={() => router.push(`/tenants/${tenantId}/brands/${b.id}`)}>
                    <TableCell className="w-16 px-2">
                      <BrandLogoThumb logos={b.logos} brandType={b.brand_type} />
                    </TableCell>
                    <TableCell className="px-4 font-medium text-slate-900">{b.name}</TableCell>
                    <TableCell className="text-slate-500">{b.company.name}</TableCell>
                    <TableCell>
                      <StatusBadge tone={BRAND_STATUS_TONE[b.legal_status] ?? 'muted'}
                        label={BRAND_STATUS_LABELS[b.legal_status] ?? b.legal_status} />
                    </TableCell>
                    <TableCell className="text-slate-500">{b.registration_number || '-'}</TableCell>
                    <TableCell className="text-slate-500">
                      {b.expiration_date ? new Date(b.expiration_date).toLocaleDateString('es-MX') : '-'}
                    </TableCell>
                    <TableCell>
                      <VigencyDot expirationDate={b.expiration_date} legalStatus={b.legal_status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </div>
      </TabsContent>

      {/* ── TITULARES ── */}
      <TabsContent value="holders" className="space-y-4 pt-4">
        <SmartFilterBar
          searchValue={holderSearch}
          onSearchChange={setHolderSearch}
          searchPlaceholder="Buscar titulares por nombre o RFC…"
          fields={holderFilterFields}
          active={holderFilters}
          onActiveChange={setHolderFilters}
          totalResults={filteredHolders.length}
          totalUnfiltered={holders.length}
          rightSlot={
            canCreate ? (
              <Link href={`/tenants/${tenantId}/holders/new`}
                className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                <Plus className="size-3.5" /> Nuevo
              </Link>
            ) : null
          }
        />
        <DsDataTable<HolderItem>
          columns={[
            { key: 'name', header: 'Nombre', sortable: true,
              cell: (h) => <strong className="text-slate-900">{h.name}</strong> },
            { key: 'holder_type', header: 'Tipo', cell: (h) => <Badge variant="secondary">{h.holder_type}</Badge> },
            { key: 'rfc', header: 'RFC',
              cell: (h) => <span className="font-mono text-xs text-slate-500">{h.rfc || '—'}</span> },
            { key: 'status', header: 'Estado',
              cell: (h) => <StatusBadge tone={h.status === 'ACTIVE' ? 'success' : 'muted'}
                label={HOLDER_STATUS_LABELS[h.status] ?? h.status} /> },
          ]}
          rows={filteredHolders}
          getRowId={(h) => h.id}
          loading={holdersLoading}
          empty={{ icon: <Users className="size-6" />, title: 'Sin titulares', description: 'Crea un titular.' }}
          onRowClick={(h) => router.push(`/tenants/${tenantId}/holders/${h.id}`)}
        />
      </TabsContent>

      {/* ── CONTRATOS ── */}
      <TabsContent value="contracts" className="space-y-4 pt-4">
        <SmartFilterBar
          searchValue={contractSearch}
          onSearchChange={setContractSearch}
          searchPlaceholder="Buscar contratos por título…"
          fields={contractFilterFields}
          active={contractFilters}
          onActiveChange={setContractFilters}
          totalResults={filteredContracts.length}
          totalUnfiltered={contracts.length}
          rightSlot={
            canCreate ? (
              <Link href={`/tenants/${tenantId}/contratos/nuevo`}
                className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                <Plus className="size-3.5" /> Nuevo
              </Link>
            ) : null
          }
        />
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: '#C8C4B9', background: '#E2DED6', backgroundImage: 'none' }}>
          {contractsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#0066FF]" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <EmptyState icon={<Scroll className="size-6" />} title="Sin contratos" description="Registra el primer contrato." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marcas</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer"
                    onClick={() => router.push(`/tenants/${tenantId}/contratos/${c.id}`)}>
                    <TableCell className="px-4 font-medium text-slate-900">{c.title}</TableCell>
                    <TableCell><Badge variant="secondary">{CONTRACT_TYPE_LABELS[c.contract_type] ?? c.contract_type}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.contract_brands.map((cb) => <Badge key={cb.brand.id} variant="outline">{cb.brand.name}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <VigencyDot expirationDate={c.expiration_date} legalStatus={c.status} />
                        {c.expiration_date ? new Date(c.expiration_date).toLocaleDateString('es-MX') : '-'}
                      </span>
                    </TableCell>
                    <TableCell><Badge>{CONTRACT_STATUS_LABELS[c.status] ?? c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>

      {/* ── LICENCIAS ── */}
      <TabsContent value="licenses" className="space-y-4 pt-4">
        <SmartFilterBar
          searchValue={licenseSearch}
          onSearchChange={setLicenseSearch}
          searchPlaceholder="Buscar licencias por licenciatario o marca…"
          fields={licenseFilterFields}
          active={licenseFilters}
          onActiveChange={setLicenseFilters}
          totalResults={filteredLicenses.length}
          totalUnfiltered={licenses.length}
          rightSlot={
            canCreate ? (
              <Link href={`/tenants/${tenantId}/licencias/nueva`}
                className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                <Plus className="size-3.5" /> Nueva
              </Link>
            ) : null
          }
        />
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: '#C8C4B9', background: '#E2DED6', backgroundImage: 'none' }}>
          {licensesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#0066FF]" />
            </div>
          ) : filteredLicenses.length === 0 ? (
            <EmptyState icon={<KeyRound className="size-6" />} title="Sin licencias" />
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
                {filteredLicenses.map((l) => (
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
      </TabsContent>
    </Tabs>
    </div>
  );
}
