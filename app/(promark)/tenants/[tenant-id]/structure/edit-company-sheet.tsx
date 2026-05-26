'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface EditCompanySheetProps {
  tenantId: string;
  companyId: string | null;
  open: boolean;
  onClose: () => void;
}

const COMPANY_TYPES = [
  { value: 'PARENT', label: 'Matriz' },
  { value: 'SUBSIDIARY', label: 'Subsidiaria' },
  { value: 'AFFILIATE', label: 'Afiliada' },
];

export function EditCompanySheet({ tenantId, companyId, open, onClose }: EditCompanySheetProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [rfc, setRfc] = useState('');
  const [companyType, setCompanyType] = useState('SUBSIDIARY');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!companyId || !open) return;
    setLoaded(false);
    fetch(`/api/tenants/${tenantId}/companies/${companyId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const c = d?.company ?? d;
        if (c) {
          setName(c.name ?? '');
          setLegalName(c.legal_name ?? '');
          setRfc(c.rfc ?? '');
          setCompanyType(c.company_type ?? 'SUBSIDIARY');
          setCountry(c.country ?? '');
          setState(c.state ?? '');
          setNotes(c.notes ?? '');
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, [tenantId, companyId, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          legal_name: legalName.trim(),
          rfc: rfc.trim() || null,
          company_type: companyType,
          country: country.trim() || null,
          state: state.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Error al guardar.');
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError('Error de red.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Empresa</SheetTitle>
          <SheetDescription>{loaded ? name : 'Cargando…'}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Razón social *</label>
            <input type="text" required value={legalName} onChange={(e) => setLegalName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo *</label>
            <select value={companyType} onChange={(e) => setCompanyType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]">
              {COMPANY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">RFC</label>
              <input type="text" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} maxLength={13}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">País</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
            <input type="text" value={state} onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]" />
          </div>
          <div className="mt-auto flex items-center justify-end gap-2 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !name.trim() || !legalName.trim()}
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
