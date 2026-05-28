'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Network, User, X, Loader2, Check } from 'lucide-react';
import { useToast } from '@/components/ds';

export type ReassignTargetType = 'company' | 'holding' | 'holder';

export interface ReassignSheetProps {
  tenantId: string;
  open: boolean;
  onClose: () => void;
  selectedBrandIds: string[];
  /** Pre-focus a specific tab, e.g. when the floating action bar opens it. */
  initialTab?: ReassignTargetType;
  onAssigned: () => void;
}

interface HoldingNode { id: string; name: string }
interface CompanyNode { id: string; name: string; holding?: { id: string; name: string } | null }
interface HolderNode { id: string; name: string }

const PALETTE = {
  bone: '#F1EDE3',
  ivory: '#FBF6EC',
  sand: '#E2DED6',
  navy: '#0F2E3D',
  slate: '#355B6F',
  amber: '#D39A2B',
};

export function ReassignSheet({
  tenantId,
  open,
  onClose,
  selectedBrandIds,
  initialTab,
  onAssigned,
}: ReassignSheetProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [holdings, setHoldings] = useState<HoldingNode[]>([]);
  const [companies, setCompanies] = useState<CompanyNode[]>([]);
  const [holders, setHolders] = useState<HolderNode[]>([]);
  const [pendingTarget, setPendingTarget] = useState<{
    type: ReassignTargetType;
    id: string;
    label: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReassignTargetType>(
    initialTab ?? 'company',
  );

  useEffect(() => {
    if (open && initialTab) setActiveTab(initialTab);
  }, [open, initialTab]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, cRes, holRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/holdings`),
        fetch(`/api/tenants/${tenantId}/companies`),
        fetch(`/api/tenants/${tenantId}/holders`),
      ]);
      if (hRes.ok) {
        const d = await hRes.json();
        setHoldings(d.holdings ?? []);
      }
      if (cRes.ok) {
        const d = await cRes.json();
        setCompanies(d.companies ?? []);
      }
      if (holRes.ok) {
        const d = await holRes.json();
        setHolders(d.holders ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  const submit = useCallback(async () => {
    if (!pendingTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/brands/bulk-reassign`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brandIds: selectedBrandIds,
          target: { type: pendingTarget.type, id: pendingTarget.id },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(data?.error ?? 'No se pudo reasignar');
      } else {
        toast.success(
          `${data.updated ?? selectedBrandIds.length} marca(s) reasignada(s) a ${pendingTarget.label}`,
        );
        setPendingTarget(null);
        onAssigned();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red al reasignar');
    } finally {
      setSubmitting(false);
    }
  }, [pendingTarget, selectedBrandIds, tenantId, toast, onAssigned, onClose]);

  const sections = useMemo(
    () => [
      { type: 'holding' as const, label: 'Holdings', icon: Network, items: holdings },
      { type: 'company' as const, label: 'Empresas', icon: Building2, items: companies },
      { type: 'holder' as const, label: 'Titulares', icon: User, items: holders },
    ],
    [holdings, companies, holders],
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop — non-blocking for drag operations */}
      <div
        onClick={() => onClose()}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,46,61,0.18)',
          backdropFilter: 'blur(2px)',
          zIndex: 60,
        }}
      />
      {/* Side drawer */}
      <aside
        role="dialog"
        aria-label="Reasignar marcas"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '420px',
          maxWidth: '92vw',
          background: PALETTE.ivory,
          borderLeft: `1px solid ${PALETTE.sand}`,
          boxShadow: '-12px 0 32px rgba(15,46,61,0.15)',
          zIndex: 61,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${PALETTE.sand}`, background: PALETTE.bone }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: PALETTE.slate }}>
              Reasignar
            </p>
            <h2 className="text-sm font-bold" style={{ color: PALETTE.navy }}>
              {selectedBrandIds.length} marca{selectedBrandIds.length === 1 ? '' : 's'} seleccionada{selectedBrandIds.length === 1 ? '' : 's'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: PALETTE.slate }}
            onMouseEnter={(e) => (e.currentTarget.style.background = PALETTE.sand)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Tabs */}
        <div
          className="flex gap-1 p-2"
          style={{ borderBottom: `1px solid ${PALETTE.sand}`, background: PALETTE.bone }}
        >
          {sections.map((s) => {
            const isActive = activeTab === s.type;
            const Icon = s.icon;
            return (
              <button
                key={s.type}
                type="button"
                onClick={() => setActiveTab(s.type)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
                style={
                  isActive
                    ? { background: PALETTE.navy, color: '#fff' }
                    : { color: PALETTE.slate }
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: PALETTE.amber }} />
            </div>
          ) : (
            sections
              .filter((s) => s.type === activeTab)
              .map((section) => (
                <div key={section.type}>
                  <p
                    className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: PALETTE.slate }}
                  >
                    {section.label}
                  </p>
                  {section.items.length === 0 ? (
                    <p className="px-3 py-6 text-xs" style={{ color: PALETTE.slate }}>
                      No hay {section.label.toLowerCase()}.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {section.items.map((node) => {
                        const key = `${section.type}:${node.id}`;
                        const isHover = hoverKey === key;
                        const Icon = section.icon;
                        const subtitle =
                          section.type === 'company' && 'holding' in node
                            ? (node as CompanyNode).holding?.name
                            : undefined;
                        return (
                          <li
                            key={node.id}
                            onDragEnter={() => setHoverKey(key)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              setHoverKey(key);
                            }}
                            onDragLeave={() => {
                              setHoverKey((k) => (k === key ? null : k));
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setHoverKey(null);
                              setPendingTarget({
                                type: section.type,
                                id: node.id,
                                label: node.name,
                              });
                            }}
                            onClick={() => {
                              setPendingTarget({
                                type: section.type,
                                id: node.id,
                                label: node.name,
                              });
                            }}
                            className="cursor-pointer rounded-lg px-3 py-2.5 transition-all"
                            style={{
                              border: `1.5px solid ${isHover ? PALETTE.amber : PALETTE.sand}`,
                              background: isHover ? 'rgba(211,154,43,0.08)' : '#fff',
                              transform: isHover ? 'scale(1.01)' : 'none',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-7 w-7 items-center justify-center rounded-md"
                                style={{ background: PALETTE.bone, color: PALETTE.slate }}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="truncate text-xs font-semibold"
                                  style={{ color: PALETTE.navy }}
                                >
                                  {node.name}
                                </p>
                                {subtitle && (
                                  <p className="truncate text-[10px]" style={{ color: PALETTE.slate }}>
                                    {subtitle}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))
          )}
        </div>

        {/* Inline confirmation */}
        {pendingTarget && (
          <div
            className="px-4 py-3"
            style={{ borderTop: `1px solid ${PALETTE.sand}`, background: PALETTE.bone }}
          >
            <p className="mb-2 text-xs" style={{ color: PALETTE.navy }}>
              ¿Reasignar <strong>{selectedBrandIds.length}</strong>{' '}
              marca{selectedBrandIds.length === 1 ? '' : 's'} a{' '}
              <strong>{pendingTarget.label}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingTarget(null)}
                disabled={submitting}
                className="flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{
                  border: `1px solid ${PALETTE.sand}`,
                  color: PALETTE.slate,
                  background: '#fff',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: PALETTE.amber, color: '#fff' }}
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Confirmar
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
