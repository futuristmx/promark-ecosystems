import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { type Alert } from '@prisma/client';
import { Mail, MailX, Eye, EyeOff, Settings } from 'lucide-react';
import { requirePromarkAuth } from '@/lib/auth/promark';
import { Breadcrumb } from '@/components/breadcrumb';
import { PageTitle, HelpTip } from '@/components/ds';
import { AlertsView } from './alerts-view';

interface AlertsPageProps {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function AlertsPage({ params }: AlertsPageProps) {
  const session = await requirePromarkAuth();
  const { assertPromarkPermission } = await import('@/lib/auth/promark-permissions');
  await assertPromarkPermission(session.role, 'view_alerts');
  const { 'tenant-id': tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, config: true },
  });
  if (!tenant) notFound();

  // Extraer estado de notificaciones para mostrar el contexto:
  // ¿quién recibe estas alertas hoy?
  const cfg = (tenant.config ?? {}) as {
    notifications?: { email_alerts_enabled?: boolean; notify_email?: string | null };
    client_alerts?: { enabled?: boolean };
  };
  const emailEnabled = cfg.notifications?.email_alerts_enabled === true;
  const emailRecipient = emailEnabled ? cfg.notifications?.notify_email ?? null : null;
  // client_alerts.enabled es undefined cuando nunca se configuró → tratamos
  // como enabled (default true) para preservar el comportamiento previo.
  const clientPortalEnabled = cfg.client_alerts?.enabled !== false;

  const [alerts, rules, counts] = await Promise.all([
    prisma.alert.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ status: 'asc' }, { expiry_date: 'asc' }],
      take: 100,
    }),
    prisma.alertRule.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ entity_type: 'asc' }, { trigger_days: 'desc' }],
    }),
    prisma.alert.groupBy({
      by: ['status'],
      where: { tenant_id: tenantId },
      _count: true,
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c: { status: string; _count: number }) => [c.status, c._count])
  ) as Record<string, number>;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/tenants' },
          { label: tenant.name, href: `/tenants/${tenantId}/structure` },
          { label: 'Alertas' },
        ]}
      />

      <div className="flex items-center gap-2">
        <PageTitle
          eyebrow="Cliente"
          title="Centro de Alertas"
          subtitle="Vigencias, vencimientos y eventos detectados automáticamente."
        />
        <HelpTip>
          Las reglas generan alertas internas siempre. Si envías correos y/o
          las muestras al cliente se configura en Notificaciones del cliente.
        </HelpTip>
      </div>

      {/* Contexto: a quién llegan estas alertas hoy. Tono azul hielo
        sutil para diferenciarse de los cards marfil/hueso del resto. */}
      <div
        className="mt-6 rounded-2xl border p-5"
        style={{
          borderColor: 'rgba(143,182,199,0.45)',
          background: 'linear-gradient(135deg, #DDEAF2 0%, #EFF4F8 100%)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: '#1C3F55' }}
            >
              ¿Quién ve estas alertas?
            </p>
            <p className="mt-1 text-sm" style={{ color: '#0F2E3D' }}>
              Las reglas de abajo <strong>siempre</strong> generan alertas en la
              base de datos del staff Promark. La distribución externa depende
              de la configuración del cliente.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {/* Email interno */}
              <div
                className="flex items-start gap-3 rounded-xl border p-3"
                style={{ borderColor: 'rgba(143,182,199,0.35)', background: 'rgba(255,255,255,0.55)' }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: emailEnabled
                      ? 'rgba(47,107,79,0.1)'
                      : 'rgba(200,196,185,0.3)',
                    color: emailEnabled ? '#2F6B4F' : '#C8C4B9',
                  }}
                >
                  {emailEnabled ? <Mail className="size-4" /> : <MailX className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: '#0F2E3D' }}>
                    Correos a Promark
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: '#355B6F' }}>
                    {emailEnabled && emailRecipient ? (
                      <>Se envían a <strong style={{ color: '#0F2E3D' }}>{emailRecipient}</strong></>
                    ) : emailEnabled ? (
                      'Encendido sin destinatario configurado.'
                    ) : (
                      'Apagado. No se envían correos por estas alertas.'
                    )}
                  </p>
                </div>
              </div>

              {/* Portal cliente */}
              <div
                className="flex items-start gap-3 rounded-xl border p-3"
                style={{ borderColor: 'rgba(143,182,199,0.35)', background: 'rgba(255,255,255,0.55)' }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: clientPortalEnabled
                      ? 'rgba(47,107,79,0.1)'
                      : 'rgba(200,196,185,0.3)',
                    color: clientPortalEnabled ? '#2F6B4F' : '#C8C4B9',
                  }}
                >
                  {clientPortalEnabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: '#0F2E3D' }}>
                    Visibles en portal del cliente
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: '#355B6F' }}>
                    {clientPortalEnabled
                      ? 'El cliente las ve en su portal según los tipos habilitados.'
                      : 'El módulo Alertas está oculto del portal del cliente.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/tenants/${tenantId}/configuracion?tab=notifications`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
            style={{
              borderColor: 'rgba(143,182,199,0.5)',
              color: '#0F2E3D',
              background: 'rgba(255,255,255,0.55)',
            }}
          >
            <Settings className="size-3.5" />
            Configurar
          </Link>
        </div>
      </div>

      <div className="mt-8">
      <AlertsView
        tenantId={tenantId}
        initialAlerts={alerts.map((a: Alert) => ({
          ...a,
          expiry_date: a.expiry_date.toISOString(),
          sent_at: a.sent_at?.toISOString() ?? null,
          dismissed_at: a.dismissed_at?.toISOString() ?? null,
          resolved_at: a.resolved_at?.toISOString() ?? null,
          created_at: a.created_at.toISOString(),
        }))}
        rules={rules}
        countByStatus={countByStatus}
        role={session.role}
        canResolve={true}
      />
      </div>
    </div>
  );
}
