import { KpiCard, KpiGrid } from '@/components/ds';
import { Tag, Clock, AlertTriangle, Scroll, Bell } from 'lucide-react';

export default {
  title: 'Data / KpiCard + KpiGrid',
};

export const SingleCard = () => (
  <div className="max-w-xs">
    <KpiCard
      label="Total marcas"
      value={13}
      delta={{ text: '+2 este mes', tone: 'positive' }}
      icon={<Tag className="size-4" />}
    />
  </div>
);

export const ToneVariants = () => (
  <div className="grid grid-cols-4 gap-4">
    <KpiCard label="Default" value={13} icon={<Tag className="size-4" />} />
    <KpiCard label="Warning" value={2} tone="warning" icon={<Clock className="size-4" />} />
    <KpiCard label="Danger" value={1} tone="danger" icon={<AlertTriangle className="size-4" />} />
    <KpiCard label="Success" value={3} tone="success" icon={<Scroll className="size-4" />} />
  </div>
);

export const FullGrid = () => (
  <KpiGrid>
    <KpiCard
      label="Total marcas"
      value={13}
      icon={<Tag className="size-4" />}
      delta={{ text: '+2 este mes', tone: 'positive' }}
    />
    <KpiCard
      label="Por vencer (90d)"
      value={2}
      tone="warning"
      icon={<Clock className="size-4" />}
    />
    <KpiCard
      label="Vencidas"
      value={1}
      tone="danger"
      icon={<AlertTriangle className="size-4" />}
    />
    <KpiCard
      label="Contratos vigentes"
      value={3}
      icon={<Scroll className="size-4" />}
    />
    <KpiCard
      label="Alertas próximas"
      value={4}
      tone="danger"
      icon={<Bell className="size-4" />}
      delta={{ text: '2 críticas', tone: 'negative' }}
    />
  </KpiGrid>
);
