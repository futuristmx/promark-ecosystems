import { DsKpiGridSkeleton, DsPageTitleSkeleton, DsSkeleton } from '@/components/ds';

export default function Loading() {
  return (
    <div className="space-y-6">
      <DsPageTitleSkeleton />
      <DsKpiGridSkeleton />
      <DsSkeleton className="h-80 rounded-2xl" />
    </div>
  );
}
