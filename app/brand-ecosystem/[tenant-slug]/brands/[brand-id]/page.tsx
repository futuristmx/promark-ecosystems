import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { BrandVigencyDot, getVigencyInfo } from '@/components/brand-vigency-dot';
import {
  ArrowLeft,
  Calendar,
  Building2,
  ScrollText,
  Clock,
  Hash,
  Type,
} from 'lucide-react';
import { DocumentsPanel } from '@/components/documents-panel';
import { getNiceClassLabel } from '@/lib/i18n/impi-classes';
import NizaBoard from '@/components/niza-board';

interface BrandDetailPageProps {
  params: Promise<{ 'tenant-slug': string; 'brand-id': string }>;
}

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

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Solicitada',
  PUBLISHED: 'Publicada',
  REGISTERED: 'Registrada',
  RENEWED: 'Renovada',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
  OPPOSED: 'Opuesta',
  IN_LITIGATION: 'En litigio',
};

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  APPLIED: { bg: 'rgba(143,182,199,0.12)', color: '#355B6F', border: 'rgba(143,182,199,0.3)' },
  PUBLISHED: { bg: 'rgba(53,91,111,0.1)', color: '#355B6F', border: 'rgba(53,91,111,0.25)' },
  REGISTERED: { bg: 'rgba(15,46,61,0.08)', color: '#0F2E3D', border: 'rgba(15,46,61,0.2)' },
  RENEWED: { bg: 'rgba(47,107,79,0.08)', color: '#2F6B4F', border: 'rgba(47,107,79,0.2)' },
  EXPIRED: { bg: 'rgba(180,35,24,0.08)', color: '#B42318', border: 'rgba(180,35,24,0.2)' },
  CANCELLED: { bg: 'rgba(200,196,185,0.2)', color: '#C8C4B9', border: 'rgba(200,196,185,0.4)' },
  OPPOSED: { bg: 'rgba(211,154,43,0.1)', color: '#D39A2B', border: 'rgba(211,154,43,0.25)' },
  IN_LITIGATION: { bg: 'rgba(11,31,42,0.08)', color: '#0B1F2A', border: 'rgba(11,31,42,0.2)' },
};

const VISUAL_BRAND_TYPES = ['FIGURATIVE', 'MIXED', 'THREE_D', 'TRADE_DRESS', 'HOLOGRAM'];

function BrandLogoHeader({ logos, brandType }: { logos: unknown; brandType: string }) {
  if (!VISUAL_BRAND_TYPES.includes(brandType)) return null;
  let src: string | null = null;
  if (typeof logos === 'string' && logos.startsWith('data:')) src = logos;
  else if (Array.isArray(logos) && logos.length > 0) {
    const first = logos[0];
    src = typeof first === 'string' ? first : first?.url ?? first?.data ?? null;
  } else if (logos && typeof logos === 'object' && !Array.isArray(logos)) {
    const obj = logos as Record<string, unknown>;
    src = (obj.url ?? obj.data ?? obj.image) as string | null;
  }
  if (!src) return (
    <div className="flex h-16 w-16 items-center justify-center rounded-xl text-xs font-medium"
      style={{ background: 'rgba(143,182,199,0.12)', color: '#8FB6C7' }}>IMG</div>
  );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Logo" className="h-16 w-16 rounded-xl object-contain" style={{ background: '#FBF6EC', border: '1px solid #E2DED6' }} />;
}

const BRAND_TYPE_LABELS: Record<string, string> = {
  WORDMARK: 'Nominativa',
  FIGURATIVE: 'Figurativa',
  MIXED: 'Mixta',
  THREE_D: 'Tridimensional',
  SOUND: 'Sonora',
  HOLOGRAM: 'Holograma',
  TRADE_DRESS: 'Imagen Comercial',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  REGISTRATION: 'Registro',
  RENEWAL: 'Renovacion',
  TRANSFER: 'Transferencia',
  OPPOSITION: 'Oposicion',
  CANCELLATION: 'Cancelacion',
  STATUS_CHANGE: 'Cambio de estado',
  MODIFICATION: 'Modificacion',
  LITIGATION_START: 'Inicio de litigio',
  LITIGATION_END: 'Fin de litigio',
  ASSIGNMENT: 'Cesion',
  LICENSE_GRANT: 'Otorgamiento de licencia',
};

function formatDate(date: Date | null): string {
  if (!date) return '---';
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BrandDetailPage({ params }: BrandDetailPageProps) {
  const { 'tenant-slug': tenantSlug, 'brand-id': brandId } = await params;
  const session = await requireClientSession(tenantSlug);

  const brandResult = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      company: true,
      holders: {
        include: {
          holder: true,
        },
      },
      classes: true,
      history: {
        where: { visible_to_client: true },
        orderBy: { event_date: 'desc' },
      },
      contract_brands: {
        include: {
          contract: true,
        },
      },
    },
  });

  if (!brandResult || brandResult.tenant_id !== session.tenant_id) {
    notFound();
  }

  const brand = brandResult;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenant_id },
    select: { config: true },
  });
  const config = (tenant?.config ?? {}) as TenantConfig;
  const features = config.features ?? {};

  const isViewer = session.role === 'CLIENT_VIEWER';
  const showHistory = !isViewer && (features.show_brand_history ?? false);
  const showDocuments = !isViewer && (features.show_documents ?? false);
  const showContracts = !isViewer && (features.show_contracts ?? false);
  const allowDownload = features.allow_document_download ?? false;

  const vigencyInfo = getVigencyInfo(brand.expiration_date, brand.legal_status);
  const basePath = `/brand-ecosystem/${tenantSlug}/brands`;
  const statusS = STATUS_STYLE[brand.legal_status] ?? STATUS_STYLE.APPLIED;

  return (
    <div className="px-8 py-8">
      {/* Back link */}
      <Link
        href={basePath}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#355B6F] transition-colors hover:text-[#0F2E3D]"
      >
        <ArrowLeft className="size-4" />
        Volver a marcas
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <BrandLogoHeader logos={brand.logos} brandType={brand.brand_type} />
          <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: '#0F2E3D' }}>{brand.name}</h1>
            <BrandVigencyDot
              expirationDate={brand.expiration_date}
              legalStatus={brand.legal_status}
            />
          </div>
          <p className="mt-1 text-sm" style={{ color: '#355B6F' }}>{brand.company.name}</p>
          </div>
        </div>
        <div className="text-right">
          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: statusS.bg, color: statusS.color, border: `1px solid ${statusS.border}` }}
          >
            {STATUS_LABELS[brand.legal_status] ?? brand.legal_status}
          </span>
          {vigencyInfo.label &&
            vigencyInfo.label !== STATUS_LABELS[brand.legal_status] && (
              <p className="mt-1 text-xs" style={{ color: '#C8C4B9' }}>{vigencyInfo.label}</p>
            )}
        </div>
      </div>

      {/* Info cards grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={<Type className="size-4" />}
          label="Tipo de marca"
          value={BRAND_TYPE_LABELS[brand.brand_type] ?? brand.brand_type}
        />
        <InfoCard
          icon={<Hash className="size-4" />}
          label="No. Registro"
          value={brand.registration_number ?? '---'}
        />
        <InfoCard
          icon={<Hash className="size-4" />}
          label="No. Solicitud"
          value={brand.application_number ?? '---'}
        />
        <InfoCard
          icon={<Calendar className="size-4" />}
          label="Fecha de solicitud"
          value={formatDate(brand.application_date)}
        />
        <InfoCard
          icon={<Calendar className="size-4" />}
          label="Fecha de registro"
          value={formatDate(brand.registration_date)}
        />
        <InfoCard
          icon={<Calendar className="size-4" />}
          label="Fecha de expiración"
          value={formatDate(brand.expiration_date)}
        />
        {brand.company.legal_name &&
          brand.company.legal_name !== brand.company.name && (
            <InfoCard
              icon={<Building2 className="size-4" />}
              label="Razón social"
              value={brand.company.legal_name}
            />
          )}
        {brand.renewal_date && (
          <InfoCard
            icon={<Calendar className="size-4" />}
            label="Fecha de renovación"
            value={formatDate(brand.renewal_date)}
          />
        )}
      </div>

      {/* Description */}
      {brand.description && (
        <Section title="Descripción" className="mb-8">
          <p className="text-sm" style={{ color: '#355B6F' }}>{brand.description}</p>
        </Section>
      )}

      {/* Nice classes — visual 45-class board */}
      <Section title="Clases de Niza" className="mb-8">
        <NizaBoard registeredClasses={brand.classes.map((c) => c.class_number)} />
        {brand.classes.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {brand.classes.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center gap-2.5 text-xs"
              >
                <span
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded text-[10px] font-bold"
                  style={{ background: 'rgba(15,46,61,0.1)', color: '#0F2E3D' }}
                >
                  {cls.class_number}
                </span>
                <span style={{ color: '#355B6F' }}>
                  {cls.class_description ?? getNiceClassLabel(cls.class_number)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Holders */}
      {brand.holders.length > 0 && (
        <Section title="Titulares" className="mb-8">
          <div className="space-y-2">
            {brand.holders.map((bh) => (
              <div
                key={bh.id}
                className="flex items-center justify-between rounded-xl border px-4 py-3"
                style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0F2E3D' }}>
                    {bh.holder.name}
                  </p>
                  <p className="text-xs" style={{ color: '#355B6F' }}>
                    {bh.holder.holder_type === 'INDIVIDUAL'
                      ? 'Persona física'
                      : 'Persona moral'}
                  </p>
                </div>
                <span
                  className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ borderColor: '#E2DED6', color: '#355B6F' }}
                >
                  {formatHolderRole(bh.role)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* History timeline */}
      {showHistory && brand.history.length > 0 && (
        <Section title="Historial" icon={<Clock className="size-4" />} className="mb-8">
          <div className="relative space-y-4 pl-6">
            <div className="absolute left-[9px] top-1 bottom-1 w-px" style={{ background: '#E2DED6' }} />
            {brand.history.map((event) => (
              <div key={event.id} className="relative">
                <div
                  className="absolute -left-6 top-1 size-2.5 rounded-full border-2"
                  style={{ backgroundColor: 'var(--tenant-primary, #D39A2B)', borderColor: '#F1EDE3' }}
                />
                <div
                  className="rounded-xl border px-4 py-3"
                  style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: '#0F2E3D' }}>
                      {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                    </span>
                    <span className="text-xs" style={{ color: '#C8C4B9' }}>
                      {formatDate(event.event_date)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-xs" style={{ color: '#355B6F' }}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Documents */}
      {showDocuments && (
        <div className="mb-8">
          <DocumentsPanel
            tenantId={session.tenant_id}
            entityType="BRAND"
            entityId={brandId}
            canUpload={false}
            canDelete={false}
            canDownload={allowDownload}
          />
        </div>
      )}

      {/* Contracts */}
      {showContracts && brand.contract_brands.length > 0 && (
        <Section title="Contratos vinculados" icon={<ScrollText className="size-4" />} className="mb-8">
          <div className="space-y-2">
            {brand.contract_brands.map((cb) => {
              const contractStatusS: Record<string, { bg: string; color: string }> = {
                ACTIVE: { bg: 'rgba(47,107,79,0.08)', color: '#2F6B4F' },
                EXPIRED: { bg: 'rgba(180,35,24,0.08)', color: '#B42318' },
                TERMINATED: { bg: 'rgba(180,35,24,0.08)', color: '#B42318' },
              };
              const cs = contractStatusS[cb.contract.status] ?? { bg: 'rgba(143,182,199,0.12)', color: '#355B6F' };
              return (
                <div
                  key={cb.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-3"
                  style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#0F2E3D' }}>
                      {cb.contract.title}
                    </p>
                    <p className="text-xs" style={{ color: '#355B6F' }}>
                      {formatContractType(cb.contract.contract_type)} &middot;{' '}
                      {cb.contract.expiration_date
                        ? `Vence ${formatDate(cb.contract.expiration_date)}`
                        : 'Sin fecha de vencimiento'}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: cs.bg, color: cs.color }}
                  >
                    {formatContractStatus(cb.contract.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Helper Components ─────────────────────────────────────────────────────

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
    >
      <div className="flex items-center gap-2" style={{ color: '#355B6F' }}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold" style={{ color: '#0F2E3D' }}>{value}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  className,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${className ?? ''}`}
      style={{ borderColor: '#E2DED6', background: '#F1EDE3' }}
    >
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold" style={{ color: '#0F2E3D' }}>
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Formatters ────────────────────────────────────────────────────────────

function formatHolderRole(role: string): string {
  const map: Record<string, string> = {
    OWNER: 'Titular',
    CO_OWNER: 'Co-titular',
    LICENSEE: 'Licenciatario',
    LEGAL_REPRESENTATIVE: 'Representante Legal',
    AGENT: 'Agente',
  };
  return map[role] ?? role;
}

function formatContractType(type: string): string {
  const map: Record<string, string> = {
    LICENSE_INTERNAL: 'Licencia interna',
    LICENSE_EXTERNAL: 'Licencia externa',
    COEXISTENCE: 'Coexistencia',
    ASSIGNMENT: 'Cesion',
    FRANCHISE: 'Franquicia',
    DISTRIBUTION: 'Distribucion',
    SETTLEMENT: 'Convenio',
    NDA: 'NDA',
  };
  return map[type] ?? type;
}

function formatContractStatus(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Borrador',
    ACTIVE: 'Activo',
    EXPIRED: 'Expirado',
    TERMINATED: 'Terminado',
    RENEWED: 'Renovado',
    UNDER_REVIEW: 'En revision',
  };
  return map[status] ?? status;
}
