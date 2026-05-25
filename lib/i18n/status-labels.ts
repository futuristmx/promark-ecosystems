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

export const BRAND_STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Solicitada',
  REGISTERED: 'Registrada',
  RENEWED: 'Renovada',
  EXPIRED: 'Expirada',
  ABANDONED: 'Abandonada',
  CANCELLED: 'Cancelada',
  OPPOSED: 'Impugnada',
};

export const BRAND_TYPE_LABELS: Record<string, string> = {
  WORDMARK: 'Nominativa',
  FIGURATIVE: 'Figurativa',
  MIXED: 'Mixta',
  THREE_D: 'Tridimensional',
  SOUND: 'Sonora',
  HOLOGRAPHIC: 'Holográfica',
  OLFACTORY: 'Olfativa',
};

// Alert entity_type → user-visible label
export const ALERT_ENTITY_TYPE_LABELS: Record<string, string> = {
  BRAND: 'Marca',
  DOCUMENT: 'Documento',
  CONTRACT: 'Contrato',
  LICENSE: 'Licencia',
};

// BrandHistory change_type → user-visible label
export const BRAND_CHANGE_TYPE_LABELS: Record<string, string> = {
  CREATED: 'Marca creada',
  UPDATED: 'Marca actualizada',
  STATUS_CHANGED: 'Cambio de estado',
  RENEWED: 'Marca renovada',
  EXPIRED: 'Marca expirada',
  CANCELLED: 'Marca cancelada',
  REGISTERED: 'Marca registrada',
  HOLDER_LINKED: 'Titular vinculado',
  HOLDER_UNLINKED: 'Titular desvinculado',
  CLASS_ADDED: 'Clase agregada',
  CLASS_REMOVED: 'Clase removida',
  DOCUMENT_ATTACHED: 'Documento adjuntado',
};
