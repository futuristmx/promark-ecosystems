'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/breadcrumb';
import { useTenantName } from '@/hooks/use-tenant-name';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS,
} from '@/lib/i18n/status-labels';

interface BrandItem { id: string; name: string }

interface Props {
  tenantId: string;
  brands: BrandItem[];
  contract?: {
    id: string;
    contract_type: string;
    title: string;
    description: string | null;
    parties: Record<string, unknown> | null;
    effective_date: string | null;
    expiration_date: string | null;
    renewal_terms: string | null;
    status: string;
    financial_terms: Record<string, unknown> | null;
    governing_law: string | null;
    notes: string | null;
    contract_brands?: { brand: { id: string; name: string } }[];
  };
}

const TYPES = ['LICENSE_INTERNAL','LICENSE_EXTERNAL','COEXISTENCE','ASSIGNMENT','FRANCHISE','DISTRIBUTION','SETTLEMENT','NDA'];
const STATUSES = ['DRAFT','ACTIVE','UNDER_REVIEW','RENEWED'];

export function ContractFormView({ tenantId, brands, contract }: Props) {
  const router = useRouter();
  const tenantName = useTenantName(tenantId);
  const initialParties = (contract?.parties ?? {}) as { otorgante?: string; receptor?: string };
  const initialFin = (contract?.financial_terms ?? {}) as { royalty_rate?: number; royalty_terms?: string };

  const [form, setForm] = useState({
    contract_type: contract?.contract_type ?? 'LICENSE_INTERNAL',
    title: contract?.title ?? '',
    description: contract?.description ?? '',
    otorgante: initialParties.otorgante ?? '',
    receptor: initialParties.receptor ?? '',
    effective_date: contract?.effective_date?.slice(0, 10) ?? '',
    expiration_date: contract?.expiration_date?.slice(0, 10) ?? '',
    renewal_terms: contract?.renewal_terms ?? '',
    status: contract?.status ?? 'DRAFT',
    royalty_rate: initialFin.royalty_rate?.toString() ?? '',
    royalty_terms: initialFin.royalty_terms ?? '',
    governing_law: contract?.governing_law ?? '',
    notes: contract?.notes ?? '',
    brand_ids: new Set<string>(contract?.contract_brands?.map((cb) => cb.brand.id) ?? []),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!contract;
  const showRoyalty = form.contract_type === 'LICENSE_INTERNAL' || form.contract_type === 'LICENSE_EXTERNAL' || form.contract_type === 'FRANCHISE';

  function toggleBrand(id: string) {
    const next = new Set(form.brand_ids);
    if (next.has(id)) next.delete(id); else next.add(id);
    setForm({ ...form, brand_ids: next });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = {
      contract_type: form.contract_type,
      title: form.title,
      description: form.description || null,
      parties: { otorgante: form.otorgante, receptor: form.receptor },
      effective_date: form.effective_date || null,
      expiration_date: form.expiration_date || null,
      renewal_terms: form.renewal_terms || null,
      status: form.status,
      financial_terms: showRoyalty ? {
        royalty_rate: form.royalty_rate ? Number(form.royalty_rate) : null,
        royalty_terms: form.royalty_terms || null,
      } : null,
      governing_law: form.governing_law || null,
      notes: form.notes || null,
      brand_ids: Array.from(form.brand_ids),
    };
    const url = isEdit
      ? `/api/tenants/${tenantId}/contracts/${contract!.id}`
      : `/api/tenants/${tenantId}/contracts`;
    const res = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/tenants/${tenantId}/contratos/${data.contract.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Error al guardar');
    }
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Clientes', href: '/tenants' },
        { label: tenantName || tenantId, href: `/tenants/${tenantId}/structure` },
        { label: 'Contratos', href: `/tenants/${tenantId}/contratos` },
        { label: isEdit ? 'Editar' : 'Nuevo' },
      ]} />
      <h1 className="mb-6 text-2xl font-bold">{isEdit ? 'Editar contrato' : 'Nuevo contrato'}</h1>
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Tipo de contrato</Label>
              <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{CONTRACT_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <Label>Estado</Label>
              <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Título</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Partes</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Otorgante</Label>
              <Input value={form.otorgante} onChange={(e) => setForm({ ...form, otorgante: e.target.value })} />
            </div>
            <div>
              <Label>Receptor</Label>
              <Input value={form.receptor} onChange={(e) => setForm({ ...form, receptor: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Marcas vinculadas</CardTitle></CardHeader>
          <CardContent>
            {brands.length === 0 ? (
              <p className="text-sm text-slate-500">Sin marcas disponibles.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <button key={b.id} type="button" onClick={() => toggleBrand(b.id)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      form.brand_ids.has(b.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 text-slate-600'
                    }`}>{b.name}</button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fechas y renovación</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Fecha de entrada en vigor</Label>
              <Input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} />
            </div>
            <div>
              <Label>Fecha de vencimiento</Label>
              <Input type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Términos de renovación</Label>
              <Textarea value={form.renewal_terms} onChange={(e) => setForm({ ...form, renewal_terms: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {showRoyalty && (
          <Card>
            <CardHeader><CardTitle>Condiciones económicas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Tasa de regalía (%)</Label>
                <Input type="number" step="0.01" value={form.royalty_rate}
                  onChange={(e) => setForm({ ...form, royalty_rate: e.target.value })} />
              </div>
              <div>
                <Label>Ley aplicable</Label>
                <Input value={form.governing_law} onChange={(e) => setForm({ ...form, governing_law: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Términos de regalías</Label>
                <Textarea value={form.royalty_terms} onChange={(e) => setForm({ ...form, royalty_terms: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Notas internas</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
