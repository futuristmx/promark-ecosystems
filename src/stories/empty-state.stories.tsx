import { EmptyState } from '@/components/ds';
import { Building2, FileText, Bell } from 'lucide-react';

export default {
  title: 'Data / EmptyState',
};

export const WithIconAndAction = () => (
  <EmptyState
    icon={<Building2 className="size-6" />}
    title="No hay clientes registrados"
    description="Crea tu primer cliente para empezar a gestionar su cartera de marcas."
    action={
      <button className="ds-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium">
        + Crear cliente
      </button>
    }
  />
);

export const Documents = () => (
  <EmptyState
    icon={<FileText className="size-6" />}
    title="Sin documentos"
    description="Cuando subas contratos, certificados o comunicaciones, aparecerán aquí."
  />
);

export const NoAlerts = () => (
  <EmptyState
    icon={<Bell className="size-6" />}
    title="No tienes alertas activas"
    description="Todos los vencimientos están bajo control."
  />
);

export const Inline = () => (
  <div className="rounded-2xl border border-slate-200/60 bg-white">
    <EmptyState
      variant="inline"
      title="Sin resultados"
      description="Ajusta los filtros para ver más."
    />
  </div>
);
