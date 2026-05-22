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
