'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Tag, Users, Scroll, KeyRound, Download, Upload } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VigencyDot } from '@/components/vigency-badge';
import {
  BRAND_STATUS_LABELS,
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
  expiration_date: string | null; brand_type: string;
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

function downloadCSV(tenantId: string, type: string) {
  window.open(`/api/tenants/${tenantId}/csv?type=${type}`, '_blank');
}

function CsvImportButton({ tenantId, type, onDone }: { tenantId: string; type: string; onDone: () => void }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch(`/api/tenants/${tenantId}/csv?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        onDone();
      } else {
        setResult({ created: 0, updated: 0, errors: [data.error] });
      }
    } catch {
      setResult({ created: 0, updated: 0, errors: ['Error de red.'] });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div className="relative">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
        <Upload className="h-3.5 w-3.5" />
        {importing ? 'Importando…' : 'Importar CSV'}
        <input type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={importing} />
      </label>
      {result && (
        <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
          <p className="font-medium text-slate-700">{result.created} creados, {result.updated} actualizados</p>
          {result.errors.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-red-600">
              {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          <button onClick={() => setResult(null)} className="mt-2 text-slate-400 hover:text-slate-600">Cerrar</button>
        </div>
      )}
    </div>
  );
}

export function PortfolioTabs({ tenantId, userRole }: PortfolioTabsProps) {
  const router = useRouter();
  const canCreate = userRole !== 'ASSISTANT';

  /* ── Brands ── */
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState('');

  const fetchBrands = useCallback(async () => {
    setBrandsLoading(true);
    const res = await fetch(`/api/tenants/${tenantId}/brands`);
    if (res.ok) { const d = await res.json(); setBrands(d.brands || []); }
    setBrandsLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const filteredBrands = brands.filter((b) =>
    !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  /* ── Holders ── */
  const [holders, setHolders] = useState<HolderItem[]>([]);
  const [holdersLoading, setHoldersLoading] = useState(true);
  const [holderSearch, setHolderSearch] = useState('');

  const fetchHolders = useCallback(async () => {
    setHoldersLoading(true);
    const res = await fetch(`/api/tenants/${tenantId}/holders`);
    if (res.ok) { const d = await res.json(); setHolders(d.holders || []); }
    setHoldersLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchHolders(); }, [fetchHolders]);

  const filteredHolders = holders.filter((h) =>
    !holderSearch || h.name.toLowerCase().includes(holderSearch.toLowerCase())
  );

  /* ── Contracts ── */
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractSearch, setContractSearch] = useState('');

  const fetchContracts = useCallback(async () => {
    setContractsLoading(true);
    const res = await fetch(`/api/tenants/${tenantId}/contracts`);
    if (res.ok) { const d = await res.json(); setContracts(d.contracts || []); }
    setContractsLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const filteredContracts = contracts.filter((c) =>
    !contractSearch || c.title.toLowerCase().includes(contractSearch.toLowerCase())
  );

  /* ── Licenses ── */
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(true);
  const [licenseSearch, setLicenseSearch] = useState('');

  const fetchLicenses = useCallback(async () => {
    setLicensesLoading(true);
    const res = await fetch(`/api/tenants/${tenantId}/licenses`);
    if (res.ok) { const d = await res.json(); setLicenses(d.licenses || []); }
    setLicensesLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  const filteredLicenses = licenses.filter((l) =>
    !licenseSearch || l.licensee_name.toLowerCase().includes(licenseSearch.toLowerCase())
  );

  return (
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
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar marcas..." value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => downloadCSV(tenantId, 'brands')} title="Exportar CSV"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            {canCreate && (
              <Link href={`/tenants/${tenantId}/brands/new`}
                className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium">
                <Plus className="size-4" /> Nueva Marca
              </Link>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {brandsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#0066FF]" />
            </div>
          ) : filteredBrands.length === 0 ? (
            <EmptyState icon={<Tag className="size-6" />}
              title={brands.length === 0 ? 'Sin marcas registradas' : 'Sin resultados'}
              description={brands.length === 0 ? 'Registra la primera marca.' : 'Ajusta la búsqueda.'} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>N° registro</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="w-10">Vig.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer"
                    onClick={() => router.push(`/tenants/${tenantId}/brands/${b.id}`)}>
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
          )}
        </div>
      </TabsContent>

      {/* ── TITULARES ── */}
      <TabsContent value="holders" className="space-y-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar titulares..." value={holderSearch}
              onChange={(e) => setHolderSearch(e.target.value)} className="pl-9" />
          </div>
          {canCreate && (
            <Link href={`/tenants/${tenantId}/holders/new`}
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium">
              <Plus className="size-4" /> Nuevo Titular
            </Link>
          )}
        </div>
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
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar contratos..." value={contractSearch}
              onChange={(e) => setContractSearch(e.target.value)} className="pl-9" />
          </div>
          {canCreate && (
            <Link href={`/tenants/${tenantId}/contratos/nuevo`}
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium">
              <Plus className="size-4" /> Nuevo Contrato
            </Link>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar licencias..." value={licenseSearch}
              onChange={(e) => setLicenseSearch(e.target.value)} className="pl-9" />
          </div>
          {canCreate && (
            <Link href={`/tenants/${tenantId}/licencias/nueva`}
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium">
              <Plus className="size-4" /> Nueva Licencia
            </Link>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
  );
}
