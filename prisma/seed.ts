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
  // Limpia BOTH slugs viejos (grupo-test-norte, alimentos-demo-sa) y nuevos
  // (grupo-norteno, alimentos-pacifico) para que el seed sea idempotente
  // arrancando desde cualquier estado anterior.
  //
  // NOTA: borrar Tenant requiere primero borrar TODOS sus child rows
  // (UserClient, RolePermission, etc.) por FK constraints. El orden importa.
  const DEMO_SLUGS = [
    'grupo-norteno',
    'alimentos-pacifico',
    'grupo-test-norte',
    'alimentos-demo-sa',
  ];
  const demoTenants = await prisma.tenant.findMany({
    where: { slug: { in: DEMO_SLUGS } },
    select: { id: true },
  });
  const demoTenantIds = demoTenants.map((t) => t.id);

  await prisma.alert.deleteMany({});
  await prisma.alertRule.deleteMany({});
  await prisma.contractHistory.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.contractBrand.deleteMany({});
  await prisma.contract.deleteMany({});
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

  // UserClient + tenants demo: borrar por tenant_id (más confiable que filtro
  // por relación). Usar lista de IDs prevenidos arriba.
  if (demoTenantIds.length > 0) {
    await prisma.userClient.deleteMany({
      where: { tenant_id: { in: demoTenantIds } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: demoTenantIds } },
    });
  }
  console.log('🧹 Cleared test data (', demoTenantIds.length, 'tenants demo borrados)');

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
    where: { slug: 'grupo-norteno' },
    update: {},
    create: {
      name: 'Grupo Norteño S.A. de C.V.',
      slug: 'grupo-norteno',
      status: 'ACTIVE',
      config: {
        branding: {
          logo_url: null,
          primary_color: '#1E3A5F',
          company_display_name: 'Grupo Norteño',
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
    where: { slug: 'alimentos-pacifico' },
    update: {},
    create: {
      name: 'Alimentos del Pacífico',
      slug: 'alimentos-pacifico',
      status: 'ACTIVE',
      config: {
        branding: {
          logo_url: null,
          primary_color: '#8B5CF6',
          company_display_name: 'Alimentos del Pacífico',
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

  // ─── 3. Client Users (PINs individuales) ───────────
  // Grupo Norteño: admin 1234, visualizador 5678, legal rep 9012
  // Alimentos del Pacífico: admin 1111, visualizador 2222
  const userSpecs = [
    { tenantSlug: 'grupo-norteno', prefix: 'GTN', pin: '1234', cardSuffix: '001', role: 'CLIENT_ADMIN' as const,        name: 'Admin Cliente Norteño' },
    { tenantSlug: 'grupo-norteno', prefix: 'GTN', pin: '5678', cardSuffix: '002', role: 'CLIENT_VIEWER' as const,       name: 'Visualizador Norteño' },
    { tenantSlug: 'grupo-norteno', prefix: 'GTN', pin: '9012', cardSuffix: '003', role: 'CLIENT_LEGAL_REP' as const,    name: 'Representante Legal Norteño' },
    { tenantSlug: 'alimentos-pacifico', prefix: 'ADS', pin: '1111', cardSuffix: '001', role: 'CLIENT_ADMIN' as const,   name: 'Admin Cliente Pacífico' },
    { tenantSlug: 'alimentos-pacifico', prefix: 'ADS', pin: '2222', cardSuffix: '002', role: 'CLIENT_VIEWER' as const,  name: 'Visualizador Pacífico' },
  ];

  for (const spec of userSpecs) {
    const tenant = spec.tenantSlug === 'grupo-norteno' ? tenant1 : tenant2;
    const cardId = `${spec.prefix}-${spec.cardSuffix}`;
    const pinHash = await hash(spec.pin, 12);

    await prisma.userClient.upsert({
      where: { card_id: cardId },
      // Re-set tenant_id en update para que un seed re-run repinte usuarios
      // a tenants demo nuevos aunque el cleanup haya dejado tenants viejos.
      update: { pin_hash: pinHash, role: spec.role, full_name: spec.name, tenant_id: tenant.id },
      create: {
        tenant_id: tenant.id,
        full_name: spec.name,
        email: `${spec.cardSuffix}@${spec.tenantSlug.replace(/-/g, '')}.mx`,
        pin_hash: pinHash,
        pin_generated_at: new Date(),
        card_id: cardId,
        role: spec.role,
        status: 'ACTIVE',
      },
    });
  }

  console.log('✅ Client users created (PINs individuales — ver SPRINT-6-COMPLETED.md)');

  // ─── 4. Holdings + Companies + Brands ──────────────
  for (const tenant of [tenant1, tenant2]) {
    const isT1 = tenant.slug === 'grupo-norteno';

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

    // Grupo Norteño: 8 marcas (5 activas + 1 en 45 días + 1 en 15 días + 1 vencida)
    // Alimentos del Pacífico: 5 marcas (4 activas + 1 en 30 días)
    const brandNames = isT1
      ? ['NortExpress', 'VíaNorte', 'Norte Digital', 'ArcticPack', 'NordLine', 'NorthFresh', 'NorteRural', 'NortePremium']
      : ['SaborReal', 'CampoPuro', 'Del Huerto', 'NutriFresh', 'GranoCero'];

    const statuses = isT1
      ? ['REGISTERED', 'REGISTERED', 'REGISTERED', 'RENEWED', 'REGISTERED', 'REGISTERED', 'REGISTERED', 'EXPIRED'] as const
      : ['REGISTERED', 'REGISTERED', 'APPLIED', 'RENEWED', 'REGISTERED'] as const;
    const types = isT1
      ? ['WORDMARK', 'MIXED', 'FIGURATIVE', 'WORDMARK', 'MIXED', 'WORDMARK', 'MIXED', 'WORDMARK'] as const
      : ['WORDMARK', 'MIXED', 'FIGURATIVE', 'WORDMARK', 'MIXED'] as const;

    const now = new Date();
    const in15Days = new Date(now);
    in15Days.setDate(in15Days.getDate() + 15);
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const in45Days = new Date(now);
    in45Days.setDate(in45Days.getDate() + 45);
    const expired45Ago = new Date(now);
    expired45Ago.setDate(expired45Ago.getDate() - 45);
    const far = new Date(2029, 0, 1); // ~3 años out

    // Grupo Norteño: índices 0-4 activas (far), 5 en 45 días, 6 en 15 días, 7 vencida
    // Alimentos del Pacífico: 0-3 activas, 4 en 30 días
    const tenantExpirations: (Date | null)[] = isT1
      ? [far, far, far, far, far, in45Days, in15Days, expired45Ago]
      : [far, far, far, far, in30Days];

    // IMPI: T1 usa {29, 30, 35} distribuidas; T2 usa {29, 43}
    const classAssignments: number[][] = isT1
      ? [[29], [30], [35], [29, 30], [35], [30], [29, 35], [29]]
      : [[29], [29, 43], [43], [29], [43]];

    const brandCount = brandNames.length;
    for (let i = 0; i < brandCount; i++) {
      const company = i < Math.ceil(brandCount / 2) ? parentCo : subsidiary;
      const expiry = tenantExpirations[i];
      const brand = await prisma.brand.create({
        data: {
          tenant_id: tenant.id,
          company_id: company.id,
          name: brandNames[i],
          slug: brandNames[i].toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, c => ({á:'a',é:'e',í:'i',ó:'o',ú:'u'}[c] || c)),
          legal_status: statuses[i],
          brand_type: types[i],
          registration_number: statuses[i] !== 'APPLIED' ? `MX-${isT1 ? 'N' : 'A'}${String(i+1).padStart(4, '0')}` : null,
          application_date: new Date(2024, i % 12, 15),
          registration_date: statuses[i] !== 'APPLIED' ? new Date(2024, (i + 3) % 12, 1) : null,
          expiration_date: expiry,
        },
      });

      for (const classNum of classAssignments[i]) {
        await prisma.brandClass.create({
          data: {
            brand_id: brand.id,
            class_number: classNum,
            status: statuses[i] === 'APPLIED' ? 'PENDING' : 'ACTIVE',
          },
        });
      }
    }
  }

  console.log('✅ Holdings, Companies, and Brands created');

  // ─── 4b. Holders + BrandHolder + UserClientHolder ──
  for (const tenant of [tenant1, tenant2]) {
    const isT1 = tenant.slug === 'grupo-norteno';
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
    { name: 'Contrato por vencer — 90 días',  entity_type: 'CONTRACT', trigger_days: 90 },
    { name: 'Contrato por vencer — 30 días',  entity_type: 'CONTRACT', trigger_days: 30 },
    { name: 'Contrato vencido',               entity_type: 'CONTRACT', trigger_days: 0  },
    { name: 'Licencia por vencer — 30 días',  entity_type: 'LICENSE',  trigger_days: 30 },
    { name: 'Licencia vencida',               entity_type: 'LICENSE',  trigger_days: 0  },
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
  // Attach a document record to the first brand of grupo-norteno
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

  // ─── 5b. Contracts + Licenses for grupo-norteno ──
  const t1Brands = await prisma.brand.findMany({
    where: { tenant_id: tenant1.id },
    orderBy: { name: 'asc' },
    take: 2,
  });
  if (t1Brands.length >= 2) {
    const seedNow = new Date();
    const in200 = new Date(seedNow); in200.setDate(in200.getDate() + 200);
    const in20 = new Date(seedNow); in20.setDate(in20.getDate() + 20);
    const in365 = new Date(seedNow); in365.setDate(in365.getDate() + 365);

    const internal1 = await prisma.contract.create({
      data: {
        tenant_id: tenant1.id,
        contract_type: 'LICENSE_INTERNAL',
        title: 'Licencia interna Holding Norte → Distribuidora',
        description: 'Licencia de uso entre holding y subsidiaria.',
        parties: { otorgante: 'Holding Norte S.A. de C.V.', receptor: 'Distribuidora Norte S.A. de C.V.' },
        effective_date: new Date(2025, 0, 1),
        expiration_date: in200,
        status: 'ACTIVE',
        financial_terms: { royalty_rate: 5 },
        governing_law: 'México',
      },
    });
    await prisma.contractBrand.create({ data: { contract_id: internal1.id, brand_id: t1Brands[0].id } });
    await prisma.contractHistory.create({
      data: {
        contract_id: internal1.id, change_type: 'CREATED', changed_by_user_type: 'PROMARK',
        summary: 'Contrato creado en seed', changed_by_user_id: superadmin.id,
      },
    });

    const internal2 = await prisma.contract.create({
      data: {
        tenant_id: tenant1.id,
        contract_type: 'LICENSE_INTERNAL',
        title: 'Licencia interna - Logística',
        parties: { otorgante: 'Holding Norte S.A. de C.V.', receptor: 'Logística Norte Express S.A. de C.V.' },
        effective_date: new Date(2024, 5, 1),
        expiration_date: in20,
        status: 'ACTIVE',
        governing_law: 'México',
      },
    });
    await prisma.contractBrand.create({ data: { contract_id: internal2.id, brand_id: t1Brands[1].id } });
    await prisma.contractHistory.create({
      data: {
        contract_id: internal2.id, change_type: 'CREATED', changed_by_user_type: 'PROMARK',
        summary: 'Contrato creado en seed', changed_by_user_id: superadmin.id,
      },
    });

    const external = await prisma.contract.create({
      data: {
        tenant_id: tenant1.id,
        contract_type: 'LICENSE_EXTERNAL',
        title: 'Licencia externa con Tercero',
        parties: { otorgante: 'Distribuidora Norte S.A. de C.V.', receptor: 'Tercero Comercial S.A.' },
        effective_date: new Date(2025, 1, 1),
        expiration_date: in365,
        status: 'ACTIVE',
        financial_terms: { royalty_rate: 8, royalty_terms: 'Pago trimestral' },
        governing_law: 'México',
      },
    });
    await prisma.contractBrand.create({ data: { contract_id: external.id, brand_id: t1Brands[0].id } });
    await prisma.contractHistory.create({
      data: {
        contract_id: external.id, change_type: 'CREATED', changed_by_user_type: 'PROMARK',
        summary: 'Contrato creado en seed', changed_by_user_id: superadmin.id,
      },
    });

    // Exclusive License derived from the external contract
    await prisma.license.create({
      data: {
        tenant_id: tenant1.id,
        contract_id: external.id,
        brand_id: t1Brands[0].id,
        license_type: 'EXCLUSIVE',
        licensee_name: 'Tercero Comercial S.A.',
        licensee_rfc: 'TER010101AAA',
        territory: ['México', 'Centroamérica'],
        permitted_uses: 'Uso comercial en empaques y publicidad.',
        prohibited_uses: 'Sub-licenciamiento sin autorización.',
        effective_date: new Date(2025, 1, 1),
        expiration_date: in365,
        status: 'ACTIVE',
        royalty_rate: '8.0000',
        royalty_terms: 'Pago trimestral sobre ventas netas.',
      },
    });
  }
  console.log('✅ Contracts + License seeded');

  console.log('\n🎉 Seed completed successfully!');
  console.log('────────────────────────────────────');
  console.log('Promark Admin: admin@promark.mx');
  console.log('Tenant 1: grupo-norteno — Grupo Norteño S.A. de C.V.');
  console.log('  GTN-001 CLIENT_ADMIN     PIN 1234');
  console.log('  GTN-002 CLIENT_VIEWER    PIN 5678');
  console.log('  GTN-003 CLIENT_LEGAL_REP PIN 9012');
  console.log('Tenant 2: alimentos-pacifico — Alimentos del Pacífico');
  console.log('  ADS-001 CLIENT_ADMIN     PIN 1111');
  console.log('  ADS-002 CLIENT_VIEWER    PIN 2222');

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
    } else if (rule.entity_type === 'CONTRACT') {
      const contracts = await prisma.contract.findMany({
        where: rule.trigger_days === 0
          ? { tenant_id: rule.tenant_id, deleted_at: null, status: { in: ['ACTIVE','UNDER_REVIEW'] }, expiration_date: { lt: detectorNow } }
          : { tenant_id: rule.tenant_id, deleted_at: null, status: { in: ['ACTIVE','UNDER_REVIEW'] }, expiration_date: { gte: detectorNow, lte: upperDate } },
        select: { id: true, title: true, expiration_date: true },
      });
      candidates = contracts.filter((c) => c.expiration_date).map((c) => ({
        id: c.id, name: c.title, expiry: c.expiration_date as Date,
        alertType: rule.trigger_days === 0 ? 'EXPIRED' : 'EXPIRY_WARNING',
      }));
    } else if (rule.entity_type === 'LICENSE') {
      const licenses = await prisma.license.findMany({
        where: rule.trigger_days === 0
          ? { tenant_id: rule.tenant_id, deleted_at: null, status: 'ACTIVE', expiration_date: { lt: detectorNow } }
          : { tenant_id: rule.tenant_id, deleted_at: null, status: 'ACTIVE', expiration_date: { gte: detectorNow, lte: upperDate } },
        select: { id: true, licensee_name: true, expiration_date: true },
      });
      candidates = licenses.filter((l) => l.expiration_date).map((l) => ({
        id: l.id, name: l.licensee_name, expiry: l.expiration_date as Date,
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
