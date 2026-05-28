import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { ContactView } from './contact-view';

interface Props {
  params: Promise<{ 'tenant-slug': string }>;
}

export default async function ContactoPage({ params }: Props) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientSession(tenantSlug);

  const user = await prisma.userClient.findUnique({
    where: { id: session.user_id },
    select: { full_name: true, email: true },
  });

  // Datos de contacto de Promark (centralizados; pueden venir de env)
  const promarkContact = {
    whatsapp: process.env.NEXT_PUBLIC_PROMARK_WHATSAPP || '5215555555555',
    email: process.env.NEXT_PUBLIC_PROMARK_EMAIL || 'contacto@promark.mx',
    phone: process.env.NEXT_PUBLIC_PROMARK_PHONE || '+52 55 5555 5555',
  };

  return (
    <ContactView
      tenantSlug={tenantSlug}
      userName={user?.full_name ?? 'Cliente'}
      userEmail={user?.email ?? null}
      contact={promarkContact}
    />
  );
}
