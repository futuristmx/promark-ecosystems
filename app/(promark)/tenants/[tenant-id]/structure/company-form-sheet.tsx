'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ds';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface CompanyFormSheetProps {
  tenantId: string;
  holdingId: string;
  holdingName: string;
  open: boolean;
  onClose: () => void;
}

const COMPANY_TYPES = [
  { value: 'PARENT', label: 'Matriz' },
  { value: 'SUBSIDIARY', label: 'Subsidiaria' },
  { value: 'AFFILIATE', label: 'Afiliada' },
];

export function CompanyFormSheet({
  tenantId,
  holdingId,
  holdingName,
  open,
  onClose,
}: CompanyFormSheetProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [rfc, setRfc] = useState('');
  const [companyType, setCompanyType] = useState('SUBSIDIARY');
  const [country, setCountry] = useState('México');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  function reset() {
    setName('');
    setLegalName('');
    setRfc('');
    setCompanyType('SUBSIDIARY');
    setCountry('México');
    setState('');
    setNotes('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          legal_name: legalName.trim(),
          rfc: rfc.trim() || null,
          company_type: companyType,
          holding_id: holdingId,
          country: country.trim() || undefined,
          state: state.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Error al crear empresa.');
        return;
      }
      reset();
      onClose();
      router.refresh();
      toast.success('Empresa creada', `"${name.trim()}" se agregó a la estructura.`);
    } catch {
      setError('Error de red.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset();
          onClose();
        }
      }}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nueva Empresa</SheetTitle>
          <SheetDescription>
            Agrega una empresa al holding <strong>{holdingName}</strong>.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label htmlFor="c-name" className="mb-1 block text-sm font-medium text-slate-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="c-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Alimentos del Norte"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
            />
          </div>

          <div>
            <label htmlFor="c-legal" className="mb-1 block text-sm font-medium text-slate-700">
              Razón social <span className="text-red-500">*</span>
            </label>
            <input
              id="c-legal"
              type="text"
              required
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Ej: Alimentos del Norte S.A. de C.V."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
            />
          </div>

          <div>
            <label htmlFor="c-type" className="mb-1 block text-sm font-medium text-slate-700">
              Tipo de empresa <span className="text-red-500">*</span>
            </label>
            <select
              id="c-type"
              value={companyType}
              onChange={(e) => setCompanyType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
            >
              {COMPANY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="c-rfc" className="mb-1 block text-sm font-medium text-slate-700">
                RFC
              </label>
              <input
                id="c-rfc"
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                maxLength={13}
                placeholder="XAXX010101000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
              />
            </div>
            <div>
              <label htmlFor="c-country" className="mb-1 block text-sm font-medium text-slate-700">
                País
              </label>
              <input
                id="c-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="c-state" className="mb-1 block text-sm font-medium text-slate-700">
              Estado / Provincia
            </label>
            <input
              id="c-state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Ej: Nuevo León"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
            />
          </div>

          <div>
            <label htmlFor="c-notes" className="mb-1 block text-sm font-medium text-slate-700">
              Notas
            </label>
            <textarea
              id="c-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
            />
          </div>

          <div className="mt-auto flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !legalName.trim()}
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Creando…' : 'Crear Empresa'}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
