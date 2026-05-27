import { DsKpiGridSkeleton, DsPageTitleSkeleton, DsSkeleton } from '@/components/ds';

export default function Loading() {
  return (
    <div className="space-y-12">
      <div className="flex items-center gap-5">
        <DsSkeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1">
          <DsPageTitleSkeleton />
        </div>
        <DsSkeleton className="h-10 w-32 rounded-xl" />
      </div>

      <DsKpiGridSkeleton />

      <DsSkeleton className="h-80 rounded-2xl" />
      <DsSkeleton className="h-80 rounded-2xl" />
      <DsSkeleton className="h-64 rounded-2xl" />
    </div>
  );
}
