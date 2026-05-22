'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Tag,
  Users,
  ChevronRight,
  Network,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromarkSidebarProps {
  userName: string;
  userRole: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const mainNav: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: '/tenants',
    label: 'Tenants',
    icon: <Building2 className="h-4 w-4" />,
  },
];

export function PromarkSidebar({ userName, userRole }: PromarkSidebarProps) {
  const pathname = usePathname();

  // Detect tenant context: /tenants/[tenant-id]/...
  const tenantMatch = pathname.match(/^\/tenants\/([^/]+)\//);
  const tenantId = tenantMatch ? tenantMatch[1] : null;

  const [pendingAlerts, setPendingAlerts] = useState<number>(0);

  useEffect(() => {
    if (!tenantId) {
      setPendingAlerts(0);
      return;
    }
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

  const tenantSubNav: NavItem[] = tenantId
    ? [
        {
          href: `/tenants/${tenantId}/structure`,
          label: 'Structure',
          icon: <Network className="h-4 w-4" />,
        },
        {
          href: `/tenants/${tenantId}/brands`,
          label: 'Brands',
          icon: <Tag className="h-4 w-4" />,
        },
        {
          href: `/tenants/${tenantId}/holders`,
          label: 'Holders',
          icon: <Users className="h-4 w-4" />,
        },
        {
          href: `/tenants/${tenantId}/alerts`,
          label: 'Alertas',
          icon: <Bell className="h-4 w-4" />,
        },
      ]
    : [];

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-700 px-6">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          Promark<span className="text-blue-400">&reg;</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Main
        </p>
        {mainNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600/20 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        {/* Tenant sub-navigation */}
        {tenantId && tenantSubNav.length > 0 && (
          <>
            <div className="my-3 border-t border-slate-700" />
            <p className="mb-1 flex items-center gap-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              <ChevronRight className="h-3 w-3" />
              Tenant
            </p>
            {tenantSubNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const isAlerts = item.href.endsWith('/alerts');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600/20 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {isAlerts && pendingAlerts > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {pendingAlerts}
                    </span>
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="border-t border-slate-700 p-4">
        <p className="truncate text-sm font-medium text-white">{userName}</p>
        <p className="text-xs text-slate-400">{userRole}</p>
      </div>
    </aside>
  );
}
