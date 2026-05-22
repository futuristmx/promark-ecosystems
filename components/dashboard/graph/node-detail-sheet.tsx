'use client';

import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { buttonVariants } from '@/components/ui/button';

export interface SelectedNode {
  id: string;
  type: string;
  label: string;
  status?: string;
  metadata?: Record<string, unknown>;
  entityId?: string;
}

interface NodeDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: SelectedNode | null;
  tenantId: string;
}

const TYPE_LABELS: Record<string, string> = {
  HOLDING: 'Holding',
  COMPANY: 'Empresa',
  BRAND: 'Marca',
  HOLDER: 'Titular',
  CONTRACT: 'Contrato',
  ALERT: 'Alerta',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PENDING: 'Pendiente',
  APPLIED: 'Solicitada',
  PUBLISHED: 'Publicada',
  REGISTERED: 'Registrada',
  RENEWED: 'Renovada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  OPPOSED: 'Opuesta',
  IN_LITIGATION: 'En litigio',
  DRAFT: 'Borrador',
  TERMINATED: 'Terminado',
};

function detailHref(node: SelectedNode, tenantId: string): string | null {
  if (!node.entityId) return null;
  switch (node.type) {
    case 'BRAND':
      return `/tenants/${tenantId}/brands/${node.entityId}`;
    case 'HOLDER':
      return `/tenants/${tenantId}/holders/${node.entityId}`;
    case 'CONTRACT':
      return `/tenants/${tenantId}/contratos/${node.entityId}`;
    case 'HOLDING':
    case 'COMPANY':
      return `/tenants/${tenantId}/structure`;
    case 'ALERT':
      return `/tenants/${tenantId}/alerts`;
    default:
      return null;
  }
}

export function NodeDetailSheet({
  open,
  onOpenChange,
  node,
  tenantId,
}: NodeDetailSheetProps) {
  if (!node) return null;
  const href = detailHref(node, tenantId);
  const typeLabel = TYPE_LABELS[node.type] ?? node.type;
  const statusLabel = node.status
    ? (STATUS_LABELS[node.status] ?? node.status)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle>{node.label}</SheetTitle>
          <SheetDescription>{typeLabel}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 px-4 pb-4">
          {statusLabel && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Estado
              </p>
              <p className="mt-1 text-sm text-slate-800">{statusLabel}</p>
            </div>
          )}
          {node.metadata &&
            Object.entries(node.metadata).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {k}
                </p>
                <p className="mt-1 text-sm text-slate-800">{String(v)}</p>
              </div>
            ))}
          {href && (
            <Link
              href={href}
              className={buttonVariants({ variant: 'default', size: 'sm' })}
            >
              Ver detalle
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
