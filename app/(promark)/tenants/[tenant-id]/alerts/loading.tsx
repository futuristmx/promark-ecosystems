import { DsPageTitleSkeleton, DsSkeleton } from '@/components/ds';

export default function Loading() {
  return (
    <div className="space-y-6">
      <DsPageTitleSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <DsSkeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <DsSkeleton className="h-10 w-72 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <DsSkeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
