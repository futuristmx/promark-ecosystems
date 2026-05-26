import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import prisma from '@/lib/prisma/client';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { PageTitle } from '@/components/ds';
import { TenantConfigTabs } from './config-tabs';

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

  // Fetch client users for credentials tab
  const clientUsers = await prisma.userClient.findMany({
    where: { tenant_id: tenantId },
    select: {
      id: true,
      full_name: true,
      email: true,
      card_id: true,
      role: true,
      status: true,
      pin_generated_at: true,
    },
    orderBy: { role: 'asc' },
  });

  const cfg = (tenant.config ?? {}) as TenantConfig;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/tenants/${tenantId}/panel`}
          className="mb-3 inline-flex items-center gap-1 text-sm transition-colors"
          style={{ color: '#355B6F' }}
        >
          <ChevronLeft className="size-4" />
          Volver al panel
        </Link>

        <PageTitle
          eyebrow="Cliente"
          title="Configuración"
          subtitle={`Personalización del portal de ${tenant.name}. Cada cambio se guarda como nueva versión (actual: v${versionCount + 1}).`}
        />
      </div>

      <TenantConfigTabs
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
        clientUsers={clientUsers.map((u) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          card_id: u.card_id,
          role: u.role,
          status: u.status,
          pin_generated_at: u.pin_generated_at?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
