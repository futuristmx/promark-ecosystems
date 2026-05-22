'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tag, FileText, ScrollText, Bell } from 'lucide-react';

interface ClientSidebarProps {
  tenantSlug: string;
  tenantId: string;
  displayName: string;
  logoUrl: string | null;
  primaryColor: string;
  userName: string;
  userRoleLabel: string | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function ClientSidebar({
  tenantSlug,
  tenantId,
  displayName,
  logoUrl,
  primaryColor,
  userName,
  userRoleLabel,
}: ClientSidebarProps) {
  const pathname = usePathname();
  const basePath = `/brand-ecosystem/${tenantSlug}`;

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
    { label: 'Marcas', href: `${basePath}/brands`, icon: Tag },
    { label: 'Alertas', href: `${basePath}/alerts`, icon: Bell },
    { label: 'Documentos', href: `${basePath}/documents`, icon: FileText },
    { label: 'Contratos', href: `${basePath}/contracts`, icon: ScrollText },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo / Brand header */}
      <div
        className="flex items-center gap-3 border-b px-4 py-4"
        style={{ borderColor: `${primaryColor}33` }}
      >
        {logoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={displayName}
              className="h-8 w-8 rounded object-contain"
            />
          </>
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="truncate text-sm font-semibold text-slate-900">
          {displayName}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isAlerts = item.href.endsWith('/alerts');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={
                    active
                      ? {
                          backgroundColor: `${primaryColor}15`,
                          color: primaryColor,
                        }
                      : { color: '#64748b' }
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isAlerts && pendingAlerts > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {pendingAlerts}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info footer */}
      <div className="border-t border-slate-200 px-4 py-3">
        <p className="truncate text-sm font-medium text-slate-900">
          {userName}
        </p>
        {userRoleLabel && (
          <p className="text-xs text-slate-500">{userRoleLabel}</p>
        )}
      </div>
    </aside>
  );
}
