'use client';

import { useState } from 'react';
import { Paintbrush, Link2, KeyRound, Bell, ExternalLink } from 'lucide-react';
import { BrandingTab } from './tab-branding';
import { PortalTab } from './tab-portal';
import { CredentialsTab } from './tab-credentials';
import { NotificationsTab } from './tab-notifications';

interface BrandingState {
  primary_color: string;
  company_display_name: string;
  logo_url: string | null;
  favicon_url: string | null;
}

interface NotificationsState {
  notify_email: string;
  expiry_alert_days: number;
}

interface ClientUser {
  id: string;
  full_name: string;
  email: string;
  card_id: string;
  role: string;
  status: string;
  pin_generated_at: string | null;
}

interface ClientAlertsState {
  enabled: boolean;
  general_comment?: string;
  types?: Record<string, { visible: boolean; trigger_days?: number; comment?: string }>;
}

interface Props {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  initialBranding: BrandingState;
  initialNotifications: NotificationsState;
  clientUsers: ClientUser[];
  roleOverrides: Record<string, { label?: string; permissions?: Record<string, boolean> }>;
  initialClientAlerts: ClientAlertsState;
}

const TABS = [
  {
    id: 'branding',
    label: 'Branding',
    icon: Paintbrush,
    tooltip: 'Logo, color primario y nombre que aparecen en el portal del cliente',
  },
  {
    id: 'portal',
    label: 'Portal & URL',
    icon: Link2,
    tooltip: 'Slug y URL pública del portal del cliente',
  },
  {
    id: 'credentials',
    label: 'Credenciales',
    icon: KeyRound,
    tooltip: 'Usuarios del cliente, PIN de acceso, nombre y permisos de cada rol',
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    icon: Bell,
    tooltip: 'Email destinatario y días de anticipación para alertas de vencimiento',
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function TenantConfigTabs({
  tenantId,
  tenantName,
  tenantSlug,
  initialBranding,
  initialNotifications,
  clientUsers,
  roleOverrides,
  initialClientAlerts,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('branding');

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex gap-1 rounded-2xl p-1.5"
        style={{ background: '#F1EDE3', border: '1px solid #E2DED6' }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              title={tab.tooltip}
              aria-label={`${tab.label}: ${tab.tooltip}`}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #0F2E3D 0%, #1C3F55 100%)',
                      color: '#FBF6EC',
                      boxShadow: '0 2px 8px rgba(15,46,61,0.25)',
                    }
                  : {
                      color: '#355B6F',
                      background: 'transparent',
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(226,222,214,0.5)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <tab.icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}

        {/* Portal link — botón sólido para mejor contraste */}
        <a
          href={`/brand-ecosystem/${tenantSlug}/panel`}
          target="_blank"
          rel="noreferrer"
          title="Abre el portal del cliente en una pestaña nueva"
          className="ml-auto flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, #D39A2B 0%, #E8B84A 100%)',
            color: '#0B1F2A',
            boxShadow: '0 2px 8px rgba(211,154,43,0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(211,154,43,0.4)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(211,154,43,0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <ExternalLink className="size-3.5" />
          <span className="hidden sm:inline">Abrir portal</span>
        </a>
      </div>

      {/* Tab content */}
      <div className="mt-8">
        {activeTab === 'branding' && (
          <BrandingTab
            tenantId={tenantId}
            tenantName={tenantName}
            tenantSlug={tenantSlug}
            initialBranding={initialBranding}
          />
        )}
        {activeTab === 'portal' && (
          <PortalTab
            tenantId={tenantId}
            tenantName={tenantName}
            currentSlug={tenantSlug}
          />
        )}
        {activeTab === 'credentials' && (
          <CredentialsTab
            tenantId={tenantId}
            tenantName={tenantName}
            clientUsers={clientUsers}
            roleOverrides={roleOverrides}
          />
        )}
        {activeTab === 'notifications' && (
          <NotificationsTab
            tenantId={tenantId}
            initialNotifications={initialNotifications}
            initialClientAlerts={initialClientAlerts}
          />
        )}
      </div>
    </div>
  );
}
