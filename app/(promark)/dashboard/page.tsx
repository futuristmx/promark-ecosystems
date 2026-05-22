import { requirePromarkAuth } from '@/lib/auth/promark';

const statCards = [
  { label: 'Total de Clientes', value: '--' },
  { label: 'Total de Marcas', value: '--' },
  { label: 'Usuarios Activos', value: '--' },
  { label: 'Documentos', value: '--' },
];

export default async function DashboardPage() {
  const session = await requirePromarkAuth();

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Bienvenido, {session.full_name}
        </h1>
        <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800">
          {session.role}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
