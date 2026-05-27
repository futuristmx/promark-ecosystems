'use client';

import { useState, useEffect } from 'react';
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

interface EditHoldingSheetProps {
  tenantId: string;
  holdingId: string | null;
  open: boolean;
  onClose: () => void;
}

interface HoldingData {
  id: string;
  name: string;
  legal_name: string;
  rfc: string | null;
  country: string | null;
  notes: string | null;
  status: string;
}

export function EditHoldingSheet({ tenantId, holdingId, open, onClose }: EditHoldingSheetProps) {
  const router = useRouter();
  const [data, setData] = useState<HoldingData | null>(null);
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [rfc, setRfc] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!holdingId || !open) return;
    fetch(`/api/tenants/${tenantId}/holdings`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const h = d?.holdings?.find((h: HoldingData) => h.id === holdingId);
        if (h) {
          setData(h);
          setName(h.name);
          setLegalName(h.legal_name);
          setRfc(h.rfc ?? '');
          setCountry(h.country ?? '');
          setNotes(h.notes ?? '');
        }
      })
      .catch(() => {});
  }, [tenantId, holdingId, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!holdingId) return;
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/holdings/${holdingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          legal_name: legalName.trim(),
          rfc: rfc.trim() || null,
          country: country.trim() || null,
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
      toast.success('Holding actualizada');
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
          <SheetTitle>Editar Holding</SheetTitle>
          <SheetDescription>{data?.name ?? ''}</SheetDescription>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]" />
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                if (!data) return;
                if (!confirm(`¿Eliminar el holding "${data.name}"? Esta acción no se puede deshacer.\n\nSi tiene empresas asociadas, primero hay que reasignarlas o eliminarlas.`)) return;
                setSaving(true);
                try {
                  const res = await fetch(`/api/tenants/${tenantId}/holdings/${holdingId}`, { method: 'DELETE' });
                  if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    toast.error('No se pudo eliminar', d.error ?? 'Intenta de nuevo.');
                    setSaving(false);
                    return;
                  }
                  toast.success('Holding eliminado');
                  onClose();
                  router.refresh();
                } catch {
                  toast.error('Error de red');
                  setSaving(false);
                }
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: 'rgba(180,35,24,0.3)', color: '#B42318', background: 'rgba(180,35,24,0.04)' }}
            >
              Eliminar
            </button>
            <div className="flex items-center gap-2">
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
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
