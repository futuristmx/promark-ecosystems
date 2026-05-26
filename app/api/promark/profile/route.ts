import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ─── GET /api/promark/profile ───────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.userPromark.findUnique({
      where: { supabase_auth_id: user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        avatar: true,
        status: true,
        last_login: true,
        created_at: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH /api/promark/profile ─────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.userPromark.findUnique({
      where: { supabase_auth_id: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.full_name === 'string' && body.full_name.trim().length >= 2) {
      updates.full_name = body.full_name.trim();
    }

    // Avatar as base64 data URL stored in JSONB
    if (body.avatar !== undefined) {
      if (body.avatar === null) {
        updates.avatar = null;
      } else if (typeof body.avatar === 'string' && body.avatar.startsWith('data:image/')) {
        // Limit ~2MB base64
        if (body.avatar.length > 2_800_000) {
          return NextResponse.json({ error: 'Image too large (max 2MB)' }, { status: 400 });
        }
        updates.avatar = { dataUrl: body.avatar };
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.userPromark.update({
      where: { id: existing.id },
      data: updates,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        avatar: true,
        status: true,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
