'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ClientAlert {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  alert_type: string;
  expiry_date: string;
  status: string;
}

interface ClientAlertsViewProps {
  tenantId: string;
  alerts: ClientAlert[];
}

function daysDelta(expiry: string): number {
  return Math.ceil(
    (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function urgency(days: number): { label: string; variant: 'destructive' | 'outline' | 'secondary' } {
  if (days < 0) return { label: `Vencido hace ${Math.abs(days)} días`, variant: 'destructive' };
  if (days === 0) return { label: 'Vence hoy', variant: 'destructive' };
  if (days <= 30) return { label: `Vence en ${days} días`, variant: 'destructive' };
  if (days <= 90) return { label: `Vence en ${days} días`, variant: 'outline' };
  return { label: `Vence en ${days} días`, variant: 'secondary' };
}

export function ClientAlertsView({ tenantId, alerts: initial }: ClientAlertsViewProps) {
  const [alerts, setAlerts] = useState(initial);

  async function handleDismiss(alertId: string) {
    const res = await fetch(`/api/tenants/${tenantId}/alerts/${alertId}/dismiss`, {
      method: 'PUT',
    });
    if (res.ok) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'DISMISSED' } : a))
      );
    }
  }

  const pending = alerts.filter((a) => a.status === 'PENDING');
  const other = alerts.filter((a) => a.status !== 'PENDING');

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            No tienes alertas activas en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-4">
            {pending.map((alert) => {
              const days = daysDelta(alert.expiry_date);
              const u = urgency(days);
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <Badge variant={u.variant}>{u.label}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {alert.entity_name}
                    </p>
                    <p className="text-xs text-slate-500">{alert.entity_type}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDismiss(alert.id)}
                  >
                    Descartar
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {other.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              Alertas pasadas
            </p>
            {other.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
              >
                <Badge variant="outline">{
                  alert.status === 'DISMISSED' ? 'Descartado'
                  : alert.status === 'RESOLVED' ? 'Resuelto'
                  : alert.status === 'SENT' ? 'Enviado'
                  : alert.status === 'PENDING' ? 'Pendiente'
                  : alert.status
                }</Badge>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">{alert.entity_name}</p>
                  <p className="text-xs text-slate-500">{alert.entity_type}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
