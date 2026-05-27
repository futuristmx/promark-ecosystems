import { DsCardSkeleton, DsPageTitleSkeleton, DsSkeleton } from '@/components/ds';

export default function Loading() {
  return (
    <div className="px-8 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <DsPageTitleSkeleton />
        <DsSkeleton className="h-10 w-32 rounded-lg" />
      </div>
      <DsSkeleton className="h-12 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <DsCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
