import { cn } from '@/lib/utils';

interface DsSkeletonProps {
  className?: string;
  /** When true, includes the shimmer animation. Default true. */
  shimmer?: boolean;
}

/**
 * DsSkeleton — placeholder primitivo del design system.
 *
 * Usa los tokens light v2: base `#F1EDE3` con shimmer `#E2DED6`.
 * Pensado para `loading.tsx` y suspense boundaries.
 */
export function DsSkeleton({ className, shimmer = true }: DsSkeletonProps) {
  return (
    <div
      className={cn('rounded-lg', shimmer && 'ds-skeleton-shimmer', className)}
      style={{
        background: shimmer
          ? 'linear-gradient(90deg, #F1EDE3 0%, #E2DED6 50%, #F1EDE3 100%)'
          : '#F1EDE3',
        backgroundSize: '200% 100%',
      }}
      aria-hidden="true"
    />
  );
}

/** Card skeleton genérico: header + 3 líneas. */
export function DsCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5',
        className
      )}
      style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
    >
      <div className="flex items-center gap-3">
        <DsSkeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <DsSkeleton className="h-3 w-2/3" />
          <DsSkeleton className="h-2.5 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <DsSkeleton className="h-2.5 w-full" />
        <DsSkeleton className="h-2.5 w-4/5" />
        <DsSkeleton className="h-2.5 w-3/5" />
      </div>
    </div>
  );
}

/** KPI skeleton — réplica del shape de KpiCard. */
export function DsKpiSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex overflow-hidden rounded-xl', className)}
      style={{ background: '#F1EDE3' }}
    >
      <div className="w-1 shrink-0" style={{ background: '#E2DED6' }} />
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <DsSkeleton className="h-2.5 w-24" />
          <DsSkeleton className="h-8 w-8 rounded-lg" />
        </div>
        <DsSkeleton className="mt-5 h-10 w-16" />
        <DsSkeleton className="mt-2 h-2.5 w-20" />
      </div>
    </div>
  );
}

/** Grid de 4 KPI skeletons. */
export function DsKpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <DsKpiSkeleton key={i} />
      ))}
    </div>
  );
}

/** Page title skeleton. */
export function DsPageTitleSkeleton() {
  return (
    <div className="space-y-2">
      <DsSkeleton className="h-3 w-20" />
      <DsSkeleton className="h-8 w-72" />
      <DsSkeleton className="h-3 w-96" />
    </div>
  );
}

/** Skeleton de fila de tabla. */
export function DsTableRowSkeleton({ cells = 4 }: { cells?: number }) {
  return (
    <div
      className="flex items-center gap-4 border-b px-4 py-3"
      style={{ borderColor: '#E2DED6' }}
    >
      <DsSkeleton className="h-8 w-8 rounded" />
      {Array.from({ length: cells - 1 }).map((_, i) => (
        <DsSkeleton key={i} className="h-3 flex-1" />
      ))}
    </div>
  );
}

/** Tabla completa de skeleton. */
export function DsTableSkeleton({ rows = 5, cells = 4 }: { rows?: number; cells?: number }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
    >
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
      >
        <DsSkeleton className="h-3 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <DsTableRowSkeleton key={i} cells={cells} />
      ))}
    </div>
  );
}
