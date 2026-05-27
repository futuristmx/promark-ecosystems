import { DsPageTitleSkeleton, DsSkeleton } from '@/components/ds';

export default function Loading() {
  return (
    <div className="space-y-6">
      <DsPageTitleSkeleton />
      <DsSkeleton className="h-24 rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <DsSkeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
