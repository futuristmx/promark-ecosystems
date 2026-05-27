'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, X, Trash2 } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { useTenantName } from '@/hooks/use-tenant-name';
import { buttonVariants, Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VigencyDot } from '@/components/vigency-badge';
import { DocumentsPanel } from '@/components/documents-panel';
import { StatusBadge, useToast } from '@/components/ds';
import type { StatusTone } from '@/components/ds';

const CONTRACT_STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  DRAFT: 'muted',
  EXPIRED: 'error',
  TERMINATED: 'muted',
  RENEWED: 'success',
  UNDER_REVIEW: 'warning',
};
import {
  CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS,
  CONTRACT_CHANGE_TYPE_LABELS,
} from '@/lib/i18n/status-labels';

interface ContractData {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  description: string | null;
  parties: { otorgante?: string; receptor?: string } | null;
  effective_date: string | null;
  expiration_date: string | null;
  renewal_terms: string | null;
  financial_terms: { royalty_rate?: number; royalty_terms?: string } | null;
  governing_law: string | null;
  notes: string | null;
  terminated_at: string | null;
  contract_brands: { id: string; brand: { id: string; name: string } }[];
}

interface Props {
  tenantId: string;
  userRole: string;
  contract: ContractData;
  availableBrands: { id: string; name: string }[];
}

interface LicenseRow { id: string; licensee_name: string; license_type: string; status: string; expiration_date: string | null; brand: { name: string } }
interface HistoryRow { id: string; change_type: string; summary: string; created_at: string }

const TABS = ['info', 'brands', 'licenses', 'documents', 'history'] as const;
type TabKey = typeof TABS[number];

export function ContractDetailView({ tenantId, userRole, contract: initial, availableBrands }: Props) {
  const router = useRouter();
  const toast = useToast();
  const tenantName = useTenantName(tenantId);
  const [tab, setTab] = useState<TabKey>('info');
  const [contract, setContract] = useState(initial);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [addBrandId, setAddBrandId] = useState('');

  const canWrite = userRole === 'SUPERADMIN' || userRole === 'LAWYER';
  const canCreate = canWrite || userRole === 'BRAND_ANALYST';

  const refreshContract = useCallback(async () => {
    const r = await fetch(`/api/tenants/${tenantId}/contracts/${contract.id}`);
    if (r.ok) {
      const d = await r.json();
      setContract(d.contract);
    }
  }, [tenantId, contract.id]);

  useEffect(() => {
    if (tab === 'licenses') {
      fetch(`/api/tenants/${tenantId}/contracts/${contract.id}/licenses`)
        .then((r) => r.json()).then((d) => setLicenses(d.licenses || []));
    } else if (tab === 'history') {
      fetch(`/api/tenants/${tenantId}/contracts/${contract.id}/history`)
        .then((r) => r.json()).then((d) => setHistory(d.history || []));
    }
  }, [tab, tenantId, contract.id]);

  async function terminateContract() {
    if (!confirm('¿Terminar este contrato?')) return;
    const r = await fetch(`/api/tenants/${tenantId}/contracts/${contract.id}/terminate`, { method: 'POST' });
    if (r.ok) {
      refreshContract();
      toast.success('Contrato terminado');
    } else {
      toast.error('No se pudo terminar el contrato');
    }
  }

  async function deleteContract() {
    if (!confirm('¿Eliminar este contrato?')) return;
    const r = await fetch(`/api/tenants/${tenantId}/contracts/${contract.id}`, { method: 'DELETE' });
    if (r.ok) {
      toast.success('Contrato eliminado');
      router.push(`/tenants/${tenantId}/contratos`);
    } else {
      toast.error('No se pudo eliminar');
    }
  }

  async function linkBrand() {
    if (!addBrandId) return;
    const r = await fetch(`/api/tenants/${tenantId}/contracts/${contract.id}/brands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_id: addBrandId }),
    });
    if (r.ok) {
      setAddBrandId('');
      refreshContract();
      toast.success('Marca vinculada al contrato');
    } else {
      toast.error('No se pudo vincular la marca');
    }
  }

  async function unlinkBrand(brandId: string) {
    const r = await fetch(`/api/tenants/${tenantId}/contracts/${contract.id}/brands?brand_id=${brandId}`, { method: 'DELETE' });
    if (r.ok) {
      refreshContract();
      toast.success('Marca desvinculada');
    } else {
      toast.error('No se pudo desvincular');
    }
  }

  const linkedIds = new Set(contract.contract_brands.map((cb) => cb.brand.id));
  const availableToLink = availableBrands.filter((b) => !linkedIds.has(b.id));

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Clientes', href: '/tenants' },
        { label: tenantName || tenantId, href: `/tenants/${tenantId}/structure` },
        { label: 'Contratos', href: `/tenants/${tenantId}/contratos` },
        { label: contract.title },
      ]} />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0066FF]">
            Contrato · {CONTRACT_TYPE_LABELS[contract.contract_type]}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {contract.title}
            </h1>
            <StatusBadge
              tone={CONTRACT_STATUS_TONE[contract.status] ?? 'muted'}
              label={CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {canWrite && contract.status !== 'TERMINATED' && (
            <Button variant="outline" onClick={terminateContract}>
              <X className="size-4" />Terminar
            </Button>
          )}
          {canWrite && (
            <Link href={`/tenants/${tenantId}/contratos/${contract.id}/editar`}
              className={buttonVariants({ variant: 'outline' })}>
              <Pencil className="size-4" />Editar
            </Link>
          )}
          {canWrite && (
            <Button variant="outline" onClick={deleteContract}>
              <Trash2 className="size-4" />Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(['info','brands','licenses','documents','history'] as TabKey[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'info' && 'Información general'}
            {t === 'brands' && 'Marcas vinculadas'}
            {t === 'licenses' && 'Licencias derivadas'}
            {t === 'documents' && 'Documentos'}
            {t === 'history' && 'Historial'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <Card>
          <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tipo">{CONTRACT_TYPE_LABELS[contract.contract_type]}</Field>
            <Field label="Estado">{CONTRACT_STATUS_LABELS[contract.status]}</Field>
            <Field label="Otorgante">{contract.parties?.otorgante ?? '-'}</Field>
            <Field label="Receptor">{contract.parties?.receptor ?? '-'}</Field>
            <Field label="Entrada en vigor">{fmt(contract.effective_date)}</Field>
            <Field label="Vencimiento">
              <span className="inline-flex items-center gap-2">
                <VigencyDot expirationDate={contract.expiration_date} legalStatus={contract.status} />
                {fmt(contract.expiration_date)}
              </span>
            </Field>
            <Field label="Ley aplicable">{contract.governing_law ?? '-'}</Field>
            <Field label="Terminado el">{fmt(contract.terminated_at)}</Field>
            {contract.financial_terms?.royalty_rate != null && (
              <Field label="Tasa de regalía">{contract.financial_terms.royalty_rate}%</Field>
            )}
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500">Descripción</p>
              <p className="text-sm text-slate-800">{contract.description ?? '-'}</p>
            </div>
            {contract.renewal_terms && (
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500">Términos de renovación</p>
                <p className="text-sm text-slate-800">{contract.renewal_terms}</p>
              </div>
            )}
            {contract.financial_terms?.royalty_terms && (
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500">Términos de regalías</p>
                <p className="text-sm text-slate-800">{contract.financial_terms.royalty_terms}</p>
              </div>
            )}
            {contract.notes && (
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500">Notas internas</p>
                <p className="text-sm text-slate-800">{contract.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'brands' && (
        <Card>
          <CardHeader><CardTitle>Marcas vinculadas</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {contract.contract_brands.length === 0 && <p className="text-sm text-slate-500">Sin marcas vinculadas.</p>}
              {contract.contract_brands.map((cb) => (
                <Badge key={cb.id} variant="outline" className="gap-2">
                  {cb.brand.name}
                  {canWrite && (
                    <button onClick={() => unlinkBrand(cb.brand.id)} className="hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {canWrite && availableToLink.length > 0 && (
              <div className="flex gap-2">
                <select className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={addBrandId} onChange={(e) => setAddBrandId(e.target.value)}>
                  <option value="">Selecciona una marca…</option>
                  {availableToLink.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <Button type="button" onClick={linkBrand} disabled={!addBrandId}>Vincular</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'licenses' && (
        <Card>
          <CardHeader>
            <CardTitle>Licencias derivadas</CardTitle>
            {canCreate && (
              <Link href={`/tenants/${tenantId}/licencias/nueva?contract_id=${contract.id}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Nueva licencia
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {licenses.length === 0 ? (
              <p className="text-sm text-slate-500">Sin licencias derivadas.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {licenses.map((l) => (
                  <li key={l.id} className="py-2">
                    <Link href={`/tenants/${tenantId}/licencias/${l.id}`} className="block hover:bg-slate-50 -mx-2 px-2 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{l.licensee_name}</div>
                          <div className="text-xs text-slate-500">{l.brand.name}</div>
                        </div>
                        <Badge>{l.status}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'documents' && (
        <DocumentsPanel
          tenantId={tenantId}
          entityType="CONTRACT"
          entityId={contract.id}
          canUpload={canCreate}
          canDelete={canWrite}
          canDownload={true}
        />
      )}

      {tab === 'history' && (
        <Card>
          <CardHeader><CardTitle>Historial de cambios</CardTitle></CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">Sin historial.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="border-l-2 border-blue-200 pl-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{CONTRACT_CHANGE_TYPE_LABELS[h.change_type] ?? h.change_type}</Badge>
                      <span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString('es-MX')}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-800">{h.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{children}</p>
    </div>
  );
}

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString('es-MX') : '-';
}
