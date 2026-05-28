import { z } from 'zod/v4';
import {
  LegalStatus,
  BrandType,
  ApplicationType,
  CompanyType,
  HoldingStatus,
  HolderType,
} from '@prisma/client';

// ─── Holding Schemas ────────────────────────────────────────────────────────

export const createHoldingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  legal_name: z.string().min(1, 'Legal name is required').max(255),
  rfc: z.string().max(13).optional().nullable(),
  country: z.string().max(100).optional(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(HoldingStatus).optional(),
});

export const updateHoldingSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  legal_name: z.string().min(1).max(255).optional(),
  rfc: z.string().max(13).optional().nullable(),
  country: z.string().max(100).optional(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(HoldingStatus).optional(),
});

export type CreateHoldingInput = z.infer<typeof createHoldingSchema>;
export type UpdateHoldingInput = z.infer<typeof updateHoldingSchema>;

// ─── Company Schemas ────────────────────────────────────────────────────────

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  legal_name: z.string().min(1, 'Legal name is required').max(255),
  rfc: z.string().max(13).optional().nullable(),
  company_type: z.nativeEnum(CompanyType),
  holding_id: z.string().min(1, 'Holding ID is required'),
  parent_company_id: z.string().optional().nullable(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  legal_name: z.string().min(1).max(255).optional(),
  rfc: z.string().max(13).optional().nullable(),
  company_type: z.nativeEnum(CompanyType).optional(),
  holding_id: z.string().optional(),
  parent_company_id: z.string().optional().nullable(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// ─── Brand Schemas ──────────────────────────────────────────────────────────

export const brandClassSchema = z.object({
  class_number: z.number().int().min(1).max(45),
  class_description: z.string().max(1000).optional().nullable(),
  specification: z.string().max(2000).optional().nullable(),
});

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(255),
  registration_number: z.string().max(100).optional().nullable(),
  application_number: z.string().max(100).optional().nullable(),
  application_date: z.coerce.date().optional().nullable(),
  registration_date: z.coerce.date().optional().nullable(),
  expiration_date: z.coerce.date().optional().nullable(),
  renewal_date: z.coerce.date().optional().nullable(),
  use_declaration_date: z.coerce.date().optional().nullable(),
  legal_status: z.nativeEnum(LegalStatus).optional(),
  brand_type: z.nativeEnum(BrandType).optional(),
  application_type: z.nativeEnum(ApplicationType).optional().nullable(),
  country: z.string().max(80).optional(),
  observations: z.string().max(8000).optional().nullable(),
  company_id: z.string().min(1, 'Company ID is required'),
  description: z.string().max(2000).optional().nullable(),
  disclaimers: z.string().max(2000).optional().nullable(),
  classes: z.array(brandClassSchema).optional(),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  registration_number: z.string().max(100).optional().nullable(),
  application_number: z.string().max(100).optional().nullable(),
  application_date: z.coerce.date().optional().nullable(),
  registration_date: z.coerce.date().optional().nullable(),
  expiration_date: z.coerce.date().optional().nullable(),
  renewal_date: z.coerce.date().optional().nullable(),
  use_declaration_date: z.coerce.date().optional().nullable(),
  legal_status: z.nativeEnum(LegalStatus).optional(),
  brand_type: z.nativeEnum(BrandType).optional(),
  application_type: z.nativeEnum(ApplicationType).optional().nullable(),
  country: z.string().max(80).optional(),
  observations: z.string().max(8000).optional().nullable(),
  company_id: z.string().optional(),
  description: z.string().max(2000).optional().nullable(),
  disclaimers: z.string().max(2000).optional().nullable(),
  classes: z.array(brandClassSchema).optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type BrandClassInput = z.infer<typeof brandClassSchema>;

// ─── Holder Schemas ─────────────────────────────────────────────────────────

export const createHolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  holder_type: z.nativeEnum(HolderType),
  rfc: z.string().max(13).optional().nullable(),
  curp: z.string().max(18).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  address: z.record(z.string(), z.unknown()).optional().nullable(),
  contact_info: z.record(z.string(), z.unknown()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateHolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  holder_type: z.nativeEnum(HolderType).optional(),
  rfc: z.string().max(13).optional().nullable(),
  curp: z.string().max(18).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  address: z.record(z.string(), z.unknown()).optional().nullable(),
  contact_info: z.record(z.string(), z.unknown()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateHolderInput = z.infer<typeof createHolderSchema>;
export type UpdateHolderInput = z.infer<typeof updateHolderSchema>;

// ─── Validation Helper ──────────────────────────────────────────────────────

export interface ZodValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{ path: string; message: string }>;
}

export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): ZodValidationResult<T> {
  const result = schema.safeParse(data);

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
