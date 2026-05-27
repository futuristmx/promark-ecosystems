import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { requireApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiAuth(request);
  if (isErrorResponse(session)) return session;

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, status: true, config: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const cfg = tenant.config as {
    branding?: { primary_color?: string; logo_url?: string };
  } | null;

  return NextResponse.json({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    branding: {
      primary_color: cfg?.branding?.primary_color ?? null,
      logo_url: cfg?.branding?.logo_url ?? null,
    },
  });
}
