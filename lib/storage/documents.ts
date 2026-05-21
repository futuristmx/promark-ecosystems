import { randomUUID } from 'crypto';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase/admin';

export const MAX_FILE_SIZE = 52_428_800; // 50 MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export type EntityType = 'BRAND' | 'COMPANY' | 'CONTRACT';

export interface UploadParams {
  tenantId: string;
  entityType: EntityType;
  entityId: string;
  file: File;
}

export interface UploadResult {
  storage_path: string;
  storage_url: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
}

function entityFolder(entityType: EntityType): string {
  return entityType.toLowerCase() + 's';
}

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 200);
}

export function buildStoragePath(
  tenantId: string,
  entityType: EntityType,
  entityId: string,
  fileName: string
): string {
  const uuid = randomUUID();
  const safeName = sanitizeFilename(fileName);
  return `${tenantId}/${entityFolder(entityType)}/${entityId}/${uuid}-${safeName}`;
}

export async function uploadDocument(
  params: UploadParams
): Promise<UploadResult> {
  const { tenantId, entityType, entityId, file } = params;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE} bytes`);
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  const supabase = getSupabaseAdmin();
  const storagePath = buildStoragePath(tenantId, entityType, entityId, file.name);

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return {
    storage_path: storagePath,
    storage_url: null,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
  };
}

/**
 * Generate a signed URL valid for the given duration (default 1 hour).
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown'}`);
  }

  return data.signedUrl;
}
