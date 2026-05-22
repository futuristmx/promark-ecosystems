import { requirePromarkAuth } from '@/lib/auth/promark';
import { ContractsListView } from './contracts-list-view';

interface Props {
  params: Promise<{ 'tenant-id': string }>;
}

export default async function ContractsPage({ params }: Props) {
  const session = await requirePromarkAuth();
  const { 'tenant-id': tenantId } = await params;
  return <ContractsListView tenantId={tenantId} userRole={session.role} />;
}
