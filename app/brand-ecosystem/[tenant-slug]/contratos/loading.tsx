import { DsPageTitleSkeleton, DsTableSkeleton } from '@/components/ds';

export default function Loading() {
  return (
    <div className="px-8 py-8 space-y-6">
      <DsPageTitleSkeleton />
      <DsTableSkeleton rows={6} cells={5} />
    </div>
  );
}
