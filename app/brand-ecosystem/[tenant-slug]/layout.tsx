import { cookies } from 'next/headers';
import prisma from '@/lib/prisma/client';
import { verifyClientJWT } from '@/lib/auth/client-pin';
import { ClientSidebar } from './client-sidebar';

interface TenantConfig {
  branding?: {
    logo_url?: string;
    primary_color?: string;
    company_display_name?: string;
    favicon_url?: string;
  };
  features?: {
    show_brand_history?: boolean;
    show_contracts?: boolean;
    show_graph_view?: boolean;
    show_documents?: boolean;
    allow_document_download?: boolean;
  };
  notifications?: {
    expiry_alert_days?: number;
    notify_email?: boolean;
  };
  localization?: {
    language?: string;
    timezone?: string;
  };
}

export { type TenantConfig };

export default async function BrandEcosystemLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ 'tenant-slug': string }>;
}) {
  const { 'tenant-slug': tenantSlug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      config: true,
    },
  });

  if (!tenant || tenant.status !== 'ACTIVE') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">404</h1>
          <p className="mt-2 text-sm text-slate-500">
            El portal solicitado no existe o no esta disponible.
          </p>
        </div>
      </div>
    );
  }

  const config = tenant.config as TenantConfig;
  const primaryColor = config?.branding?.primary_color ?? '#2563eb';
  const displayName = config?.branding?.company_display_name ?? tenant.name;
  const logoUrl = config?.branding?.logo_url ?? null;

  // Try to get user info from JWT (non-blocking; layout works even if not logged in)
  let userName: string | null = null;
  let userRole: string | null = null;
  const cookieStore = await cookies();
  const token = cookieStore.get('promark-client-token')?.value;
  if (token) {
    try {
      const payload = await verifyClientJWT(token);
      if (payload.tenant_slug === tenantSlug) {
        // Fetch user name from DB
        const user = await prisma.userClient.findUnique({
          where: { id: payload.user_id },
          select: { full_name: true },
        });
        userName = user?.full_name ?? null;
        userRole = payload.role;
      }
    } catch {
      // Token invalid — user will be redirected on protected pages
    }
  }

  const roleLabels: Record<string, string> = {
    CLIENT_ADMIN: 'Administrador',
    CLIENT_VIEWER: 'Consultor',
    CLIENT_LEGAL_REP: 'Representante Legal',
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ '--tenant-primary': primaryColor } as React.CSSProperties}
    >
      {/* Sidebar */}
      {userName && (
        <ClientSidebar
          tenantSlug={tenantSlug}
          tenantId={tenant.id}
          displayName={displayName}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          userName={userName}
          userRoleLabel={userRole ? (roleLabels[userRole] ?? userRole) : null}
        />
      )}

      {/* Main content */}
      <main className="flex flex-1 flex-col bg-slate-50">{children}</main>
    </div>
  );
}
