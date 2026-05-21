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

    for (let i = 0; i < 5; i++) {
      const company = i < 3 ? parentCo : subsidiary;
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
          expiration_date: statuses[i] !== 'APPLIED' ? new Date(2034, i + 3, 1) : null,
        },
      });
    }
  }

  console.log('✅ Holdings, Companies, and Brands created');

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
  console.log('Client users: GTN-001/002, ADS-001/002 (PIN: 123456)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
