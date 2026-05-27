import {
  DsKpiGridSkeleton,
  DsPageTitleSkeleton,
  DsSkeleton,
} from '@/components/ds';

export default function Loading() {
  return (
    <div className="px-8 py-8 space-y-8">
      <DsPageTitleSkeleton />
      <DsKpiGridSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DsSkeleton className="h-72 rounded-2xl" />
        <DsSkeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
