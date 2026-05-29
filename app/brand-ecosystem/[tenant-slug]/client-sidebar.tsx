'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Tag, FileText, Bell, LayoutDashboard, LogOut, MessageCircle, Download } from 'lucide-react';

interface ClientSidebarProps {
  tenantSlug: string;
  tenantId: string;
  displayName: string;
  logoUrl: string | null;
  primaryColor: string;
  userName: string;
  userRoleLabel: string | null;
  showContracts?: boolean; // deprecated — contratos viven dentro de Documentos
  showAlerts?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}

export function ClientSidebar({
  tenantSlug,
  tenantId,
  displayName,
  logoUrl,
  primaryColor,
  userName,
  userRoleLabel,
  showAlerts = true,
}: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/brand-ecosystem/${tenantSlug}`;

  async function handleLogout() {
    // El cookie es HttpOnly: solo el servidor puede limpiarlo.
    try {
      await fetch('/api/auth/client-pin/logout', { method: 'POST' });
    } catch {
      /* si la petición falla, el cookie expira por TTL */
    }
    router.push(`/brand-ecosystem/${tenantSlug}/login`);
    router.refresh();
  }

  const [pendingAlerts, setPendingAlerts] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/tenants/${tenantId}/alerts?status=PENDING&limit=1`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { total: 0 }))
      .then((data) => setPendingAlerts(data.total ?? 0))
      .catch(() => {
        /* ignore */
      });
    return () => controller.abort();
  }, [tenantId, pathname]);

  const navItems: NavItem[] = [
    { label: 'Panel', href: `${basePath}/panel`, icon: LayoutDashboard, tooltip: 'Vista general del ecosistema de marcas' },
    { label: 'Marcas', href: `${basePath}/brands`, icon: Tag, tooltip: 'Catálogo completo de marcas registradas' },
    ...(showAlerts ? [{ label: 'Alertas', href: `${basePath}/alerts`, icon: Bell, tooltip: 'Vigencias por vencer y eventos detectados' }] : []),
    { label: 'Documentos', href: `${basePath}/documents`, icon: FileText, tooltip: 'Contratos, licencias, certificados y comunicaciones — organizados por tipo' },
    { label: 'Descargas', href: `${basePath}/descargas`, icon: Download, tooltip: 'Exporta el catálogo en PDF o Excel con filtros' },
    { label: 'Contacto', href: `${basePath}/contacto`, icon: MessageCircle, tooltip: 'WhatsApp, email o mensaje directo a Promark' },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  // Hide sidebar on login page
  if (pathname.endsWith('/login')) return null;

  return (
    <aside
      className="sticky top-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r"
      style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
    >
      {/* Logo / Brand header */}
      <div
        className="flex items-center gap-3 border-b px-4 py-5"
        style={{ borderColor: '#E2DED6' }}
      >
        {logoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={displayName}
              className="h-9 w-9 rounded-lg object-contain"
            />
          </>
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
              color: '#FBF6EC',
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold" style={{ color: '#0F2E3D' }}>
            {displayName}
          </span>
          <span className="block text-[10px] font-medium" style={{ color: '#355B6F' }}>
            Portal de clientes
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isAlerts = item.href.endsWith('/alerts');
            return (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                  style={
                    active
                      ? {
                          background: `${primaryColor}15`,
                          color: primaryColor,
                          boxShadow: `inset 3px 0 0 ${primaryColor}`,
                        }
                      : { color: '#355B6F' }
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(226,222,214,0.5)';
                      e.currentTarget.style.color = '#0F2E3D';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#355B6F';
                    }
                  }}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isAlerts && pendingAlerts > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: '#B42318', color: '#FBF6EC' }}
                    >
                      {pendingAlerts}
                    </span>
                  )}
                </Link>
                {/* Tooltip */}
                <div
                  className="pointer-events-none absolute left-full top-1/2 z-[100] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                  style={{ background: '#0F2E3D', color: '#FBF6EC' }}
                >
                  {item.tooltip}
                  <div
                    className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
                    style={{ borderRightColor: '#0F2E3D' }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info footer + logout — la "foto" es el logo del tenant
        cuando existe; si no, fallback a iniciales del usuario. */}
      <div className="border-t px-4 py-4" style={{ borderColor: '#E2DED6' }}>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={displayName}
              className="size-9 shrink-0 rounded-full object-contain"
              style={{ background: '#FBF6EC', padding: 2, border: `1px solid ${primaryColor}40` }}
            />
          ) : (
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                color: '#FBF6EC',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={{ color: '#0F2E3D' }}>
              {userName}
            </p>
            {userRoleLabel && (
              <p className="text-[11px] font-medium" style={{ color: '#355B6F' }}>{userRoleLabel}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: '#C8C4B9' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(180,35,24,0.08)';
              e.currentTarget.style.color = '#B42318';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#C8C4B9';
            }}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
