import { requirePromarkAuth } from '@/lib/auth/promark';
import prisma from '@/lib/prisma/client';
import { PageTitle, DsCard } from '@/components/ds';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const session = await requirePromarkAuth();

  const profile = await prisma.userPromark.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      avatar: true,
      status: true,
      created_at: true,
    },
  });

  if (!profile) {
    return <p>Perfil no encontrado.</p>;
  }

  const serialized = {
    ...profile,
    avatar: profile.avatar as { dataUrl: string } | null,
    created_at: profile.created_at.toISOString(),
  };

  return (
    <div>
      <PageTitle
        eyebrow="Configuración"
        title="Mi perfil"
        subtitle="Administra tu información personal y preferencias."
      />
      <DsCard variant="standard">
        <div className="p-6">
          <ProfileForm profile={serialized} />
        </div>
      </DsCard>
    </div>
  );
}
