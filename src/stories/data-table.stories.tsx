import { DsDataTable, StatusBadge } from '@/components/ds';
import type { DsColumn } from '@/components/ds';
import { Tag } from 'lucide-react';

export default {
  title: 'Data / DsDataTable',
};

interface Brand {
  id: string;
  name: string;
  company: string;
  status: string;
  registration: string;
  expiration: string;
}

const brands: Brand[] = [
  { id: '1', name: 'ArcticPack', company: 'Distribuidora Norte', status: 'RENEWED', registration: 'MX-N0004', expiration: '1 ene 2029' },
  { id: '2', name: 'NorthFresh', company: 'Logística Norte Express', status: 'WARNING', registration: 'MX-N0006', expiration: '6 jul 2026' },
  { id: '3', name: 'NortePremium', company: 'Logística Norte Express', status: 'EXPIRED', registration: 'MX-N0008', expiration: '7 abr 2026' },
  { id: '4', name: 'NorteRural', company: 'Logística Norte Express', status: 'ACTIVE', registration: 'MX-N0007', expiration: '6 jun 2026' },
];

const columns: DsColumn<Brand>[] = [
  { key: 'name', header: 'Marca', sortable: true, cell: (r) => <strong className="text-slate-900">{r.name}</strong> },
  { key: 'company', header: 'Empresa', sortable: true },
  {
    key: 'status',
    header: 'Estado',
    cell: (r) => {
      const tone =
        r.status === 'RENEWED' || r.status === 'ACTIVE' ? 'success' :
        r.status === 'WARNING' ? 'warning' :
        r.status === 'EXPIRED' ? 'error' : 'muted';
      const label =
        r.status === 'RENEWED' ? 'Renovada' :
        r.status === 'ACTIVE' ? 'Activa' :
        r.status === 'WARNING' ? 'Por vencer' :
        r.status === 'EXPIRED' ? 'Expirada' : r.status;
      return <StatusBadge tone={tone} label={label} />;
    },
  },
  { key: 'registration', header: 'No. Registro' },
  { key: 'expiration', header: 'Vencimiento', sortable: true },
];

export const Default = () => (
  <DsDataTable
    columns={columns}
    rows={brands}
    getRowId={(r) => r.id}
  />
);

export const WithRowActions = () => (
  <DsDataTable
    columns={columns}
    rows={brands}
    getRowId={(r) => r.id}
    rowActions={[
      { label: 'Ver detalle', href: (r) => `/brands/${r.id}` },
      { label: 'Editar', onClick: (r) => alert(`Editar ${r.name}`) },
      { label: 'Eliminar', destructive: true, onClick: () => {} },
    ]}
  />
);

export const Loading = () => (
  <DsDataTable
    columns={columns}
    rows={[]}
    getRowId={(r) => r.id}
    loading
  />
);

export const Empty = () => (
  <DsDataTable
    columns={columns}
    rows={[]}
    getRowId={(r) => r.id}
    empty={{
      icon: <Tag className="size-6" />,
      title: 'No hay marcas registradas',
      description: 'Crea la primera marca para empezar a gestionar la cartera.',
    }}
  />
);
