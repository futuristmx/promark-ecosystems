import prisma from '@/lib/prisma/client';

interface TenantConfig {
  branding?: {
    primary_color?: string;
    company_display_name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

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

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ '--tenant-primary': primaryColor } as React.CSSProperties}
    >
      {/* Header */}
      <header
        className="flex h-14 items-center border-b px-6"
        style={{ borderColor: primaryColor }}
      >
        <span className="text-lg font-semibold" style={{ color: primaryColor }}>
          {displayName}
        </span>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col bg-slate-50">{children}</main>
    </div>
  );
}
