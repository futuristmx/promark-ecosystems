import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { PageTitle } from '@/components/ds';
import { BrandingEditor } from './branding-editor';

interface Props {
  params: Promise<{ 'tenant-id': string }>;
}

interface TenantConfig {
  branding?: {
    primary_color?: string;
    company_display_name?: string;
    logo_url?: string | null;
    favicon_url?: string | null;
  };
  notifications?: {
    notify_email?: string | null;
    expiry_alert_days?: number;
  };
}

export default async function TenantConfigPage({ params }: Props) {
  const user = await requirePromarkAuth();
  if (user.role !== 'SUPERADMIN') {
    redirect('/tenants');
  }
  const { 'tenant-id': tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      config: true,
    },
  });
  if (!tenant) notFound();

  const versionCount = await prisma.tenantVersion.count({
    where: { tenant_id: tenantId },
  });

  const cfg = (tenant.config ?? {}) as TenantConfig;

  return (
    <div>
      <Link
        href={`/tenants/${tenantId}/panel`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="size-4" />
        Volver al panel
      </Link>

      <PageTitle
        eyebrow="Cliente"
        title="Configuración"
        subtitle={`Personalización del portal de ${tenant.name}. Cada cambio se guarda como nueva versión (actual: v${versionCount + 1}).`}
      />

      <BrandingEditor
        tenantId={tenantId}
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        initialBranding={{
          primary_color: cfg.branding?.primary_color ?? '#3E6AE1',
          company_display_name: cfg.branding?.company_display_name ?? tenant.name,
          logo_url: cfg.branding?.logo_url ?? null,
          favicon_url: cfg.branding?.favicon_url ?? null,
        }}
        initialNotifications={{
          notify_email: cfg.notifications?.notify_email ?? '',
          expiry_alert_days: cfg.notifications?.expiry_alert_days ?? 90,
        }}
      />
    </div>
  );
}
