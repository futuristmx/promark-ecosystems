import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma/client';
import { requireClientSession } from '@/lib/auth/client-session';
import { BrandVigencyDot, getVigencyInfo } from '@/components/brand-vigency-dot';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  ScrollText,
  Clock,
  Hash,
  Type,
} from 'lucide-react';

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

  // Fetch brand with relations
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

  // For CLIENT_LEGAL_REP: verify they are a holder on this brand
  // TODO: Once user-to-holder linking is built, check that the user's linked
  // holder_id appears in brand.holders. For now, allow access.
  // if (session.role === 'CLIENT_LEGAL_REP') {
  //   const isHolder = brand.holders.some(h => h.holder_id === linkedHolderId);
  //   if (!isHolder) notFound();
  // }

  // Fetch tenant config for feature flags
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenant_id },
    select: { config: true },
  });
  const config = (tenant?.config ?? {}) as TenantConfig;
  const features = config.features ?? {};

  // CLIENT_VIEWER never sees history or documents regardless of config
  const isViewer = session.role === 'CLIENT_VIEWER';
  const showHistory = !isViewer && (features.show_brand_history ?? false);
  const showDocuments = !isViewer && (features.show_documents ?? false);
  const showContracts = !isViewer && (features.show_contracts ?? false);

  // Fetch documents for this brand if enabled
  let documents: Array<{
    id: string;
    file_name: string;
    document_category: string;
    uploaded_at: Date;
    description: string | null;
  }> = [];
  if (showDocuments) {
    documents = await prisma.document.findMany({
      where: {
        tenant_id: session.tenant_id,
        entity_type: 'brand',
        entity_id: brandId,
      },
      select: {
        id: true,
        file_name: true,
        document_category: true,
        uploaded_at: true,
        description: true,
      },
      orderBy: { uploaded_at: 'desc' },
    });
  }

  const vigencyInfo = getVigencyInfo(brand.expiration_date, brand.legal_status);
  const basePath = `/brand-ecosystem/${tenantSlug}/brands`;

  return (
    <div className="px-6 py-6">
      {/* Back link */}
      <Link
        href={basePath}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" />
        Volver a marcas
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{brand.name}</h1>
            <BrandVigencyDot
              expirationDate={brand.expiration_date}
              legalStatus={brand.legal_status}
            />
          </div>
          <p className="mt-1 text-sm text-slate-500">{brand.company.name}</p>
        </div>
        <div className="text-right">
          <Badge
            variant={
              brand.legal_status === 'REGISTERED' || brand.legal_status === 'RENEWED'
                ? 'default'
                : brand.legal_status === 'EXPIRED' || brand.legal_status === 'CANCELLED'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {STATUS_LABELS[brand.legal_status] ?? brand.legal_status}
          </Badge>
          <p className="mt-1 text-xs text-slate-400">{vigencyInfo.label}</p>
        </div>
      </div>

      {/* Info cards grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          label="Fecha de expiracion"
          value={formatDate(brand.expiration_date)}
        />
        <InfoCard
          icon={<Building2 className="size-4" />}
          label="Empresa"
          value={brand.company.legal_name ?? brand.company.name}
        />
        {brand.renewal_date && (
          <InfoCard
            icon={<Calendar className="size-4" />}
            label="Fecha de renovacion"
            value={formatDate(brand.renewal_date)}
          />
        )}
      </div>

      {/* Description */}
      {brand.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Descripcion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">{brand.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Nice classes */}
      {brand.classes.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Clases de Niza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {brand.classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-slate-200 text-xs font-bold text-slate-700">
                    {cls.class_number}
                  </span>
                  <span className="text-sm text-slate-600">
                    {cls.class_description ?? 'Sin descripcion'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holders */}
      {brand.holders.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Titulares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {brand.holders.map((bh) => (
                <div
                  key={bh.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {bh.holder.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {bh.holder.holder_type === 'INDIVIDUAL'
                        ? 'Persona fisica'
                        : 'Persona moral'}
                    </p>
                  </div>
                  <Badge variant="outline">{formatHolderRole(bh.role)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History timeline */}
      {showHistory && brand.history.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4" />
              Historial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-4 pl-6">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />
              {brand.history.map((event) => (
                <div key={event.id} className="relative">
                  <div
                    className="absolute -left-6 top-1 size-2.5 rounded-full border-2 border-white"
                    style={{ backgroundColor: 'var(--tenant-primary)' }}
                  />
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(event.event_date)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="mt-1 text-xs text-slate-500">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {showDocuments && documents.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDocCategory(doc.document_category)} &middot;{' '}
                      {formatDate(doc.uploaded_at)}
                    </p>
                    {doc.description && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contracts */}
      {showContracts && brand.contract_brands.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="size-4" />
              Contratos vinculados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {brand.contract_brands.map((cb) => (
                <div
                  key={cb.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {cb.contract.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatContractType(cb.contract.contract_type)} &middot;{' '}
                      {cb.contract.expiration_date
                        ? `Vence ${formatDate(cb.contract.expiration_date)}`
                        : 'Sin fecha de vencimiento'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      cb.contract.status === 'ACTIVE'
                        ? 'default'
                        : cb.contract.status === 'EXPIRED' ||
                            cb.contract.status === 'TERMINATED'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {formatContractStatus(cb.contract.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
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

function formatDocCategory(cat: string): string {
  const map: Record<string, string> = {
    CERTIFICATE: 'Certificado',
    APPLICATION: 'Solicitud',
    POWER_OF_ATTORNEY: 'Poder Notarial',
    CONTRACT_COPY: 'Copia de contrato',
    CORRESPONDENCE: 'Correspondencia',
    COURT_FILING: 'Documento judicial',
    RENEWAL_PROOF: 'Comprobante de renovacion',
    OTHER: 'Otro',
  };
  return map[cat] ?? cat;
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
