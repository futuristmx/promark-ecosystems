import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requirePromarkApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

interface BrandingPatch {
  primary_color?: string;
  company_display_name?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
}

interface NotificationsPatch {
  expiry_alert_days?: number;
  notify_email?: string | null;
}

interface PatchBody {
  config?: {
    branding?: BrandingPatch;
    notifications?: NotificationsPatch;
    features?: Record<string, boolean>;
  };
  name?: string;
}

/**
 * PATCH /api/tenants/[id]
 *
 * Actualiza el tenant. Antes de cada cambio crea un snapshot en
 * TenantVersion para auditoría y posible rollback.
 *
 * Solo SUPERADMIN puede modificar config y branding.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  const session = await requirePromarkApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo SUPERADMIN puede modificar tenants' }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { config: true, active_modules: true, name: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
  }

  const currentConfig = (tenant.config ?? {}) as Record<string, unknown>;
  const currentBranding = (currentConfig.branding ?? {}) as Record<string, unknown>;
  const currentNotifications = (currentConfig.notifications ?? {}) as Record<string, unknown>;
  const currentFeatures = (currentConfig.features ?? {}) as Record<string, unknown>;

  const nextBranding = body.config?.branding
    ? { ...currentBranding, ...body.config.branding }
    : currentBranding;
  const nextNotifications = body.config?.notifications
    ? { ...currentNotifications, ...body.config.notifications }
    : currentNotifications;
  const nextFeatures = body.config?.features
    ? { ...currentFeatures, ...body.config.features }
    : currentFeatures;

  const nextConfig = {
    ...currentConfig,
    branding: nextBranding,
    notifications: nextNotifications,
    features: nextFeatures,
  };

  const updated = await prisma.$transaction(async (tx) => {
    // Snapshot version actual ANTES de modificar
    const versionCount = await tx.tenantVersion.count({
      where: { tenant_id: tenantId },
    });
    await tx.tenantVersion.create({
      data: {
        tenant_id: tenantId,
        version_number: versionCount + 1,
        config_snapshot: currentConfig as object,
        modules_snapshot: (tenant.active_modules ?? {}) as object,
        status: 'DRAFT',
        pushed_at: new Date(),
        pushed_by: session.id,
      },
    });

    return tx.tenant.update({
      where: { id: tenantId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        config: nextConfig,
      },
      select: { id: true, name: true, slug: true, config: true },
    });
  });

  return NextResponse.json({ tenant: updated });
}
