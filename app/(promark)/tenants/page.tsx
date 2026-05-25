import Link from 'next/link';
import { requirePromarkAuth } from '@/lib/auth/promark';
import prisma from '@/lib/prisma/client';
import { ChevronRight, Plus, Building2 } from 'lucide-react';
import { TENANT_STATUS_LABELS } from '@/lib/i18n/status-labels';
import { PageTitle, StatusBadge, EmptyState } from '@/components/ds';
import type { StatusTone } from '@/components/ds';

const STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  SUSPENDED: 'error',
  ONBOARDING: 'warning',
};

export default async function TenantsPage() {
  const user = await requirePromarkAuth();

  const tenants = await prisma.tenant.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      created_at: true,
    },
  });

  return (
    <div>
      <PageTitle
        eyebrow="Workspace"
        title="Clientes"
        subtitle="Gestiona los tenants y sus configuraciones."
        actions={
          user.role === 'SUPERADMIN' ? (
            <Link
              href="/tenants/new"
              className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <Plus className="size-4" />
              Nuevo cliente
            </Link>
          ) : null
        }
      />

      {tenants.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="No hay clientes registrados"
          description="Crea tu primer cliente para empezar a gestionar su cartera de marcas."
          action={
            user.role === 'SUPERADMIN' ? (
              <Link
                href="/tenants/new"
                className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
              >
                <Plus className="size-4" />
                Crear cliente
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="ds-card overflow-hidden p-0">
          <table className="min-w-full">
            <thead className="border-b border-slate-200/60 bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Creado
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40">
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="transition-colors hover:bg-white/60"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                    {tenant.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-500">
                    {tenant.slug}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge
                      tone={STATUS_TONE[tenant.status] ?? 'muted'}
                      label={
                        TENANT_STATUS_LABELS[tenant.status] ?? tenant.status
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {tenant.created_at.toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/tenants/${tenant.id}/structure`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#0066FF] transition-colors hover:underline"
                    >
                      Gestionar
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
