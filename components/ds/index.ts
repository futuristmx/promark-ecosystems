/**
 * Promark® Design System — componentes de dominio.
 *
 * Estos componentes son la capa propia del producto sobre shadcn/ui.
 * Para primitives generales (Button, Input, Select, etc.) sigue usando
 * @/components/ui/*. Para componentes de dominio Promark usa estos.
 */

export { PageTitle } from './page-title';
export { SectionHeader } from './section-header';
export { DsCard } from './card';
export { KpiCard, KpiGrid } from './kpi-card';
export { StatusBadge } from './status-badge';
export type { StatusTone } from './status-badge';
export { EmptyState } from './empty-state';
export { DsDataTable } from './data-table';
export type { DsColumn, DsRowAction } from './data-table';
export { DsTimeline } from './timeline';
export type { TimelineEvent } from './timeline';
export { DsNodeCard } from './node-card';
export type { NodeType } from './node-card';
export { DsWorkflowCanvas } from './workflow-canvas';
export { CsvToolbar } from './csv-toolbar';
export { ToastProvider, useToast } from './toast';
export { HelpTip } from './help-tip';
export {
  DsSkeleton,
  DsCardSkeleton,
  DsKpiSkeleton,
  DsKpiGridSkeleton,
  DsPageTitleSkeleton,
  DsTableRowSkeleton,
  DsTableSkeleton,
} from './skeleton';
