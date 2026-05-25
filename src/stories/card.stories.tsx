import { DsCard } from '@/components/ds';

export default {
  title: 'Cards / DsCard',
};

export const Standard = () => (
  <DsCard variant="standard" className="max-w-md">
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
      Card estándar
    </p>
    <h3 className="mt-2 text-lg font-semibold text-slate-900">NortePremium</h3>
    <p className="mt-1 text-sm text-slate-500">
      Logística Norte Express · Vence en 7 días
    </p>
  </DsCard>
);

export const Premium = () => (
  <DsCard variant="premium" className="max-w-md">
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0066FF]">
      Card premium
    </p>
    <h3 className="mt-2 text-lg font-semibold text-slate-900">
      Vencimiento crítico
    </h3>
    <p className="mt-1 text-sm text-slate-500">
      3 marcas vencen en menos de 30 días. Revisa la cartera de renovación.
    </p>
    <button className="ds-btn-primary mt-4 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium">
      Revisar ahora →
    </button>
  </DsCard>
);

export const Atmospheric = () => (
  <DsCard variant="atmospheric" className="max-w-md">
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DB2777]">
      Card atmospheric · AI
    </p>
    <h3 className="mt-2 text-lg font-semibold text-slate-900">
      Sugerencias del agente
    </h3>
    <p className="mt-1 text-sm text-slate-500">
      Detecté 2 oportunidades de licenciamiento cruzado entre tus tenants.
    </p>
    <button className="ds-btn-primary mt-4 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium">
      Generar análisis
    </button>
  </DsCard>
);

export const AllVariants = () => (
  <div className="grid gap-4 md:grid-cols-3">
    <DsCard variant="standard">
      <p className="ds-label-uc">Standard</p>
      <h3 className="mt-2 text-base font-semibold">Contenido normal</h3>
    </DsCard>
    <DsCard variant="premium">
      <p className="ds-label-uc">Premium</p>
      <h3 className="mt-2 text-base font-semibold">Insight clave</h3>
    </DsCard>
    <DsCard variant="atmospheric">
      <p className="ds-label-uc">Atmospheric</p>
      <h3 className="mt-2 text-base font-semibold">Módulo AI</h3>
    </DsCard>
  </div>
);
