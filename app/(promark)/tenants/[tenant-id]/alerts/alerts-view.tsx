'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, X, Bell, Settings } from 'lucide-react';
import { useToast } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

interface SerializedAlert {
  id: string;
  tenant_id: string;
  alert_rule_id: string | null;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  alert_type: string;
  trigger_days: number | null;
  expiry_date: string;
  status: string;
  sent_at: string | null;
  dismissed_at: string | null;
  dismissed_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

interface AlertRule {
  id: string;
  name: string;
  entity_type: string;
  trigger_days: number;
  is_active: boolean;
  notify_email: boolean;
  notify_in_app: boolean;
}

interface AlertsViewProps {
  tenantId: string;
  initialAlerts: SerializedAlert[];
  rules: AlertRule[];
  countByStatus: Record<string, number>;
  role: string;
  canResolve: boolean;
}

const URGENCY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  EXPIRED: 'destructive',
  EXPIRY_WARNING: 'outline',
  DOCUMENT_EXPIRY: 'outline',
};

function daysDelta(expiry: string): number {
  return Math.ceil(
    (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function urgencyLabel(alert: SerializedAlert): string {
  const days = daysDelta(alert.expiry_date);
  if (days < 0) return `Vencido hace ${Math.abs(days)} días`;
  if (days === 0) return 'Vence hoy';
  return `Vence en ${days} días`;
}

/* A5: agrupar alertas duplicadas por entity_id + alert_type
 * El backend genera múltiples alertas por la misma marca al disparar varias reglas.
 * Visualmente las consolidamos en una sola fila con badge ×N.
 */
type GroupedAlert = SerializedAlert & { count: number; groupedIds: string[] };

function groupAlerts(alerts: SerializedAlert[]): GroupedAlert[] {
  const map = new Map<string, GroupedAlert>();
  for (const a of alerts) {
    const key = `${a.entity_id}-${a.alert_type}-${a.status}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.groupedIds.push(a.id);
      if (new Date(a.expiry_date) < new Date(existing.expiry_date)) {
        existing.expiry_date = a.expiry_date;
      }
    } else {
      map.set(key, { ...a, count: 1, groupedIds: [a.id] });
    }
  }
  return Array.from(map.values());
}

export function AlertsView({
  tenantId,
  initialAlerts,
  rules: initialRules,
  countByStatus,
  role,
  canResolve,
}: AlertsViewProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [rules, setRules] = useState(initialRules);
  const toast = useToast();
  const [filter, setFilter] = useState<'PENDING' | 'DISMISSED' | 'RESOLVED' | 'ALL'>('PENDING');

  const filtered = groupAlerts(
    alerts.filter((a) => filter === 'ALL' || a.status === filter)
  );

  async function handleDismiss(alertId: string) {
    const res = await fetch(`/api/tenants/${tenantId}/alerts/${alertId}/dismiss`, {
      method: 'PUT',
    });
    if (res.ok) {
      const { alert } = await res.json();
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: alert.status,
                dismissed_at: alert.dismissed_at,
                dismissed_by: alert.dismissed_by,
              }
            : a
        )
      );
      toast.success('Alerta descartada', 'La alerta dejó de mostrarse como pendiente.');
    } else {
      toast.error('No se pudo descartar', 'Intenta de nuevo en unos segundos.');
    }
  }

  async function handleResolve(alertId: string) {
    const res = await fetch(`/api/tenants/${tenantId}/alerts/${alertId}/resolve`, {
      method: 'PUT',
    });
    if (res.ok) {
      const { alert } = await res.json();
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: alert.status,
                resolved_at: alert.resolved_at,
                resolved_by: alert.resolved_by,
              }
            : a
        )
      );
      toast.success('Alerta resuelta', 'Quedó registrada como atendida.');
    } else {
      toast.error('No se pudo resolver', 'Intenta de nuevo en unos segundos.');
    }
  }

  async function toggleRule(ruleId: string, isActive: boolean) {
    const res = await fetch(`/api/tenants/${tenantId}/alert-rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    if (res.ok) {
      const { rule } = await res.json();
      setRules((prev) => prev.map((r) => (r.id === ruleId ? rule : r)));
      toast.success(
        rule.is_active ? 'Regla activada' : 'Regla desactivada',
        `"${rule.name}" ${rule.is_active ? 'volverá a disparar alertas.' : 'ya no generará alertas nuevas.'}`
      );
    } else {
      toast.error('No se pudo actualizar la regla');
    }
  }

  const canModifyRules = role === 'SUPERADMIN';

  return (
    <div className="space-y-6">
      {/* Counts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <CountCard
          label="Pendientes"
          count={countByStatus.PENDING ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="red"
        />
        <CountCard
          label="Descartadas"
          count={countByStatus.DISMISSED ?? 0}
          icon={<X className="h-4 w-4" />}
          accent="amber"
        />
        <CountCard
          label="Resueltas"
          count={countByStatus.RESOLVED ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="green"
        />
        <CountCard
          label="Reglas activas"
          count={rules.filter((r) => r.is_active).length}
          icon={<Bell className="h-4 w-4" />}
          accent="blue"
        />
      </div>

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="h-3.5 w-3.5" />
            Reglas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Alertas</CardTitle>
                <div className="flex gap-1">
                  {(['PENDING', 'DISMISSED', 'RESOLVED', 'ALL'] as const).map((s) => {
                    const labels: Record<typeof s, string> = {
                      PENDING: 'Pendientes',
                      DISMISSED: 'Descartadas',
                      RESOLVED: 'Resueltas',
                      ALL: 'Todas',
                    };
                    return (
                      <Button
                        key={s}
                        size="sm"
                        variant={filter === s ? 'default' : 'outline'}
                        onClick={() => setFilter(s)}
                      >
                        {labels[s]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-600">
                    Sin alertas pendientes
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Todos los vencimientos están al día.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                    >
                      <Badge variant={URGENCY_VARIANT[alert.alert_type] ?? 'secondary'}>
                        {urgencyLabel(alert)}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {alert.entity_name}
                          </p>
                          {alert.count > 1 && (
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: 'rgba(15,46,61,0.08)', color: '#0F2E3D' }}
                              title={`${alert.count} alertas idénticas agrupadas`}
                            >
                              ×{alert.count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {alert.entity_type} · {alert.alert_type}
                        </p>
                      </div>
                      <Badge variant="outline">{
                        alert.status === 'PENDING' ? 'Pendiente'
                        : alert.status === 'DISMISSED' ? 'Descartado'
                        : alert.status === 'RESOLVED' ? 'Resuelto'
                        : alert.status === 'SENT' ? 'Enviado'
                        : alert.status
                      }</Badge>
                      {alert.status === 'PENDING' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismiss(alert.id)}
                          >
                            Descartar
                          </Button>
                          {canResolve && (
                            <Button
                              size="sm"
                              onClick={() => handleResolve(alert.id)}
                            >
                              Resolver
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Reglas de alerta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-xl border p-3"
                    style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#0F2E3D' }}>{rule.name}</p>
                      <p className="text-xs" style={{ color: '#355B6F' }}>
                        {rule.entity_type} ·{' '}
                        {rule.trigger_days === 0
                          ? 'al vencer'
                          : `${rule.trigger_days} días antes`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: rule.is_active ? '#2F6B4F' : '#C8C4B9' }}
                      >
                        {rule.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                      {canModifyRules && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={rule.is_active}
                          aria-label={`${rule.is_active ? 'Desactivar' : 'Activar'} regla ${rule.name}`}
                          onClick={() => toggleRule(rule.id, rule.is_active)}
                          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{
                            background: rule.is_active ? '#2F6B4F' : '#C8C4B9',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
                          }}
                        >
                          <span
                            className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
                            style={{
                              transform: rule.is_active ? 'translateX(22px)' : 'translateX(2px)',
                            }}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CountCard({
  label,
  count,
  icon,
  accent,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  accent: 'red' | 'amber' | 'green' | 'blue';
}) {
  const colors: Record<typeof accent, string> = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-emerald-600',
    blue: 'text-blue-600',
  };
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{count}</p>
        </div>
        <div className={colors[accent]}>{icon}</div>
      </CardContent>
    </Card>
  );
}
