import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma/client';
import {
  validateTenantConfig,
  validateActiveModules,
  DEFAULT_TENANT_CONFIG,
  DEFAULT_ACTIVE_MODULES,
} from '@/lib/validations/tenant-config.schema';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenants = await prisma.tenant.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        language: true,
        created_at: true,
        updated_at: true,
        _count: { select: { users_client: true, brands: true } },
      },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Tenants GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Superadmin
    const promarkUser = await prisma.userPromark.findUnique({
      where: { supabase_auth_id: user.id },
    });
    if (!promarkUser || promarkUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, config, active_modules } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'Slug already in use' },
        { status: 409 }
      );
    }

    // Validate config if provided, otherwise use defaults
    const tenantConfig = config || { ...DEFAULT_TENANT_CONFIG, branding: { ...DEFAULT_TENANT_CONFIG.branding, company_display_name: name } };
    const configValidation = validateTenantConfig(tenantConfig);
    if (!configValidation.success) {
      return NextResponse.json(
        { error: 'Invalid config', details: configValidation.errors },
        { status: 400 }
      );
    }

    const modules = active_modules || DEFAULT_ACTIVE_MODULES;
    const modulesValidation = validateActiveModules(modules);
    if (!modulesValidation.success) {
      return NextResponse.json(
        { error: 'Invalid active_modules', details: modulesValidation.errors },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        config: configValidation.data!,
        active_modules: modulesValidation.data!,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error('Tenants POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
