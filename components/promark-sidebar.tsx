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
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromarkSidebarProps {
  userName: string;
  userRole: string;
  userAvatar?: unknown;
}

function extractAvatarSrc(avatar: unknown): string | null {
  if (!avatar) return null;
  if (typeof avatar === 'string' && (avatar.startsWith('data:') || avatar.startsWith('http'))) return avatar;
  if (Array.isArray(avatar) && avatar.length > 0) {
    const first = avatar[0];
    return typeof first === 'string' ? first : first?.url ?? first?.data ?? null;
  }
  if (typeof avatar === 'object' && avatar !== null) {
    const obj = avatar as Record<string, unknown>;
    return (obj.url ?? obj.dataUrl ?? obj.data ?? obj.image) as string | null;
  }
  return null;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
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

export function PromarkSidebar({ userName, userRole, userAvatar }: PromarkSidebarProps) {
  const avatarSrc = extractAvatarSrc(userAvatar);
  const pathname = usePathname();

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
          href: `/tenants/${tenantId}/financiero`,
          label: 'Financiero',
          icon: <DollarSign className="h-4 w-4" />,
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
    <aside
      className="sticky top-0 flex h-screen w-64 shrink-0 flex-col"
      style={{
        background: 'linear-gradient(135deg, #0B1F2A 0%, #0F2E3D 100%)',
        borderRight: '1px solid rgba(251, 246, 236, 0.12)',
      }}
    >
      {/* Logo — fondo más claro para contraste */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{
          borderBottom: '1px solid rgba(251, 246, 236, 0.10)',
          background: 'rgba(251, 246, 236, 0.06)',
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/promark-icon.svg"
            alt="Promark"
            className="h-9 w-9 shrink-0"
          />
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight" style={{ color: '#FBF6EC' }}>
              Promark<span style={{ color: 'rgba(251, 246, 236, 0.5)' }}>®</span>
            </span>
            <span
              className="mt-0.5 text-[10px] uppercase tracking-wider"
              style={{ color: 'rgba(251, 246, 236, 0.58)' }}
            >
              Inteligencia marcaria
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <p
          className="mb-1 mt-1 px-3 text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'rgba(251, 246, 236, 0.45)' }}
        >
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
            <p
              className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: 'rgba(251, 246, 236, 0.45)' }}
            >
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
      <div className="p-3 space-y-1.5" style={{ borderTop: '1px solid rgba(251, 246, 236, 0.10)' }}>
        <Link
          href="/settings/profile"
          className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-200"
          style={{
            border: '1px solid rgba(251, 246, 236, 0.10)',
            background: 'rgba(251, 246, 236, 0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(251, 246, 236, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(211, 154, 43, 0.30)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(251, 246, 236, 0.04)';
            e.currentTarget.style.borderColor = 'rgba(251, 246, 236, 0.10)';
          }}
        >
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt={userName} className="h-8 w-8 shrink-0 rounded-full object-cover" style={{ border: '2px solid rgba(211,154,43,0.4)' }} />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(211,154,43,0.2)', color: '#D39A2B' }}>
              {userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={{ color: '#FBF6EC' }}>{userName}</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(251, 246, 236, 0.5)' }}>
              {userRole}
            </p>
          </div>
          <Settings className="h-3.5 w-3.5 transition-colors" style={{ color: 'rgba(251, 246, 236, 0.35)' }} />
        </Link>
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{ color: 'rgba(251, 246, 236, 0.45)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(180, 35, 24, 0.15)';
            e.currentTarget.style.color = '#F9E8E5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(251, 246, 236, 0.45)';
          }}
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
        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
      )}
      style={
        isActive
          ? {
              background: 'rgba(251, 246, 236, 0.10)',
              color: '#FBF6EC',
              borderLeft: '3px solid #D39A2B',
              paddingLeft: '9px',
            }
          : {
              color: 'rgba(251, 246, 236, 0.72)',
            }
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(251, 246, 236, 0.08)';
          e.currentTarget.style.color = '#FBF6EC';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(251, 246, 236, 0.72)';
        }
      }}
    >
      <span style={isActive ? { color: '#D39A2B' } : { color: 'rgba(251, 246, 236, 0.5)' }}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ background: '#B42318', color: '#FBF6EC' }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
