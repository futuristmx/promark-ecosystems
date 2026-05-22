import { requirePromarkAuth } from '@/lib/auth/promark';
import { LicensesListView } from './licenses-list-view';

interface Props {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function LicensesPage({ params }: Props) {
  const session = await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;
  return <LicensesListView tenantId={tenantId} userRole={session.role} />;
}
