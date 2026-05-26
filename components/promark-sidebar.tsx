'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Network,
  Bell,
  Activity,
  Settings,
  UserCircle,
  LogOut,
  Briefcase,
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
  /** Additional path prefixes that mark this item as active */
  activeAlso?: string[];
}

const mainNav: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Panel',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: '/tenants',
    label: 'Clientes',
    icon: <Building2 className="h-4 w-4" />,
  },
];

export function PromarkSidebar({ userName, userRole }: PromarkSidebarProps) {
  const pathname = usePathname();

  // Detect tenant context: /tenants/[tenant-id]/...
  const tenantMatch = pathname.match(/^\/tenants\/([^/]+)\//);
  const tenantId = tenantMatch ? tenantMatch[1] : null;

  const [pendingAlerts, setPendingAlerts] = useState<number>(0);
  const [tenantName, setTenantName] = useState<string>('');

  useEffect(() => {
    if (!tenantId) { setTenantName(''); setPendingAlerts(0); return; }
    const controller = new AbortController();
    fetch(`/api/tenants/${tenantId}/alerts?status=PENDING&limit=1`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { total: 0 }))
      .then((d) => setPendingAlerts(d.total ?? 0))
      .catch(() => {});
    fetch(`/api/tenants/${tenantId}/info`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.name) setTenantName(d.name); })
      .catch(() => {});
    return () => controller.abort();
  }, [tenantId, pathname]);

  const tenantSubNav: NavItem[] = tenantId
    ? [
        {
          href: `/tenants/${tenantId}/panel`,
          label: 'Vista general',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          href: `/tenants/${tenantId}/structure`,
          label: 'Estructura',
          icon: <Network className="h-4 w-4" />,
        },
        {
          href: `/tenants/${tenantId}/portfolio`,
          label: 'Portafolio',
          icon: <Briefcase className="h-4 w-4" />,
          // Old individual routes also count as "Portafolio" active
          activeAlso: [
            `/tenants/${tenantId}/brands`,
            `/tenants/${tenantId}/holders`,
            `/tenants/${tenantId}/contratos`,
            `/tenants/${tenantId}/licencias`,
          ],
        },
        {
          href: `/tenants/${tenantId}/alerts`,
          label: 'Alertas',
          icon: <Bell className="h-4 w-4" />,
        },
        {
          href: `/tenants/${tenantId}/actividad`,
          label: 'Actividad',
          icon: <Activity className="h-4 w-4" />,
        },
        {
          href: `/tenants/${tenantId}/configuracion`,
          label: 'Configuración',
          icon: <Settings className="h-4 w-4" />,
        },
      ]
    : [];

  function isItemActive(item: NavItem): boolean {
    if (pathname === item.href || pathname.startsWith(item.href + '/')) return true;
    if (item.activeAlso) {
      return item.activeAlso.some(
        (p) => pathname === p || pathname.startsWith(p + '/')
      );
    }
    return false;
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200/60 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-slate-200/60 px-5 py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold text-white shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #2C3445, #0066FF)',
            }}
          >
            P
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-slate-900">
              Promark<span className="text-slate-400">®</span>
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">
              Inteligencia marcaria
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <p className="mb-1 mt-1 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Workspace
        </p>
        {mainNav.map((item) => (
          <NavLinkItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isItemActive(item)}
          />
        ))}

        {tenantId && tenantSubNav.length > 0 && (
          <>
            <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {tenantName || 'Cliente'}
            </p>
            {tenantSubNav.map((item) => (
              <NavLinkItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isItemActive(item)}
                badge={item.href.endsWith('/alerts') && pendingAlerts > 0 ? pendingAlerts : undefined}
              />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-200/60 p-3 space-y-1.5">
        <Link
          href="/settings/profile"
          className="group flex items-center gap-2.5 rounded-lg border border-slate-200/60 px-3 py-2.5 transition-all duration-200 hover:border-[#0066FF]/30 hover:bg-[#0066FF]/[0.06] hover:shadow-sm"
          style={{ background: 'rgba(0, 102, 255, 0.03)' }}
        >
          <UserCircle className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-[#0066FF]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {userRole}
            </p>
          </div>
          <Settings className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-[#0066FF]" />
        </Link>
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function NavLinkItem({
  href,
  icon,
  label,
  isActive,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'text-[#0066FF]'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      )}
      style={
        isActive
          ? {
              background:
                'linear-gradient(90deg, rgba(0, 102, 255, 0.08), rgba(0, 102, 255, 0.02))',
              borderColor: 'rgba(0, 102, 255, 0.20)',
            }
          : undefined
      }
    >
      <span className={isActive ? 'text-[#0066FF]' : 'text-slate-400 group-hover:text-slate-700'}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: '#DC2626' }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
