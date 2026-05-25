import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { ClientDocumentsView } from './client-documents-view';

interface Props {
  params: Promise<{ 'tenant-slug': string }>;
}

export default async function ClientDocumentsPage({ params }: Props) {
  const { 'tenant-slug': tenantSlug } = await params;
  await requireClientSession(tenantSlug);

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, config: true },
  });
  if (!tenant) notFound();
  const cfg = tenant.config as { features?: { show_documents?: boolean; allow_document_download?: boolean } } | null;
  if (!cfg?.features?.show_documents) notFound();

  return (
    <ClientDocumentsView
      tenantSlug={tenantSlug}
      allowDownload={cfg?.features?.allow_document_download === true}
    />
  );
}
