import { PageTitle } from '@/components/ds';

export default {
  title: 'Headers / PageTitle',
};

export const Default = () => (
  <PageTitle
    title="Inteligencia marcaria"
    subtitle="Vista consolidada de todos los clientes."
  />
);

export const WithEyebrow = () => (
  <PageTitle
    eyebrow="Panel ejecutivo"
    title="Bienvenido, M. Cadena"
    subtitle="2 clientes activos · 13 marcas · 3 contratos"
  />
);

export const WithActions = () => (
  <PageTitle
    eyebrow="Workspace"
    title="Clientes"
    subtitle="Gestiona los tenants y sus configuraciones."
    actions={
      <>
        <button className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          ⌕ Buscar
        </button>
        <button className="ds-btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium">
          + Nuevo cliente
        </button>
      </>
    }
  />
);
