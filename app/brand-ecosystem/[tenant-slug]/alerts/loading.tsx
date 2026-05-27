import { DsPageTitleSkeleton, DsSkeleton } from '@/components/ds';

export default function Loading() {
  return (
    <div className="px-8 py-8 space-y-6">
      <DsPageTitleSkeleton />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <DsSkeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
