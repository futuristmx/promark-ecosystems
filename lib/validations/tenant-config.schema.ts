import { z } from 'zod';

// ─── Tenant Config Schema ────────────────────────────────────────────────────

export const TenantConfigSchema = z.object({
  branding: z.object({
    logo_url: z.string().url().nullable(),
    primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g. #FF5500)'),
    company_display_name: z.string().min(1),
    favicon_url: z.string().url().nullable(),
  }),
  features: z.object({
    show_brand_history: z.boolean(),
    show_contracts: z.boolean(),
    show_graph_view: z.boolean(),
    show_documents: z.boolean(),
    allow_document_download: z.boolean(),
  }),
  notifications: z.object({
    expiry_alert_days: z.number().int().min(1).max(365),
    notify_email: z.string().email().nullable(),
  }),
  localization: z.object({
    language: z.enum(['es', 'en']),
    timezone: z.string(),
  }),
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;

// ─── Active Modules Schema ───────────────────────────────────────────────────

export const ActiveModulesSchema = z.object({
  corporate_structure: z.boolean(),
  brand_catalog: z.boolean(),
  classifications_vigency: z.boolean(),
  legal_history: z.boolean(),
  relationships: z.boolean(),
  contracts: z.boolean(),
  brand_audit: z.boolean(),
  user_admin: z.boolean(),
  tenant_config: z.boolean(),
  intelligence_dashboard: z.boolean(),
});

export type ActiveModules = z.infer<typeof ActiveModulesSchema>;

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  branding: {
    logo_url: null,
    primary_color: '#1E3A5F',
    company_display_name: '',
    favicon_url: null,
  },
  features: {
    show_brand_history: true,
    show_contracts: true,
    show_graph_view: true,
    show_documents: true,
    allow_document_download: false,
  },
  notifications: {
    expiry_alert_days: 90,
    notify_email: null,
  },
  localization: {
    language: 'es',
    timezone: 'America/Mexico_City',
  },
};

export const DEFAULT_ACTIVE_MODULES: ActiveModules = {
  corporate_structure: true,
  brand_catalog: true,
  classifications_vigency: true,
  legal_history: true,
  relationships: true,
  contracts: true,
  brand_audit: true,
  user_admin: true,
  tenant_config: true,
  intelligence_dashboard: false,
};

// ─── Validation Helpers ──────────────────────────────────────────────────────

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{ path: string; message: string }>;
}

export function validateTenantConfig(data: unknown): ValidationResult<TenantConfig> {
  const result = TenantConfigSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export function validateActiveModules(data: unknown): ValidationResult<ActiveModules> {
  const result = ActiveModulesSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}
