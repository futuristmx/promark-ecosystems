import { redirect } from 'next/navigation';

export default async function PortalPage({
  params,
}: {
  params: Promise<{ 'tenant-slug': string }>;
}) {
  const { 'tenant-slug': tenantSlug } = await params;
  redirect(`/brand-ecosystem/${tenantSlug}/brands`);
}
