'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LICENSE_TYPE_LABELS, LICENSE_STATUS_LABELS } from '@/lib/i18n/status-labels';

interface BrandItem { id: string; name: string }
interface ContractItem { id: string; title: string }

interface Props {
  tenantId: string;
  brands: BrandItem[];
  contracts: ContractItem[];
  initialContractId: string | null;
  license?: {
    id: string; contract_id: string | null; brand_id: string; license_type: string;
    licensee_name: string; licensee_rfc: string | null; territory: string[];
    permitted_uses: string | null; prohibited_uses: string | null;
    effective_date: string | null; expiration_date: string | null;
    status: string; royalty_rate: string | null; royalty_terms: string | null; notes: string | null;
  };
}

const TYPES = ['EXCLUSIVE','NON_EXCLUSIVE','SUBLICENSE'];
const STATUSES = ['DRAFT','ACTIVE','SUSPENDED'];

export function LicenseFormView({ tenantId, brands, contracts, initialContractId, license }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    contract_id: license?.contract_id ?? initialContractId ?? '',
    brand_id: license?.brand_id ?? '',
    license_type: license?.license_type ?? 'NON_EXCLUSIVE',
    licensee_name: license?.licensee_name ?? '',
    licensee_rfc: license?.licensee_rfc ?? '',
    territory: (license?.territory ?? []).join(', '),
    permitted_uses: license?.permitted_uses ?? '',
    prohibited_uses: license?.prohibited_uses ?? '',
    effective_date: license?.effective_date?.slice(0, 10) ?? '',
    expiration_date: license?.expiration_date?.slice(0, 10) ?? '',
    status: license?.status ?? 'DRAFT',
    royalty_rate: license?.royalty_rate ?? '',
    royalty_terms: license?.royalty_terms ?? '',
    notes: license?.notes ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!license;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      contract_id: form.contract_id || null,
      brand_id: form.brand_id,
      license_type: form.license_type,
      licensee_name: form.licensee_name,
      licensee_rfc: form.licensee_rfc || null,
      territory: form.territory.split(',').map((t) => t.trim()).filter(Boolean),
      permitted_uses: form.permitted_uses || null,
      prohibited_uses: form.prohibited_uses || null,
      effective_date: form.effective_date || null,
      expiration_date: form.expiration_date || null,
      status: form.status,
      royalty_rate: form.royalty_rate ? Number(form.royalty_rate) : null,
      royalty_terms: form.royalty_terms || null,
      notes: form.notes || null,
    };
    const url = isEdit
      ? `/api/tenants/${tenantId}/licenses/${license!.id}`
      : `/api/tenants/${tenantId}/licenses`;
    const res = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (res.ok) {
      const d = await res.json();
      router.push(`/tenants/${tenantId}/licencias/${d.license.id}`);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Error al guardar');
    }
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Clientes', href: '/tenants' },
        { label: 'Licencias', href: `/tenants/${tenantId}/licencias` },
        { label: isEdit ? 'Editar' : 'Nueva' },
      ]} />
      <h1 className="mb-6 text-2xl font-bold">{isEdit ? 'Editar licencia' : 'Nueva licencia'}</h1>
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Marca</Label>
              <select required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                <option value="">Selecciona…</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Contrato vinculado (opcional)</Label>
              <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.contract_id} onChange={(e) => setForm({ ...form, contract_id: e.target.value })}>
                <option value="">Sin contrato</option>
                {contracts.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <Label>Tipo de licencia</Label>
              <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{LICENSE_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <Label>Estado</Label>
              <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{LICENSE_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <Label>Licenciatario</Label>
              <Input required value={form.licensee_name}
                onChange={(e) => setForm({ ...form, licensee_name: e.target.value })} />
            </div>
            <div>
              <Label>RFC del licenciatario</Label>
              <Input value={form.licensee_rfc}
                onChange={(e) => setForm({ ...form, licensee_rfc: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Territorio (separado por comas)</Label>
              <Input value={form.territory}
                onChange={(e) => setForm({ ...form, territory: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Usos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Usos permitidos</Label>
              <Textarea value={form.permitted_uses}
                onChange={(e) => setForm({ ...form, permitted_uses: e.target.value })} />
            </div>
            <div>
              <Label>Usos prohibidos</Label>
              <Textarea value={form.prohibited_uses}
                onChange={(e) => setForm({ ...form, prohibited_uses: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Vigencia y regalías</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Entrada en vigor</Label>
              <Input type="date" value={form.effective_date}
                onChange={(e) => setForm({ ...form, effective_date: e.target.value })} />
            </div>
            <div>
              <Label>Vencimiento</Label>
              <Input type="date" value={form.expiration_date}
                onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} />
            </div>
            <div>
              <Label>Tasa de regalía (%)</Label>
              <Input type="number" step="0.01" value={form.royalty_rate}
                onChange={(e) => setForm({ ...form, royalty_rate: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Términos de regalías</Label>
              <Textarea value={form.royalty_terms}
                onChange={(e) => setForm({ ...form, royalty_terms: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
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
