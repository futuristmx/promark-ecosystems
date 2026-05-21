'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tag, FileText, ScrollText } from 'lucide-react';

interface ClientSidebarProps {
  tenantSlug: string;
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
  displayName,
  logoUrl,
  primaryColor,
  userName,
  userRoleLabel,
}: ClientSidebarProps) {
  const pathname = usePathname();
  const basePath = `/brand-ecosystem/${tenantSlug}`;

  const navItems: NavItem[] = [
    { label: 'Marcas', href: `${basePath}/brands`, icon: Tag },
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
                  {item.label}
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
