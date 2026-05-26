'use client';

import { useState } from 'react';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  tenantId: string;
  tenantName: string;
}

export function ClientPasswordReset({ tenantId, tenantName }: Props) {
  const [pin, setPin] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleReset() {
    if (pin.length < 4) {
      setMessage({ type: 'error', text: 'El PIN debe tener al menos 4 caracteres.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin: pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Error al resetear PIN.' });
      } else {
        setMessage({
          type: 'success',
          text: `PIN actualizado para ${data.name ?? data.email ?? tenantName}.`,
        });
        setPin('');
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">PIN de acceso del cliente</h3>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Establece un nuevo PIN de acceso para el administrador del portal de {tenantName}.
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            placeholder="Nuevo PIN (mín. 4 caracteres)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={saving || !pin}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0066FF] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0052CC] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? 'Guardando…' : 'Resetear'}
        </button>
      </div>

      {message && (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
