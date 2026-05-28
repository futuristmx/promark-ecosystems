'use client';

import { useState } from 'react';
import { Eye, EyeOff, MessageCircle } from 'lucide-react';
import { HelpTip } from '@/components/ds';

/* ── Catálogo de tipos de alerta visibles para el cliente ───────────────── */
export const ALERT_TYPE_KEYS = [
  'BRAND.EXPIRY_WARNING',
  'BRAND.EXPIRED',
  'CONTRACT.EXPIRY_WARNING',
  'CONTRACT.EXPIRED',
  'LICENSE.EXPIRY_WARNING',
  'LICENSE.EXPIRED',
  'DOCUMENT.DOCUMENT_EXPIRY',
] as const;
export type AlertTypeKey = (typeof ALERT_TYPE_KEYS)[number];

const ALERT_TYPE_META: Record<AlertTypeKey, { label: string; supportsDays: boolean; hint: string }> = {
  'BRAND.EXPIRY_WARNING':     { label: 'Marca por vencer',        supportsDays: true,  hint: 'Avisa cuando una marca está próxima a expirar.' },
  'BRAND.EXPIRED':            { label: 'Marca vencida',           supportsDays: false, hint: 'Se dispara al pasar la fecha de expiración.' },
  'CONTRACT.EXPIRY_WARNING':  { label: 'Contrato por vencer',     supportsDays: true,  hint: 'Avisa cuando un contrato está próximo a expirar.' },
  'CONTRACT.EXPIRED':         { label: 'Contrato vencido',        supportsDays: false, hint: 'Se dispara al pasar la fecha del contrato.' },
  'LICENSE.EXPIRY_WARNING':   { label: 'Licencia por vencer',     supportsDays: true,  hint: 'Avisa cuando una licencia está próxima a expirar.' },
  'LICENSE.EXPIRED':          { label: 'Licencia vencida',        supportsDays: false, hint: 'Se dispara al pasar la fecha de la licencia.' },
  'DOCUMENT.DOCUMENT_EXPIRY': { label: 'Documento por vencer',    supportsDays: true,  hint: 'Avisa cuando un documento (poder, etc.) está por expirar.' },
};

export interface ClientAlertTypeConfig {
  visible: boolean;
  trigger_days?: number;
  comment?: string;
}

export interface ClientAlertsConfig {
  enabled: boolean;
  general_comment?: string;
  types?: Partial<Record<AlertTypeKey, ClientAlertTypeConfig>>;
}

const DEFAULT_DAYS_FOR_KEY: Partial<Record<AlertTypeKey, number>> = {
  'BRAND.EXPIRY_WARNING': 90,
  'CONTRACT.EXPIRY_WARNING': 60,
  'LICENSE.EXPIRY_WARNING': 60,
  'DOCUMENT.DOCUMENT_EXPIRY': 30,
};

interface Props {
  value: ClientAlertsConfig;
  onChange: (next: ClientAlertsConfig) => void;
}

export function ClientAlertsConfigEditor({ value, onChange }: Props) {
  function patchType(key: AlertTypeKey, patch: Partial<ClientAlertTypeConfig>) {
    onChange({
      ...value,
      types: {
        ...value.types,
        [key]: {
          ...value.types?.[key],
          ...patch,
        },
      },
    });
  }
  function isVisible(key: AlertTypeKey): boolean {
    return value.types?.[key]?.visible ?? false;
  }
  function getDays(key: AlertTypeKey): number {
    return value.types?.[key]?.trigger_days ?? DEFAULT_DAYS_FOR_KEY[key] ?? 30;
  }
  function getComment(key: AlertTypeKey): string {
    return value.types?.[key]?.comment ?? '';
  }

  return (
    <div className="space-y-5">
      {/* Master toggle */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: value.enabled ? 'rgba(47,107,79,0.1)' : 'rgba(200,196,185,0.3)',
                color: value.enabled ? '#2F6B4F' : '#C8C4B9',
              }}
            >
              {value.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                  Alertas visibles en el portal del cliente
                </h3>
                <HelpTip>
                  Cuando está apagado, el cliente no verá la sección Alertas
                  ni ningún aviso de vencimiento en su portal. La generación
                  interna y los correos a Promark NO se ven afectados.
                </HelpTip>
              </div>
              <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
                Controla qué tipos de alerta puede ver el cliente al ingresar
                a su portal. No envía correos al cliente.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={value.enabled}
            aria-label="Activar alertas en portal cliente"
            onClick={() => onChange({ ...value, enabled: !value.enabled })}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none"
            style={{
              background: value.enabled ? '#2F6B4F' : '#C8C4B9',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
            }}
          >
            <span
              className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: value.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
      </div>

      {/* Detalle por tipo — solo si master está ON */}
      {value.enabled && (
        <>
          {/* General comment */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4" style={{ color: '#0F2E3D' }} />
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                Comentario general
              </h3>
              <HelpTip>
                Mensaje que aparece arriba de todas las alertas en el portal
                del cliente. Útil para dar contexto general (instrucciones,
                contacto, etc.). Déjalo vacío para no mostrar banner.
              </HelpTip>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              Aparece como banner sobre la lista de alertas del cliente.
            </p>
            <textarea
              rows={2}
              value={value.general_comment ?? ''}
              onChange={(e) => onChange({ ...value, general_comment: e.target.value })}
              placeholder="Ej. Para cualquier duda sobre tus alertas, contacta a Promark vía WhatsApp."
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#E2DED6', background: '#FBF6EC', color: '#0F2E3D' }}
            />
          </div>

          {/* Per-type */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: '#0F2E3D' }}>
                Tipos de alerta a mostrar
              </h3>
              <HelpTip>
                Cada tipo se puede mostrar u ocultar de forma independiente.
                En las que aplica, configura los días de anticipación y un
                comentario opcional que se muestra junto a esa alerta.
              </HelpTip>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
              Elige qué tipos de alerta verá el cliente. Estos toggles solo
              afectan la visibilidad en el portal cliente, no la generación
              interna.
            </p>

            <div className="mt-4 space-y-3">
              {ALERT_TYPE_KEYS.map((key) => {
                const meta = ALERT_TYPE_META[key];
                const visible = isVisible(key);
                return (
                  <div
                    key={key}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: visible ? '#E2DED6' : '#E2DED6',
                      background: '#FBF6EC',
                      opacity: visible ? 1 : 0.7,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#0F2E3D' }}>
                          {meta.label}
                        </p>
                        <p className="mt-0.5 text-[11px]" style={{ color: '#355B6F' }}>
                          {meta.hint}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={visible}
                        aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${meta.label}`}
                        onClick={() => patchType(key, { visible: !visible })}
                        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                        style={{ background: visible ? '#2F6B4F' : '#C8C4B9' }}
                      >
                        <span
                          className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
                          style={{ transform: visible ? 'translateX(18px)' : 'translateX(2px)' }}
                        />
                      </button>
                    </div>

                    {visible && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {meta.supportsDays && (
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                              Días de anticipación
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={getDays(key)}
                                onChange={(e) =>
                                  patchType(key, { trigger_days: Number(e.target.value) || 30 })
                                }
                                className="w-24 rounded-lg border px-3 py-1.5 text-sm focus:outline-none"
                                style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
                              />
                              <span className="text-xs" style={{ color: '#355B6F' }}>días antes</span>
                            </div>
                          </div>
                        )}
                        <div className={meta.supportsDays ? '' : 'sm:col-span-2'}>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
                            Comentario para esta alerta
                          </label>
                          <input
                            type="text"
                            value={getComment(key)}
                            onChange={(e) => patchType(key, { comment: e.target.value })}
                            placeholder="Opcional: aparece junto a esta alerta en el portal."
                            className="w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none"
                            style={{ borderColor: '#E2DED6', background: '#FFFFFF', color: '#0F2E3D' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
