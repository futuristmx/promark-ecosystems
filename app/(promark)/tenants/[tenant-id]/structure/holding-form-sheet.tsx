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

interface HoldingFormSheetProps {
  tenantId: string;
  open: boolean;
  onClose: () => void;
}

export function HoldingFormSheet({ tenantId, open, onClose }: HoldingFormSheetProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [rfc, setRfc] = useState('');
  const [country, setCountry] = useState('México');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  function reset() {
    setName('');
    setLegalName('');
    setRfc('');
    setCountry('México');
    setNotes('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/holdings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          legal_name: legalName.trim(),
          rfc: rfc.trim() || null,
          country: country.trim() || undefined,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Error al crear holding.');
        return;
      }
      reset();
      onClose();
      router.refresh();
      toast.success('Holding creada', `"${name.trim()}" se agregó a la estructura.`);
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
          <SheetTitle>Nuevo Holding</SheetTitle>
          <SheetDescription>
            Agrega un grupo corporativo a la estructura del cliente.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label htmlFor="h-name" className="mb-1 block text-sm font-medium text-slate-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="h-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Grupo Industrial Norte"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
            />
          </div>

          <div>
            <label htmlFor="h-legal" className="mb-1 block text-sm font-medium text-slate-700">
              Razón social <span className="text-red-500">*</span>
            </label>
            <input
              id="h-legal"
              type="text"
              required
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Ej: Grupo Industrial Norte S.A. de C.V."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="h-rfc" className="mb-1 block text-sm font-medium text-slate-700">
                RFC
              </label>
              <input
                id="h-rfc"
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                maxLength={13}
                placeholder="XAXX010101000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
              />
            </div>
            <div>
              <label htmlFor="h-country" className="mb-1 block text-sm font-medium text-slate-700">
                País
              </label>
              <input
                id="h-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="h-notes" className="mb-1 block text-sm font-medium text-slate-700">
              Notas
            </label>
            <textarea
              id="h-notes"
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
              {saving ? 'Creando…' : 'Crear Holding'}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
