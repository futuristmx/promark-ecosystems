import type { Prisma, Alert } from '@prisma/client';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { ClientAlertsView } from './client-alerts-view';
import { ExportMenu } from '@/components/export-menu';

interface ClientAlertsPageProps {
  params: Promise<{ 'tenant-slug': string }>;
}

export default async function ClientAlertsPage({ params }: ClientAlertsPageProps) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientSession(tenantSlug);

  // CLIENT_VIEWER does not get alerts
  if (session.role === 'CLIENT_VIEWER') {
    return (
      <div className="px-8 py-12 text-center">
        <p className="text-sm" style={{ color: '#C8C4B9' }}>
          Su rol no tiene acceso al centro de alertas.
        </p>
      </div>
    );
  }

  // Configuración de alertas visibles al cliente (definida por SUPERADMIN
  // en /tenants/[id]/configuracion > Notificaciones).
  const tenantCfg = await prisma.tenant.findUnique({
    where: { id: session.tenant_id },
    select: { config: true },
  });
  const clientAlertsCfg = (tenantCfg?.config as {
    client_alerts?: {
      enabled?: boolean;
      general_comment?: string;
      types?: Record<string, { visible?: boolean; trigger_days?: number; comment?: string }>;
    };
  } | null)?.client_alerts ?? null;

  // Master OFF → no se muestra ninguna alerta
  if (clientAlertsCfg && clientAlertsCfg.enabled === false) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-sm font-medium" style={{ color: '#0F2E3D' }}>
          Las alertas no están habilitadas en tu portal.
        </p>
        <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
          Si necesitas activar este módulo, contacta a Promark.
        </p>
      </div>
    );
  }

  // Build query: LEGAL_REP only sees alerts for brands they're assigned to
  const where: Prisma.AlertWhereInput = {
    tenant_id: session.tenant_id,
  };

  if (session.role === 'CLIENT_LEGAL_REP') {
    const assignments = await prisma.userClientHolder.findMany({
      where: {
        user_client_id: session.user_id,
        tenant_id: session.tenant_id,
        removed_at: null,
      },
      select: { holder_id: true },
    });
    const holderIds = assignments.map((a) => a.holder_id);
    if (holderIds.length === 0) {
      where.entity_id = '__no_match__';
    } else {
      const brandHolders = await prisma.brandHolder.findMany({
        where: { holder_id: { in: holderIds } },
        select: { brand_id: true },
      });
      const brandIds = brandHolders.map((bh) => bh.brand_id);
      where.OR = [{ entity_type: 'BRAND', entity_id: { in: brandIds } }];
    }
  }

  const allAlerts = await prisma.alert.findMany({
    where,
    orderBy: [{ status: 'asc' }, { expiry_date: 'asc' }],
    take: 100,
  });

  // Filtrar por tipos visibles según config; si no hay config aún, deja
  // pasar todo (comportamiento previo). Si hay types definidos, sólo dejan
  // pasar los que tienen visible !== false.
  const typeCfg = clientAlertsCfg?.types ?? {};
  const hasTypeCfg = Object.keys(typeCfg).length > 0;
  const alerts = hasTypeCfg
    ? allAlerts.filter((a) => {
        const key = `${a.entity_type}.${a.alert_type}`;
        const t = typeCfg[key];
        return t?.visible !== false;
      })
    : allAlerts;

  // Comentario por tipo, embebido en cada alerta para que el view lo muestre.
  const generalComment = clientAlertsCfg?.general_comment?.trim() || null;

  return (
    <div className="px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--tenant-primary, #D39A2B)' }}>
            Centro de alertas
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: '#0F2E3D' }}>Alertas</h1>
          <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>
            Vigencias por vencer y eventos detectados en tu catálogo.
          </p>
        </div>
        <ExportMenu
          endpoint={`/api/client/${tenantSlug}/alerts/export`}
          hint="Exporta las alertas pendientes con plazo de vencimiento."
        />
      </div>

      {generalComment && (
        <div
          className="mb-6 rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: 'rgba(211,154,43,0.3)',
            background: 'rgba(211,154,43,0.06)',
            color: '#0F2E3D',
          }}
        >
          {generalComment}
        </div>
      )}

      <ClientAlertsView
        tenantId={session.tenant_id}
        alerts={alerts.map((a: Alert) => ({
          ...a,
          expiry_date: a.expiry_date.toISOString(),
          created_at: a.created_at.toISOString(),
          comment: typeCfg[`${a.entity_type}.${a.alert_type}`]?.comment ?? null,
        }))}
      />
    </div>
  );
}
