import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hash } from 'bcryptjs';

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Promark® database...');

  // ─── 0. Clean test data (idempotent re-seed) ──────
  // Note: Tenants, UserPromark, UserClient remain (upserted).
  // Holdings/Brands/Holders use create() so we wipe them first.
  await prisma.alert.deleteMany({});
  await prisma.alertRule.deleteMany({});
  await prisma.userClientHolder.deleteMany({});
  await prisma.brandHolder.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.brandHistory.deleteMany({});
  await prisma.brandClass.deleteMany({});
  await prisma.brandRelationship.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.holder.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.holding.deleteMany({});
  console.log('🧹 Cleared test data');

  // ─── 1. Promark Superadmin ─────────────────────────
  const superadmin = await prisma.userPromark.upsert({
    where: { email: 'mcadena@promark.mx' },
    update: {},
    create: {
      email: 'mcadena@promark.mx',
      full_name: 'M. Cadena',
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      supabase_auth_id: '55fde3a5-da36-4112-86f5-f61fb9a52dae',
    },
  });
  console.log('✅ Superadmin created:', superadmin.email);

  // ─── 2. Tenants ────────────────────────────────────
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'grupo-test-norte' },
    update: {},
    create: {
      name: 'Grupo Test Norte S.A. de C.V.',
      slug: 'grupo-test-norte',
      status: 'ACTIVE',
      config: {
        branding: {
          logo_url: null,
          primary_color: '#1E3A5F',
          company_display_name: 'Grupo Test Norte',
          favicon_url: null,
        },
        features: {
          show_brand_history: true,
          show_contracts: true,
          show_graph_view: true,
          show_documents: true,
          allow_document_download: false,
        },
        notifications: { expiry_alert_days: 90, notify_email: null },
        localization: { language: 'es', timezone: 'America/Mexico_City' },
      },
      active_modules: {
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
      },
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'alimentos-demo-sa' },
    update: {},
    create: {
      name: 'Alimentos Demo S.A.',
      slug: 'alimentos-demo-sa',
      status: 'ACTIVE',
      config: {
        branding: {
          logo_url: null,
          primary_color: '#8B5CF6',
          company_display_name: 'Alimentos Demo',
          favicon_url: null,
        },
        features: {
          show_brand_history: true,
          show_contracts: false,
          show_graph_view: true,
          show_documents: true,
          allow_document_download: true,
        },
        notifications: { expiry_alert_days: 60, notify_email: 'legal@alimentosdemo.mx' },
        localization: { language: 'es', timezone: 'America/Mexico_City' },
      },
      active_modules: {
        corporate_structure: true,
        brand_catalog: true,
        classifications_vigency: true,
        legal_history: true,
        relationships: false,
        contracts: false,
        brand_audit: true,
        user_admin: true,
        tenant_config: true,
        intelligence_dashboard: false,
      },
    },
  });

  console.log('✅ Tenants created:', tenant1.slug, tenant2.slug);

  // ─── 3. Client Users ───────────────────────────────
  const pinHash = await hash('123456', 12);

  for (const tenant of [tenant1, tenant2]) {
    const prefix = tenant.slug === 'grupo-test-norte' ? 'GTN' : 'ADS';

    await prisma.userClient.upsert({
      where: { card_id: `${prefix}-001` },
      update: {},
      create: {
        tenant_id: tenant.id,
        full_name: `Admin ${tenant.name.split(' ')[0]}`,
        email: `admin@${tenant.slug.replace(/-/g, '')}.mx`,
        pin_hash: pinHash,
        pin_generated_at: new Date(),
        card_id: `${prefix}-001`,
        role: 'CLIENT_ADMIN',
        status: 'ACTIVE',
      },
    });

    await prisma.userClient.upsert({
      where: { card_id: `${prefix}-002` },
      update: {},
      create: {
        tenant_id: tenant.id,
        full_name: `Visor ${tenant.name.split(' ')[0]}`,
        email: `viewer@${tenant.slug.replace(/-/g, '')}.mx`,
        pin_hash: pinHash,
        pin_generated_at: new Date(),
        card_id: `${prefix}-002`,
        role: 'CLIENT_VIEWER',
        status: 'ACTIVE',
      },
    });

    // LEGAL_REP user
    await prisma.userClient.upsert({
      where: { card_id: `${prefix}-003` },
      update: {},
      create: {
        tenant_id: tenant.id,
        full_name: `Legal Rep ${tenant.name.split(' ')[0]}`,
        email: `legalrep@${tenant.slug.replace(/-/g, '')}.mx`,
        pin_hash: pinHash,
        pin_generated_at: new Date(),
        card_id: `${prefix}-003`,
        role: 'CLIENT_LEGAL_REP',
        status: 'ACTIVE',
      },
    });
  }

  console.log('✅ Client users created (PIN: 123456 for all)');

  // ─── 4. Holdings + Companies + Brands ──────────────
  for (const tenant of [tenant1, tenant2]) {
    const isT1 = tenant.slug === 'grupo-test-norte';

    const holding = await prisma.holding.create({
      data: {
        tenant_id: tenant.id,
        name: isT1 ? 'Holding Norte' : 'Holding Alimentos',
        legal_name: isT1 ? 'Holding Norte S.A. de C.V.' : 'Holding Alimentos S.A. de C.V.',
        rfc: isT1 ? 'HNO850101XX1' : 'HAL900515YY2',
        status: 'ACTIVE',
      },
    });

    const parentCo = await prisma.company.create({
      data: {
        tenant_id: tenant.id,
        holding_id: holding.id,
        name: isT1 ? 'Distribuidora Norte' : 'Alimentos Premium',
        legal_name: isT1 ? 'Distribuidora Norte S.A. de C.V.' : 'Alimentos Premium S.A. de C.V.',
        rfc: isT1 ? 'DNO860315AA1' : 'APR910720BB2',
        company_type: 'PARENT',
        status: 'ACTIVE',
      },
    });

    const subsidiary = await prisma.company.create({
      data: {
        tenant_id: tenant.id,
        holding_id: holding.id,
        parent_company_id: parentCo.id,
        name: isT1 ? 'Logística Norte Express' : 'Sabores del Campo',
        legal_name: isT1 ? 'Logística Norte Express S.A. de C.V.' : 'Sabores del Campo S.A. de C.V.',
        rfc: isT1 ? 'LNE870620CC3' : 'SDC921130DD4',
        company_type: 'SUBSIDIARY',
        status: 'ACTIVE',
      },
    });

    const brandNames = isT1
      ? ['NortExpress', 'VíaNorte', 'Norte Digital', 'ArcticPack', 'NordLine']
      : ['SaborReal', 'CampoPuro', 'Del Huerto', 'NutriFresh', 'GranoCero'];

    const statuses = ['REGISTERED', 'REGISTERED', 'APPLIED', 'RENEWED', 'REGISTERED'] as const;
    const types = ['WORDMARK', 'MIXED', 'FIGURATIVE', 'WORDMARK', 'MIXED'] as const;

    // For grupo-test-norte, the first 3 brands get test expiration dates
    // that trigger the alert detector (15 days, 45 days, expired yesterday).
    const now = new Date();
    const in15Days = new Date(now);
    in15Days.setDate(in15Days.getDate() + 15);
    const in45Days = new Date(now);
    in45Days.setDate(in45Days.getDate() + 45);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const alertTestExpirations = isT1
      ? [in15Days, in45Days, yesterday, null, null]
      : [null, null, null, null, null];

    for (let i = 0; i < 5; i++) {
      const company = i < 3 ? parentCo : subsidiary;
      const testExpiry = alertTestExpirations[i];
      await prisma.brand.create({
        data: {
          tenant_id: tenant.id,
          company_id: company.id,
          name: brandNames[i],
          slug: brandNames[i].toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, c => ({á:'a',é:'e',í:'i',ó:'o',ú:'u'}[c] || c)),
          legal_status: statuses[i],
          brand_type: types[i],
          registration_number: statuses[i] !== 'APPLIED' ? `MX-${isT1 ? 'N' : 'A'}${String(i+1).padStart(4, '0')}` : null,
          application_date: new Date(2024, i, 15),
          registration_date: statuses[i] !== 'APPLIED' ? new Date(2024, i + 3, 1) : null,
          expiration_date:
            testExpiry ??
            (statuses[i] !== 'APPLIED' ? new Date(2034, i + 3, 1) : null),
        },
      });
    }
  }

  console.log('✅ Holdings, Companies, and Brands created');

  // ─── 4b. Holders + BrandHolder + UserClientHolder ──
  for (const tenant of [tenant1, tenant2]) {
    const isT1 = tenant.slug === 'grupo-test-norte';
    const prefix = isT1 ? 'GTN' : 'ADS';

    // Create a holder (representative)
    const holder = await prisma.holder.create({
      data: {
        tenant_id: tenant.id,
        holder_type: 'INDIVIDUAL',
        name: isT1 ? 'Lic. Roberto Garza' : 'Lic. María López',
        rfc: isT1 ? 'GARO800101XX1' : 'LOMA850515YY2',
        nationality: 'Mexicana',
        status: 'ACTIVE',
        contact_info: {
          email: isT1 ? 'rgarza@despacho.mx' : 'mlopez@despacho.mx',
          phone: isT1 ? '+52 81 1234 5678' : '+52 55 9876 5432',
        },
      },
    });

    // Get the first 3 brands of this tenant to link to the holder
    const tenantBrands = await prisma.brand.findMany({
      where: { tenant_id: tenant.id },
      take: 3,
      orderBy: { name: 'asc' },
    });

    for (const brand of tenantBrands) {
      await prisma.brandHolder.create({
        data: {
          brand_id: brand.id,
          holder_id: holder.id,
          role: 'LEGAL_REPRESENTATIVE',
        },
      });
    }

    // Link the LEGAL_REP user to this holder
    const legalRepUser = await prisma.userClient.findUnique({
      where: { card_id: `${prefix}-003` },
    });

    if (legalRepUser) {
      await prisma.userClientHolder.create({
        data: {
          user_client_id: legalRepUser.id,
          holder_id: holder.id,
          tenant_id: tenant.id,
          assigned_by: superadmin.id,
        },
      });
    }
  }

  console.log('✅ Holders, BrandHolders, and UserClientHolder assignments created');

  // ─── 4c. Default Alert Rules per tenant ─────────────
  const defaultAlertRules = [
    { name: 'Marca por vencer — 90 días',     entity_type: 'BRAND',    trigger_days: 90 },
    { name: 'Marca por vencer — 30 días',     entity_type: 'BRAND',    trigger_days: 30 },
    { name: 'Marca vencida',                  entity_type: 'BRAND',    trigger_days: 0  },
    { name: 'Documento por vencer — 30 días', entity_type: 'DOCUMENT', trigger_days: 30 },
    { name: 'Documento vencido',              entity_type: 'DOCUMENT', trigger_days: 0  },
  ];

  for (const tenant of [tenant1, tenant2]) {
    const existing = await prisma.alertRule.count({ where: { tenant_id: tenant.id } });
    if (existing === 0) {
      for (const rule of defaultAlertRules) {
        await prisma.alertRule.create({
          data: {
            tenant_id: tenant.id,
            name: rule.name,
            entity_type: rule.entity_type,
            trigger_days: rule.trigger_days,
            is_active: true,
            notify_email: true,
            notify_in_app: true,
          },
        });
      }
    }
  }
  console.log('✅ Alert rules created');

  // ─── 4d. Sample Document with future expiry ─────────
  // Attach a document record to the first brand of grupo-test-norte
  // pointing at a non-existent storage path (acceptable for dev seed —
  // the file isn't actually uploaded). The detector picks it up because
  // expires_at falls into the 30-day window.
  const firstBrand = await prisma.brand.findFirst({
    where: { tenant_id: tenant1.id },
    orderBy: { name: 'asc' },
  });
  if (firstBrand) {
    const existingDoc = await prisma.document.findFirst({
      where: { tenant_id: tenant1.id, entity_id: firstBrand.id },
    });
    if (!existingDoc) {
      const in20Days = new Date();
      in20Days.setDate(in20Days.getDate() + 20);
      await prisma.document.create({
        data: {
          tenant_id: tenant1.id,
          entity_type: 'BRAND',
          entity_id: firstBrand.id,
          file_name: 'certificado-seed.pdf',
          file_type: 'application/pdf',
          file_size: 102400,
          storage_path: `${tenant1.id}/brands/${firstBrand.id}/seed-certificado.pdf`,
          description: 'Documento de prueba seed — vence en 20 días',
          uploaded_by: superadmin.id,
          expires_at: in20Days,
          version_number: 1,
          is_latest_version: true,
        },
      });
    }
  }
  console.log('✅ Sample document seeded');

  // ─── 5. Role Permissions ────────────────────────────
  // Define all modules
  const modules = [
    'corporate_structure', 'brand_catalog', 'classifications_vigency',
    'legal_history', 'relationships', 'contracts', 'brand_audit',
    'user_admin', 'tenant_config', 'intelligence_dashboard', 'documents',
  ];
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'PUSH'] as const;

  // Promark roles
  const promarkPermissions: Record<string, Record<string, boolean>> = {
    SUPERADMIN: {}, // all true
    LAWYER: {
      tenant_config: false, // no config access
      user_admin: false,    // no user admin
    },
    BRAND_ANALYST: {
      contracts: false,     // read only (set individually below)
      tenant_config: false,
      user_admin: false,
    },
    ASSISTANT: {
      // mostly read-only
    },
  };

  for (const role of Object.keys(promarkPermissions)) {
    for (const mod of modules) {
      for (const action of actions) {
        let allowed = true;

        if (role === 'SUPERADMIN') {
          allowed = true;
        } else if (role === 'LAWYER') {
          if (['tenant_config', 'user_admin'].includes(mod)) allowed = false;
          if (action === 'DELETE' && mod !== 'documents') allowed = false;
        } else if (role === 'BRAND_ANALYST') {
          if (['contracts', 'tenant_config', 'user_admin'].includes(mod)) {
            allowed = action === 'READ';
          }
          if (action === 'DELETE') allowed = false;
        } else if (role === 'ASSISTANT') {
          allowed = action === 'READ';
        }

        await prisma.rolePermission.upsert({
          where: {
            role_user_type_module_action: {
              role, user_type: 'PROMARK', module: mod, action,
            },
          },
          update: { allowed },
          create: { role, user_type: 'PROMARK', module: mod, action, allowed },
        });
      }
    }
  }

  // Client roles
  const clientModules = [
    'corporate_structure', 'brand_catalog', 'classifications_vigency',
    'legal_history', 'relationships', 'contracts', 'brand_audit',
    'intelligence_dashboard', 'documents',
  ];

  for (const mod of clientModules) {
    for (const action of actions) {
      // CLIENT_ADMIN: read + export on most, some write
      await prisma.rolePermission.upsert({
        where: {
          role_user_type_module_action: {
            role: 'CLIENT_ADMIN', user_type: 'CLIENT', module: mod, action,
          },
        },
        update: { allowed: action === 'READ' || action === 'EXPORT' },
        create: {
          role: 'CLIENT_ADMIN', user_type: 'CLIENT', module: mod, action,
          allowed: action === 'READ' || action === 'EXPORT',
        },
      });

      // CLIENT_VIEWER: read only, no documents
      await prisma.rolePermission.upsert({
        where: {
          role_user_type_module_action: {
            role: 'CLIENT_VIEWER', user_type: 'CLIENT', module: mod, action,
          },
        },
        update: { allowed: action === 'READ' && mod !== 'documents' },
        create: {
          role: 'CLIENT_VIEWER', user_type: 'CLIENT', module: mod, action,
          allowed: action === 'READ' && mod !== 'documents',
        },
      });

      // CLIENT_LEGAL_REP: read + documents
      await prisma.rolePermission.upsert({
        where: {
          role_user_type_module_action: {
            role: 'CLIENT_LEGAL_REP', user_type: 'CLIENT', module: mod, action,
          },
        },
        update: { allowed: action === 'READ' },
        create: {
          role: 'CLIENT_LEGAL_REP', user_type: 'CLIENT', module: mod, action,
          allowed: action === 'READ',
        },
      });
    }
  }

  console.log('✅ Role permissions seeded');
  console.log('\n🎉 Seed completed successfully!');
  console.log('────────────────────────────────────');
  console.log('Promark Admin: admin@promark.mx');
  console.log('Tenant 1: grupo-test-norte');
  console.log('Tenant 2: alimentos-demo-sa');
  console.log('Client users: GTN-001/002/003, ADS-001/002/003 (PIN: 123456)');
  console.log('  -001: CLIENT_ADMIN, -002: CLIENT_VIEWER, -003: CLIENT_LEGAL_REP');

  // ─── 6. Run alert detector to generate test alerts ──
  console.log('\n🔔 Running alert detector...');
  // Sort rules tightest first; each entity matches only one rule per run
  const allRules = await prisma.alertRule.findMany({ where: { is_active: true } });
  const sortedRules = [...allRules].sort((a, b) => {
    if (a.tenant_id !== b.tenant_id) return a.tenant_id.localeCompare(b.tenant_id);
    if (a.entity_type !== b.entity_type) return a.entity_type.localeCompare(b.entity_type);
    if (a.trigger_days === 0) return 1;
    if (b.trigger_days === 0) return -1;
    return a.trigger_days - b.trigger_days;
  });

  const detectorNow = new Date();
  const matched = new Set<string>();
  let alertsCreated = 0;

  for (const rule of sortedRules) {
    const upperDate = new Date(detectorNow);
    upperDate.setDate(upperDate.getDate() + rule.trigger_days);

    type Candidate = { id: string; name: string; expiry: Date; alertType: string };
    let candidates: Candidate[] = [];

    if (rule.entity_type === 'BRAND') {
      const brands = await prisma.brand.findMany({
        where:
          rule.trigger_days === 0
            ? {
                tenant_id: rule.tenant_id,
                expiration_date: { lt: detectorNow },
                legal_status: { notIn: ['EXPIRED', 'CANCELLED'] },
              }
            : {
                tenant_id: rule.tenant_id,
                expiration_date: { gte: detectorNow, lte: upperDate },
              },
        select: { id: true, name: true, expiration_date: true },
      });
      candidates = brands
        .filter((b) => b.expiration_date)
        .map((b) => ({
          id: b.id,
          name: b.name,
          expiry: b.expiration_date as Date,
          alertType: rule.trigger_days === 0 ? 'EXPIRED' : 'EXPIRY_WARNING',
        }));
    } else if (rule.entity_type === 'DOCUMENT') {
      const docs = await prisma.document.findMany({
        where:
          rule.trigger_days === 0
            ? {
                tenant_id: rule.tenant_id,
                expires_at: { lt: detectorNow },
                deleted_at: null,
                is_latest_version: true,
              }
            : {
                tenant_id: rule.tenant_id,
                expires_at: { gte: detectorNow, lte: upperDate },
                deleted_at: null,
                is_latest_version: true,
              },
        select: { id: true, file_name: true, expires_at: true },
      });
      candidates = docs
        .filter((d) => d.expires_at)
        .map((d) => ({
          id: d.id,
          name: d.file_name,
          expiry: d.expires_at as Date,
          alertType: 'DOCUMENT_EXPIRY',
        }));
    }

    for (const c of candidates) {
      const key = `${rule.tenant_id}|${rule.entity_type}|${c.id}`;
      if (matched.has(key)) continue;
      matched.add(key);
      await prisma.alert.create({
        data: {
          tenant_id: rule.tenant_id,
          alert_rule_id: rule.id,
          entity_type: rule.entity_type,
          entity_id: c.id,
          entity_name: c.name,
          alert_type: c.alertType,
          trigger_days: rule.trigger_days,
          expiry_date: c.expiry,
          status: 'PENDING',
        },
      });
      alertsCreated++;
    }
  }
  console.log(`✅ Alert detector generated ${alertsCreated} new alerts`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
