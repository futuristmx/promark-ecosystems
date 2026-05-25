export default {
  title: 'Overview',
};

export const Intro = () => (
  <div className="max-w-3xl">
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0066FF]">
      Promark® Design System
    </p>
    <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
      Componentes y tokens
    </h1>
    <p className="mb-6 text-sm text-slate-500">
      Esta es la documentación viva del design system. Navega los componentes
      en la sidebar para ver variantes, props y ejemplos en contexto.
    </p>

    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200/60 bg-[#EDEFF3] p-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Tipografía
        </p>
        <p className="text-sm text-slate-700">
          DM Sans (primaria) → Open Sans (fallback) → Manrope (terciario).
          Cargadas vía <code className="rounded bg-white px-1.5 py-0.5 text-xs">next/font/google</code>{' '}
          en producción, self-hosted, con preload automático.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200/60 bg-[#EDEFF3] p-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Paleta
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {[
            { name: '--bg-app', hex: '#FAFBFC' },
            { name: '--bg-card', hex: '#EDEFF3' },
            { name: '--accent-blue', hex: '#2C3445' },
            { name: '--accent-electric', hex: '#0066FF' },
            { name: '--text-header', hex: '#0A0E15' },
          ].map((c) => (
            <div key={c.name} className="rounded-lg border border-slate-200/60 bg-white p-2">
              <div
                className="h-10 w-full rounded-md border border-slate-200/60"
                style={{ background: c.hex }}
              />
              <p className="mt-2 font-mono text-[10px] font-medium text-slate-700">
                {c.name}
              </p>
              <p className="font-mono text-[10px] text-slate-400">{c.hex}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/60 bg-[#EDEFF3] p-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Reglas de uso
        </p>
        <ul className="ml-4 mt-2 list-disc space-y-1 text-sm text-slate-700">
          <li>No hardcodees hex. Usa CSS vars (<code>var(--ds-accent-electric)</code>).</li>
          <li>Usa <code>&lt;PageTitle&gt;</code> y <code>&lt;SectionHeader&gt;</code> siempre.</li>
          <li>
            Prefiere <code>&lt;DsCard&gt;</code> sobre <code>&lt;Card&gt;</code> para componentes
            nuevos.
          </li>
          <li>
            Status semántico siempre via <code>&lt;StatusBadge&gt;</code>, no{' '}
            <code>&lt;Badge&gt;</code>.
          </li>
        </ul>
      </section>

      <p className="text-xs text-slate-400">
        Docs completos en <code>design-system/README.md</code>. Stories en{' '}
        <code>src/stories/*.stories.tsx</code>. Ejecutar con{' '}
        <code className="rounded bg-white px-1.5 py-0.5">npm run ds:dev</code>.
      </p>
    </div>
  </div>
);
Intro.storyName = 'Intro';
