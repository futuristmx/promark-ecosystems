/**
 * Importer genérico para auditorías de marca (xlsx) IMPI.
 *
 * Uso:
 *   npx tsx scripts/import-audit-xlsx.ts <key> [--apply]
 *
 * Donde <key> es uno de: nancy | dulces | distribuciones
 *
 * Estrategia idempotente:
 *  - Tenant identificado por slug
 *  - Holding/Company por nombre dentro del tenant
 *  - Brand por (tenant_id + application_number)
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env' });
loadEnv({ path: '.env.local', override: true });
if (process.env.DIRECT_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
}

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { ApplicationType, BrandType, LegalStatus } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes('--apply');
const KEY = process.argv.slice(2).find((a) => !a.startsWith('--'));

interface TenantConfig {
  key: string;
  file: string;
  name: string;
  slug: string;
  legal_name: string;
  primary_color: string;
}

const CONFIGS: Record<string, TenantConfig> = {
  nancy: {
    key: 'nancy',
    file: '/Users/valencia/Downloads/Auditoria Nancy Paloma Partida Mayo2026.xlsx',
    name: 'Nancy Paloma Partida Padilla',
    slug: 'nancy-paloma-partida',
    legal_name: 'NANCY PALOMA PARTIDA PADILLA',
    primary_color: '#7A1D3F',
  },
  dulces: {
    key: 'dulces',
    file: '/Users/valencia/Downloads/Auditoria Dulces Salados y de Otros Mayo2026.xlsx',
    name: 'Dulces, Salados y de Otros',
    slug: 'dulces-salados-otros',
    legal_name: 'DULCES, SALADOS Y DE OTROS, S.A. DE C.V.',
    primary_color: '#A8501E',
  },
  distribuciones: {
    key: 'distribuciones',
    file: '/Users/valencia/Downloads/Auditoria Distribuciones a Detalle Mayo2026.xlsx',
    name: 'Distribuciones a Detalle',
    slug: 'distribuciones-a-detalle',
    legal_name: 'DISTRIBUCIONES A DETALLE, S.A. DE C.V.',
    primary_color: '#1F4E5F',
  },
};

function parseDDMMYYYY(s: string | null | undefined): Date | null {
  if (!s) return null;
  const cleaned = String(s).trim();
  if (cleaned === '—' || cleaned === '-' || cleaned === '' || cleaned.startsWith('(')) return null;
  const m = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const d = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  return new Date(`${m[3]}-${mm}-${d}T12:00:00.000Z`);
}

function mapBrandType(s: string): BrandType {
  const u = (s || '').toUpperCase().trim();
  if (u.includes('NOMINATIVA')) return 'WORDMARK';
  if (u.includes('MIXTA')) return 'MIXED';
  if (u.includes('FIGURATIVA') || u.includes('INNOMINADA')) return 'FIGURATIVE';
  if (u.includes('TRIDIMENSIONAL') || u.includes('3D')) return 'THREE_D';
  if (u.includes('AVISO COMERCIAL')) return 'COMMERCIAL_NOTICE';
  if (u.includes('NOMBRE COMERCIAL')) return 'TRADE_NAME';
  return 'WORDMARK';
}

function mapApplicationType(s: string): ApplicationType {
  const u = (s || '').toUpperCase();
  if (u.includes('AVISO COMERCIAL')) return 'COMMERCIAL_NOTICE_REGISTRATION';
  if (u.includes('NOMBRE COMERCIAL')) return 'TRADE_NAME_REGISTRATION';
  if (u.includes('RENOVACION') || u.includes('RENOVACIÓN')) return 'RENEWAL';
  if (u.includes('CESION') || u.includes('CESIÓN')) return 'ASSIGNMENT';
  return 'TRADEMARK_REGISTRATION';
}

function mapLegalStatus(s: string): LegalStatus {
  const u = (s || '').toUpperCase().trim();
  if (u.includes('VIGENTE')) return 'REGISTERED';
  if (u.includes('VENCIDA') || u.includes('EXPIRADA')) return 'EXPIRED';
  if (u.includes('ABANDONADA')) return 'ABANDONED';
  if (u.includes('TRÁMITE') || u.includes('TRAMITE')) return 'IN_PROGRESS';
  if (u.includes('CANCELADA')) return 'CANCELLED';
  if (u.includes('OPOSICION') || u.includes('OPOSICIÓN') || u.includes('OPUESTA')) return 'OPPOSED';
  if (u.includes('LITIGIO')) return 'IN_LITIGATION';
  if (u.includes('SOLICITADA')) return 'APPLIED';
  if (u.includes('PUBLICADA')) return 'PUBLISHED';
  return 'IN_PROGRESS';
}

interface BrandSeed {
  name: string;
  brand_type: BrandType;
  application_type: ApplicationType;
  classes: { class_number: number; class_description: string }[];
  application_number: string;
  registration_number: string | null;
  application_date: string;
  registration_date: string;
  expiration_date: string;
  legal_status: LegalStatus;
  observations: string;
}

function clean(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  if (s === '—' || s === '-' || s.startsWith('(pendiente')) return '';
  return s;
}

function rowsFromSheet(filePath: string): BrandSeed[] {
  const wb = XLSX.readFile(filePath);
  // Prefer "Por Estatus" sheet
  const sheetName = wb.SheetNames.find((n: string) => /Estatus/i.test(n)) ?? wb.SheetNames[0];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    defval: null,
    raw: false,
    header: 1,
  });

  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] ?? [];
    if (r.length > 0 && String(r[0] ?? '').toLowerCase() === 'no') {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) throw new Error('No header row found');
  const headers = (rows[headerIdx] as unknown[]).map((c) => String(c ?? '').trim());

  // Index columns by name (some sheets have Imagen column, some don't)
  const colIdx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const cMarca = colIdx('Marca');
  const cClase = colIdx('Clase');
  const cProtege = colIdx('Protege');
  const cExp = colIdx('Expediente');
  const cReg = colIdx('Registro');
  const cTipoSol = colIdx('Tipo Solicitud');
  const cTipoMarca = colIdx('Tipo Marca');
  const cFechaPres = colIdx('Fecha Presentación');
  const cFechaConc = colIdx('Fecha Concesión');
  const cVigencia = colIdx('Vigencia');
  const cEstatus = colIdx('Estatus');
  const cProxTram = colIdx('Próximo Trámite');

  const brands: BrandSeed[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    if (!r || r.length === 0) continue;
    const first = String(r[0] ?? '').trim();
    // Skip section headers and empty rows
    if (!first || !/^\d+$/.test(first)) continue;

    const name = clean(r[cMarca]);
    const exp = clean(r[cExp]);
    if (!name || !exp) continue;

    const classNum = parseInt(String(r[cClase] ?? '').trim(), 10);
    const protege = clean(r[cProtege]) || 'Sin descripción';

    brands.push({
      name,
      brand_type: mapBrandType(clean(r[cTipoMarca])),
      application_type: mapApplicationType(clean(r[cTipoSol])),
      classes: Number.isFinite(classNum)
        ? [{ class_number: classNum, class_description: protege }]
        : [{ class_number: 0, class_description: protege }],
      application_number: exp,
      registration_number: clean(r[cReg]) || null,
      application_date: clean(r[cFechaPres]),
      registration_date: clean(r[cFechaConc]),
      expiration_date: clean(r[cVigencia]),
      legal_status: mapLegalStatus(clean(r[cEstatus])),
      observations: clean(r[cProxTram]),
    });
  }
  return brands;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  if (!KEY || !CONFIGS[KEY]) {
    console.error('Uso: npx tsx scripts/import-audit-xlsx.ts <nancy|dulces|distribuciones> [--apply]');
    process.exit(1);
  }
  const cfg = CONFIGS[KEY];
  const BRANDS = rowsFromSheet(cfg.file);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  IMPORT — ${cfg.legal_name}`);
  console.log(`  Archivo: ${cfg.file}`);
  console.log(`  Marcas detectadas: ${BRANDS.length}`);
  console.log(`  Modo: ${APPLY ? '⚠️  APPLY' : '🔍 DRY RUN'}`);
  console.log(`${'='.repeat(70)}\n`);

  // 1. Tenant
  let tenantId: string;
  if (APPLY) {
    const t = await prisma.tenant.upsert({
      where: { slug: cfg.slug },
      update: {},
      create: {
        name: cfg.name,
        slug: cfg.slug,
        status: 'ACTIVE',
        language: 'es',
        config: {
          branding: { primary_color: cfg.primary_color, company_display_name: cfg.name, logo_url: null, favicon_url: null },
          notifications: { expiry_alert_days: 90, notify_email: 'mcadena@promark.mx', email_alerts_enabled: false },
          features: { show_brand_history: true, show_contracts: true, show_graph_view: true, show_documents: true, allow_document_download: false },
          localization: { language: 'es', timezone: 'America/Mexico_City' },
          client_alerts: { enabled: false },
        },
        active_modules: {
          corporate_structure: true, brand_catalog: true, classifications_vigency: true,
          legal_history: true, relationships: true, contracts: true, brand_audit: true,
          user_admin: true, tenant_config: true, intelligence_dashboard: false,
        },
      },
    });
    tenantId = t.id;
    console.log(`1. ✓ Tenant: ${tenantId}`);
  } else {
    tenantId = '<dry-run>';
    console.log(`1. ⏸ Tenant ${cfg.slug}`);
  }

  // 2. Holding
  let holdingId: string;
  if (APPLY) {
    const existing = await prisma.holding.findFirst({ where: { tenant_id: tenantId, name: cfg.legal_name } });
    if (existing) holdingId = existing.id;
    else {
      const h = await prisma.holding.create({
        data: { tenant_id: tenantId, name: cfg.legal_name, legal_name: cfg.legal_name, country: 'México', status: 'ACTIVE' },
      });
      holdingId = h.id;
    }
    console.log(`2. ✓ Holding: ${holdingId}`);
  } else {
    holdingId = '<dry-run>';
    console.log(`2. ⏸ Holding ${cfg.legal_name}`);
  }

  // 3. Company
  let companyId: string;
  if (APPLY) {
    const existing = await prisma.company.findFirst({ where: { tenant_id: tenantId, name: cfg.legal_name } });
    if (existing) companyId = existing.id;
    else {
      const c = await prisma.company.create({
        data: {
          tenant_id: tenantId, holding_id: holdingId,
          name: cfg.legal_name, legal_name: cfg.legal_name,
          company_type: 'PARENT', country: 'México', status: 'ACTIVE',
        },
      });
      companyId = c.id;
    }
    console.log(`3. ✓ Company: ${companyId}`);
  } else {
    companyId = '<dry-run>';
    console.log(`3. ⏸ Company ${cfg.legal_name}`);
  }

  // 4. Brands
  console.log(`\n4. Marcas (${BRANDS.length}):`);
  let created = 0, updated = 0;
  for (const [idx, b] of BRANDS.entries()) {
    const n = (idx + 1).toString().padStart(2);
    console.log(`   [${n}/${BRANDS.length}] ${b.name} · cl.${b.classes[0].class_number} · ${b.legal_status} · exp ${b.application_number}`);
    if (!APPLY) continue;

    const existing = await prisma.brand.findFirst({
      where: { tenant_id: tenantId, application_number: b.application_number },
    });

    const data = {
      name: b.name,
      slug: slugify(b.name) + '-' + b.application_number,
      brand_type: b.brand_type,
      legal_status: b.legal_status,
      application_type: b.application_type,
      registration_number: b.registration_number ?? undefined,
      application_number: b.application_number,
      application_date: parseDDMMYYYY(b.application_date) ?? undefined,
      registration_date: parseDDMMYYYY(b.registration_date) ?? undefined,
      expiration_date: parseDDMMYYYY(b.expiration_date) ?? undefined,
      country: 'México',
      observations: b.observations || undefined,
    };

    if (existing) {
      await prisma.brand.update({ where: { id: existing.id }, data });
      await prisma.brandClass.deleteMany({ where: { brand_id: existing.id } });
      await prisma.brandClass.createMany({
        data: b.classes.map((c) => ({
          brand_id: existing.id,
          class_number: c.class_number,
          class_description: c.class_description,
        })),
      });
      updated++;
    } else {
      const newB = await prisma.brand.create({ data: { tenant_id: tenantId, company_id: companyId, ...data } });
      await prisma.brandClass.createMany({
        data: b.classes.map((c) => ({
          brand_id: newB.id,
          class_number: c.class_number,
          class_description: c.class_description,
        })),
      });
      created++;
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  if (APPLY) console.log(`✓ COMPLETADO. Brands creadas: ${created}, actualizadas: ${updated}.`);
  else console.log(`⏸ DRY RUN — para aplicar agregar --apply`);
  console.log(`${'='.repeat(70)}\n`);
}

main()
  .catch((err) => { console.error('ERROR:', err); process.exit(1); })
  .finally(() => prisma.$disconnect().then(() => pool.end()));
