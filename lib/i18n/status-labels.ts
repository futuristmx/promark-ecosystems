// Status enum → user-visible label (ES-MX).
// Keep DB enum values (uppercase ASCII) untouched everywhere else.

export const TENANT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  ONBOARDING: 'Onboarding',
};

export const HOLDING_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  DISSOLVED: 'Disuelto',
};

export const COMPANY_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  MERGED: 'Fusionada',
  DISSOLVED: 'Disuelta',
};

export const BRAND_CLASS_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelada',
};

export const HOLDER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
};

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  LICENSE_INTERNAL: 'Licencia interna',
  LICENSE_EXTERNAL: 'Licencia externa',
  COEXISTENCE: 'Coexistencia',
  ASSIGNMENT: 'Cesión',
  FRANCHISE: 'Franquicia',
  DISTRIBUTION: 'Distribución',
  SETTLEMENT: 'Transacción',
  NDA: 'Confidencialidad',
};

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Vigente',
  EXPIRED: 'Vencido',
  TERMINATED: 'Terminado',
  RENEWED: 'Renovado',
  UNDER_REVIEW: 'En revisión',
};

export const LICENSE_TYPE_LABELS: Record<string, string> = {
  EXCLUSIVE: 'Licencia exclusiva',
  NON_EXCLUSIVE: 'No exclusiva',
  SUBLICENSE: 'Sublicencia',
};

export const LICENSE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Vigente',
  EXPIRED: 'Vencida',
  TERMINATED: 'Terminada',
  SUSPENDED: 'Suspendida',
};

export const CONTRACT_CHANGE_TYPE_LABELS: Record<string, string> = {
  CREATED: 'Creado',
  UPDATED: 'Actualizado',
  TERMINATED: 'Terminado',
  RENEWED: 'Renovado',
  BRAND_LINKED: 'Marca vinculada',
  BRAND_UNLINKED: 'Marca desvinculada',
  LICENSE_DERIVED: 'Licencia derivada',
  DOCUMENT_ATTACHED: 'Documento adjuntado',
};
