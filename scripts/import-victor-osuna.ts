/**
 * Importa los datos reales de Victor Manuel Osuna Mendoza al sistema.
 *
 * Fuente: /Users/valencia/Downloads/Auditoria Victor Manuel Osuna Mayo2026.xlsx
 *
 * Uso:
 *   npx tsx scripts/import-victor-osuna.ts          → DRY RUN (no escribe en BD)
 *   npx tsx scripts/import-victor-osuna.ts --apply  → ejecuta el import real
 *
 * Estrategia idempotente:
 *  - Tenant identificado por slug
 *  - Holding/Company por nombre dentro del tenant
 *  - Brand por (tenant_id + application_number) — el "Expediente" es único
 */
// Carga .env y fuerza DATABASE_URL al session pooler (script local, no serverless)
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

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes('--apply');

interface BrandSeed {
  no: number;
  name: string;
  brand_type: BrandType;
  application_type: ApplicationType;
  classes: { class_number: number; class_description: string }[];
  application_number: string;       // Expediente
  registration_number: string | null;
  application_date: string;         // dd/mm/yyyy
  registration_date: string;
  expiration_date: string;
  legal_status: LegalStatus;
  observations: string;
}

// Helper: convierte dd/mm/yyyy a Date
function parseDDMMYYYY(s: string): Date | null {
  if (!s || s === '—') return null;
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00.000Z`);
}

// Datos extraídos del Excel (13 marcas)
const TENANT = {
  name: 'Victor Manuel Osuna Mendoza',
  slug: 'victor-osuna',
  legal_name: 'VICTOR MANUEL OSUNA MENDOZA',
};

const BRANDS: BrandSeed[] = [
  // Vigentes
  {
    no: 1, name: 'QUINTA OSUNEÑA', brand_type: 'WORDMARK', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 33, class_description: 'BEBIDAS ALCOHÓLICAS EXCEPTO CERVEZAS.' }],
    application_number: '2777155', registration_number: '2472847',
    application_date: '01/07/2022', registration_date: '09/11/2022', expiration_date: '09/11/2032',
    legal_status: 'REGISTERED',
    observations: 'MARCA REGISTRADA Y VIGENTE. Declaración de Uso localizada — presentada el 17/12/2025.',
  },
  {
    no: 2, name: 'A-LIVE', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 32, class_description: 'BEBIDAS ENERGÉTICAS.' }],
    application_number: '2552863', registration_number: '2282757',
    application_date: '24/05/2021', registration_date: '05/08/2021', expiration_date: '05/08/2031',
    legal_status: 'REGISTERED',
    observations: 'MARCA REGISTRADA Y VIGENTE. Declaración de Uso localizada — presentada el 12/09/2024.',
  },
  {
    no: 3, name: 'BASTIMENTO', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 29, class_description: 'CARNE, PESCADO, CARNE DE AVE Y CAZA; EXTRACTOS DE CARNE; FRUTAS Y VERDURAS EN CONSERVA; JALEAS, CONFITURAS; HUEVOS; LECHE Y PRODUCTOS LÁCTEOS; ACEITES Y GRASAS COMESTIBLES.' }],
    application_number: '1840737', registration_number: '1744023',
    application_date: '11/01/2017', registration_date: '18/04/2017', expiration_date: '11/01/2027',
    legal_status: 'REGISTERED',
    observations: 'MARCA REGISTRADA Y VIGENTE. Declaración de Uso no aplica por fecha de concesión anterior al régimen vigente. Próximo hito: RENOVACIÓN AL VENCIMIENTO EN ENERO 2027 — acción requerida.',
  },
  {
    no: 4, name: 'SF SUPER FRIJOLES', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 29, class_description: 'CARNE, PESCADO, CARNE DE AVE Y CAZA; EXTRACTOS DE CARNE; FRUTAS Y VERDURAS EN CONSERVA; JALEAS, CONFITURAS; HUEVOS; LECHE Y PRODUCTOS LÁCTEOS; ACEITES Y GRASAS COMESTIBLES.' }],
    application_number: '1840736', registration_number: '1744022',
    application_date: '11/01/2017', registration_date: '18/04/2017', expiration_date: '11/01/2027',
    legal_status: 'REGISTERED',
    observations: 'MARCA REGISTRADA Y VIGENTE. Declaración de Uso no aplica por fecha de concesión anterior al régimen vigente. Próximo hito: RENOVACIÓN AL VENCIMIENTO EN ENERO 2027 — acción requerida.',
  },
  {
    no: 5, name: 'BOTANICE', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 29, class_description: 'CARNE, PESCADO, CARNE DE AVE Y CAZA; EXTRACTOS DE CARNE; FRUTAS Y VERDURAS EN CONSERVA; JALEAS, CONFITURAS; HUEVOS; LECHE Y PRODUCTOS LÁCTEOS; ACEITES Y GRASAS COMESTIBLES.' }],
    application_number: '1840735', registration_number: '1744021',
    application_date: '11/01/2017', registration_date: '18/04/2017', expiration_date: '11/01/2027',
    legal_status: 'REGISTERED',
    observations: 'MARCA REGISTRADA Y VIGENTE. Declaración de Uso no aplica por fecha de concesión anterior al régimen vigente. Próximo hito: RENOVACIÓN AL VENCIMIENTO EN ENERO 2027 — acción requerida.',
  },
  {
    no: 6, name: 'KROKIS', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 31, class_description: 'ALIMENTOS PARA ANIMALES; BEBIDAS PARA ANIMALES DE COMPAÑÍA; FORRAJES; LEVADURAS; RESIDUOS DE DESTILERÍA PARA ALIMENTACIÓN ANIMAL; SUBPRODUCTOS DE CEREALES PARA ALIMENTACIÓN ANIMAL.' }],
    application_number: '1840734', registration_number: '1744020',
    application_date: '11/01/2017', registration_date: '18/04/2017', expiration_date: '11/01/2027',
    legal_status: 'REGISTERED',
    observations: 'MARCA REGISTRADA Y VIGENTE. Declaración de Uso no aplica por fecha de concesión anterior al régimen vigente. Próximo hito: RENOVACIÓN AL VENCIMIENTO EN ENERO 2027 — acción requerida.',
  },
  {
    no: 7, name: 'BOTANICE', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 30, class_description: 'PASTAS ALIMENTICIAS; CONFITERÍA A BASE DE ALMENDRA Y CACAHUATE; CEREALES Y DERIVADOS; PALOMITAS DE MAÍZ; HARINAS Y PREPARACIONES A BASE DE CEREALES; SALSAS (CONDIMENTOS).' }],
    application_number: '1840733', registration_number: '1744019',
    application_date: '11/01/2017', registration_date: '18/04/2017', expiration_date: '11/01/2027',
    legal_status: 'REGISTERED',
    observations: 'MARCA REGISTRADA Y VIGENTE. Declaración de Uso no aplica por fecha de concesión anterior al régimen vigente. Próximo hito: RENOVACIÓN AL VENCIMIENTO EN ENERO 2027 — acción requerida.',
  },
  // Abandonadas
  {
    no: 8, name: 'YOZOKO', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 30, class_description: 'BEBIDAS CON UNA BASE DE TÉ; BEBIDAS A BASE DE TÉ (NO MEDICINALES).' }],
    application_number: '2660010', registration_number: '2366932',
    application_date: '07/12/2021', registration_date: '08/03/2022', expiration_date: '08/03/2032',
    legal_status: 'ABANDONED',
    observations: 'ABANDONADA POR FALTA DE DECLARACIÓN DE USO. Fecha límite: 08/03/2025. No se localiza Declaración de Uso en el historial de trámites. El registro se considera cancelado. Se recomienda presentar nueva solicitud de registro a la brevedad.',
  },
  {
    no: 9, name: 'PERLA DEL PACIFICO', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 29, class_description: 'FRUTAS Y VERDURAS, HORTALIZAS Y LEGUMBRES EN CONSERVA, CONGELADAS, SECAS Y COCIDAS.' }],
    application_number: '2555648', registration_number: '2286518',
    application_date: '28/05/2021', registration_date: '13/08/2021', expiration_date: '13/08/2031',
    legal_status: 'ABANDONED',
    observations: 'ABANDONADA POR FALTA DE DECLARACIÓN DE USO. Fecha límite: 13/08/2024. No se localiza Declaración de Uso en el historial de trámites. El registro se considera cancelado. Se recomienda presentar nueva solicitud de registro a la brevedad.',
  },
  {
    no: 10, name: 'PERLA DEL PACIFICO', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 30, class_description: 'ARROZ; MAÍZ PREPARADO PARA HACER PALOMITAS; MAÍZ TOSTADO (PALOMITAS DE MAÍZ).' }],
    application_number: '2555644', registration_number: '2286516',
    application_date: '28/05/2021', registration_date: '13/08/2021', expiration_date: '13/08/2031',
    legal_status: 'ABANDONED',
    observations: 'ABANDONADA POR FALTA DE DECLARACIÓN DE USO. Fecha límite: 13/08/2024. No se localiza Declaración de Uso en el historial de trámites. El registro se considera cancelado. Se recomienda presentar nueva solicitud de registro a la brevedad.',
  },
  {
    no: 11, name: 'GLADY', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 3, class_description: 'GELES PARA EL CABELLO; GELES PARA FIJAR EL CABELLO.' }],
    application_number: '2551535', registration_number: '2286158',
    application_date: '21/05/2021', registration_date: '13/08/2021', expiration_date: '13/08/2031',
    legal_status: 'ABANDONED',
    observations: 'ABANDONADA POR FALTA DE DECLARACIÓN DE USO. Fecha límite: 13/08/2024. No se localiza Declaración de Uso en el historial de trámites. El registro se considera cancelado. Se recomienda presentar nueva solicitud de registro a la brevedad.',
  },
  {
    no: 12, name: 'GMEN', brand_type: 'MIXED', application_type: 'TRADEMARK_REGISTRATION',
    classes: [{ class_number: 3, class_description: 'GELES PARA EL CABELLO; GELES PARA FIJAR EL CABELLO.' }],
    application_number: '2544208', registration_number: '2283658',
    application_date: '10/05/2021', registration_date: '09/08/2021', expiration_date: '09/08/2031',
    legal_status: 'ABANDONED',
    observations: 'ABANDONADA POR FALTA DE DECLARACIÓN DE USO. Fecha límite: 09/08/2024. No se localiza Declaración de Uso en el historial de trámites. El registro se considera cancelado. Nota: en historial aparece oposición presentada el 10/06/2021, marca concedida a pesar de ello. Se recomienda presentar nueva solicitud de registro a la brevedad.',
  },
  {
    no: 13, name: 'YOSOKO, UNA BEBIDA PARA TODOS', brand_type: 'WORDMARK', application_type: 'COMMERCIAL_NOTICE_REGISTRATION',
    classes: [{ class_number: 30, class_description: 'BEBIDAS A BASE DE TÉ (NO MEDICINALES); BEBIDAS A BASE DE TÉ.' }],
    application_number: '137475', registration_number: '123844',
    application_date: '07/12/2021', registration_date: '16/03/2022', expiration_date: '16/03/2032',
    legal_status: 'ABANDONED',
    observations: 'ABANDONADO POR FALTA DE DECLARACIÓN DE USO. Fecha límite: 16/03/2025. No se localiza Declaración de Uso en el historial de trámites. El aviso comercial se considera cancelado. Se recomienda presentar nueva solicitud de registro a la brevedad.',
  },
];

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  IMPORT — ${TENANT.legal_name}`);
  console.log(`  Modo: ${APPLY ? '⚠️  APPLY (escribirá en BD)' : '🔍 DRY RUN'}`);
  console.log(`${'='.repeat(70)}\n`);

  // 1. Tenant
  console.log(`1. Tenant: ${TENANT.name} (slug: ${TENANT.slug})`);
  let tenantId: string;
  if (APPLY) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: TENANT.slug },
      update: {},
      create: {
        name: TENANT.name,
        slug: TENANT.slug,
        status: 'ACTIVE',
        language: 'es',
        config: {
          branding: { primary_color: '#0F2E3D', company_display_name: TENANT.name, logo_url: null, favicon_url: null },
          notifications: { expiry_alert_days: 90, notify_email: null, email_alerts_enabled: false },
          features: { show_brand_history: true, show_contracts: true, show_graph_view: true, show_documents: true, allow_document_download: false },
          localization: { language: 'es', timezone: 'America/Mexico_City' },
          client_alerts: { enabled: true },
        },
        active_modules: {
          corporate_structure: true, brand_catalog: true, classifications_vigency: true,
          legal_history: true, relationships: true, contracts: true, brand_audit: true,
          user_admin: true, tenant_config: true, intelligence_dashboard: false,
        },
      },
    });
    tenantId = tenant.id;
    console.log(`   ✓ Tenant id: ${tenantId}\n`);
  } else {
    tenantId = '<dry-run-tenant-id>';
    console.log(`   ⏸ Sería creado (slug ${TENANT.slug})\n`);
  }

  // 2. Holding (persona física → un solo holding con su nombre)
  console.log(`2. Holding: "${TENANT.legal_name}"`);
  let holdingId: string;
  if (APPLY) {
    const existing = await prisma.holding.findFirst({
      where: { tenant_id: tenantId, name: TENANT.legal_name },
    });
    if (existing) {
      holdingId = existing.id;
      console.log(`   ✓ Holding ya existía: ${holdingId}\n`);
    } else {
      const h = await prisma.holding.create({
        data: { tenant_id: tenantId, name: TENANT.legal_name, legal_name: TENANT.legal_name, country: 'México', status: 'ACTIVE' },
      });
      holdingId = h.id;
      console.log(`   ✓ Holding creado: ${holdingId}\n`);
    }
  } else {
    holdingId = '<dry-run-holding-id>';
    console.log(`   ⏸ Sería creado\n`);
  }

  // 3. Company (persona física como PARENT)
  console.log(`3. Company: "${TENANT.legal_name}" (PARENT, persona física)`);
  let companyId: string;
  if (APPLY) {
    const existing = await prisma.company.findFirst({
      where: { tenant_id: tenantId, name: TENANT.legal_name },
    });
    if (existing) {
      companyId = existing.id;
      console.log(`   ✓ Company ya existía: ${companyId}\n`);
    } else {
      const c = await prisma.company.create({
        data: {
          tenant_id: tenantId,
          holding_id: holdingId,
          name: TENANT.legal_name,
          legal_name: TENANT.legal_name,
          company_type: 'PARENT',
          country: 'México',
          status: 'ACTIVE',
        },
      });
      companyId = c.id;
      console.log(`   ✓ Company creada: ${companyId}\n`);
    }
  } else {
    companyId = '<dry-run-company-id>';
    console.log(`   ⏸ Sería creada\n`);
  }

  // 4. Brands
  console.log(`4. Brands: ${BRANDS.length} marcas`);
  let created = 0;
  let updated = 0;
  for (const b of BRANDS) {
    const action = APPLY ? '' : ' ⏸';
    console.log(`   [${b.no.toString().padStart(2)}/${BRANDS.length}]${action} ${b.name} · clase ${b.classes[0].class_number} · ${b.legal_status} · exp ${b.application_number}`);

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
      observations: b.observations,
    };

    if (existing) {
      await prisma.brand.update({ where: { id: existing.id }, data });
      // sync classes
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
      const newBrand = await prisma.brand.create({
        data: { tenant_id: tenantId, company_id: companyId, ...data },
      });
      await prisma.brandClass.createMany({
        data: b.classes.map((c) => ({
          brand_id: newBrand.id,
          class_number: c.class_number,
          class_description: c.class_description,
        })),
      });
      created++;
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  if (APPLY) {
    console.log(`✓ Import completado. Brands creadas: ${created}, actualizadas: ${updated}.`);
  } else {
    console.log(`⏸ DRY RUN completado. Para aplicar: npx tsx scripts/import-victor-osuna.ts --apply`);
  }
  console.log(`${'='.repeat(70)}\n`);
}

main()
  .catch((err) => { console.error('ERROR:', err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
