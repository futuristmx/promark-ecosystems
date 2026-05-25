import { StatusBadge } from '@/components/ds';

export default {
  title: 'Data / StatusBadge',
};

export const AllTones = () => (
  <div className="flex flex-wrap gap-3">
    <StatusBadge tone="active" label="Activa" />
    <StatusBadge tone="progress" label="En proceso" />
    <StatusBadge tone="success" label="Renovada" />
    <StatusBadge tone="warning" label="Por vencer" />
    <StatusBadge tone="error" label="Expirada" />
    <StatusBadge tone="info" label="Solicitada" />
    <StatusBadge tone="muted" label="Borrador" />
  </div>
);

export const WithoutDot = () => (
  <div className="flex flex-wrap gap-3">
    <StatusBadge tone="active" label="Activa" withDot={false} />
    <StatusBadge tone="success" label="Renovada" withDot={false} />
    <StatusBadge tone="warning" label="Por vencer" withDot={false} />
    <StatusBadge tone="error" label="Expirada" withDot={false} />
  </div>
);

export const Inline = () => (
  <p className="text-sm text-slate-700">
    La marca <strong>NortePremium</strong>{' '}
    <StatusBadge tone="error" label="Expirada" /> requiere atención inmediata.
  </p>
);
