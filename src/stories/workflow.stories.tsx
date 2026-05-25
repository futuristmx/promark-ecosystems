import { DsNodeCard, DsWorkflowCanvas, StatusBadge } from '@/components/ds';
import { Database, Cpu, Bell } from 'lucide-react';

export default {
  title: 'Canvas / Workflow',
};

export const SingleNode = () => (
  <div className="grid grid-cols-3 gap-4">
    <DsNodeCard
      type="input"
      title="Catálogo de marcas"
      subtitle="Source: Supabase"
      meta="13 registros · 2 tenants"
      icon={<Database className="size-4" />}
    />
    <DsNodeCard
      type="process"
      title="Detector de vigencia"
      subtitle="Cron diario"
      meta="20 reglas configuradas"
      icon={<Cpu className="size-4" />}
      status={<StatusBadge tone="success" label="OK" withDot />}
    />
    <DsNodeCard
      type="output"
      title="4 alertas activas"
      subtitle="2 críticas · 2 informativas"
      icon={<Bell className="size-4" />}
      status={<StatusBadge tone="warning" label="Atención" />}
    />
  </div>
);

export const HorizontalFlow = () => (
  <DsWorkflowCanvas
    title="Pipeline de detección de vencimientos"
    description="Estructura del flujo automatizado del cron /api/cron/check-alerts"
  >
    <DsNodeCard
      type="input"
      title="Catálogo"
      subtitle="brands + contracts + documents"
      meta="13 + 3 + N items"
      icon={<Database className="size-4" />}
    />
    <DsNodeCard
      type="process"
      title="Detector"
      subtitle="20 AlertRule rows"
      meta="Cron diario 14:00 UTC"
      icon={<Cpu className="size-4" />}
    />
    <DsNodeCard
      type="output"
      title="Alertas"
      subtitle="PENDING + email Resend"
      meta="4 activas"
      icon={<Bell className="size-4" />}
    />
  </DsWorkflowCanvas>
);

export const VerticalFlow = () => (
  <DsWorkflowCanvas
    title="Flujo de aprobación de contratos"
    variant="vertical"
  >
    <DsNodeCard type="input" title="Borrador" subtitle="LAWYER crea" />
    <DsNodeCard type="process" title="Revisión legal" subtitle="SUPERADMIN" />
    <DsNodeCard type="process" title="Cliente firma" subtitle="CLIENT_ADMIN" />
    <DsNodeCard type="output" title="Activo" subtitle="Disponible en portal" />
  </DsWorkflowCanvas>
);

export const SelectedState = () => (
  <DsNodeCard
    type="process"
    title="Nodo seleccionado"
    subtitle="Click para deseleccionar"
    selected
    icon={<Cpu className="size-4" />}
  />
);
