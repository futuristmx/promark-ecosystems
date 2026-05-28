import { redirect } from 'next/navigation';
import { requirePromarkAuth } from '@/lib/auth/promark';
import prisma from '@/lib/prisma/client';
import { PageTitle } from '@/components/ds';
import { UsersAdminView } from './users-admin-view';
import { PromarkRolesEditor } from './promark-roles-editor';

export default async function UsersAdminPage() {
  const session = await requirePromarkAuth();
  const { assertPromarkPermission } = await import('@/lib/auth/promark-permissions');
  // manage_users autoriza a entrar; SUPERADMIN siempre lo tiene por defaults.
  await assertPromarkPermission(session.role, 'manage_users', '/settings/profile');

  const roleConfigs = await prisma.promarkRoleConfig.findMany();

  const users = await prisma.userPromark.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      status: true,
      avatar: true,
      last_login: true,
      created_at: true,
    },
  });

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    status: u.status,
    avatar: u.avatar as { dataUrl?: string; url?: string } | string | null,
    last_login: u.last_login?.toISOString() ?? null,
    created_at: u.created_at.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Administración"
        title="Usuarios Promark"
        subtitle="Gestiona empleados con acceso al staff: nombre, rol, foto, contraseña y estado."
      />
      <PromarkRolesEditor
        initial={roleConfigs.map((c) => ({
          role: c.role,
          label: c.label,
          permissions: (c.permissions ?? {}) as Record<string, boolean>,
        }))}
      />

      <UsersAdminView
        users={rows}
        currentUserId={session.id}
        customRoleLabels={Object.fromEntries(roleConfigs.map((c) => [c.role, c.label]))}
      />
    </div>
  );
}
