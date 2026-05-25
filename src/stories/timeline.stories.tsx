import { DsTimeline } from '@/components/ds';
import type { TimelineEvent } from '@/components/ds';

export default {
  title: 'Data / DsTimeline',
};

const now = Date.now();

const events: TimelineEvent[] = [
  {
    id: '1',
    timestamp: new Date(now - 5 * 60_000).toISOString(),
    title: 'Marca registrada',
    description: 'Aprobación final de NortePremium ante IMPI.',
    actor: 'M. Cadena',
    category: 'Marca',
    tone: 'success',
    href: '#',
  },
  {
    id: '2',
    timestamp: new Date(now - 2 * 3600_000).toISOString(),
    title: 'Contrato actualizado',
    description: 'Cambio de cláusula de exclusividad territorial.',
    actor: 'Sistema',
    category: 'Contrato',
    tone: 'active',
  },
  {
    id: '3',
    timestamp: new Date(now - 24 * 3600_000).toISOString(),
    title: 'Alerta detectada',
    description: 'NortePremium vence en menos de 30 días.',
    actor: 'Detector automático',
    category: 'Alerta',
    tone: 'warning',
  },
  {
    id: '4',
    timestamp: new Date(now - 3 * 24 * 3600_000).toISOString(),
    title: 'Documento adjuntado',
    description: 'Certificado de registro IMPI.pdf agregado a NortExpress.',
    actor: 'M. Cadena',
    category: 'Documento',
    tone: 'info',
  },
  {
    id: '5',
    timestamp: new Date(now - 14 * 24 * 3600_000).toISOString(),
    title: 'Marca expirada',
    description: 'ArcticPack venció sin renovación.',
    actor: 'Sistema',
    category: 'Marca',
    tone: 'error',
  },
];

export const Default = () => (
  <div className="max-w-2xl">
    <DsTimeline events={events} />
  </div>
);

export const Empty = () => (
  <div className="max-w-2xl">
    <DsTimeline events={[]} emptyMessage="Sin actividad en este rango." />
  </div>
);

export const Loading = () => (
  <div className="max-w-2xl">
    <DsTimeline events={[]} loading />
  </div>
);
