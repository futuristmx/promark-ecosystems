import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma/client';
import { generatePin, hashPin } from '@/lib/auth/client-pin';

export async function POST(request: Request) {
  try {
    // Verify Promark auth
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a Promark user
    const promarkUser = await prisma.userPromark.findUnique({
      where: { supabase_auth_id: user.id },
    });
    if (!promarkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, user_id } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    // If user_id provided, generate for single user
    if (user_id) {
      const clientUser = await prisma.userClient.findFirst({
        where: { id: user_id, tenant_id },
      });
      if (!clientUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const pin = generatePin(6);
      const pinHash = await hashPin(pin);

      await prisma.userClient.update({
        where: { id: user_id },
        data: {
          pin_hash: pinHash,
          pin_generated_at: new Date(),
          pin_attempts: 0,
          locked_at: null,
        },
      });

      return NextResponse.json({
        success: true,
        results: [{
          user_id: clientUser.id,
          full_name: clientUser.full_name,
          card_id: clientUser.card_id,
          pin, // Plain PIN returned once for distribution
        }],
      });
    }

    // Batch: generate for all active users in tenant
    const users = await prisma.userClient.findMany({
      where: { tenant_id, status: 'ACTIVE' },
    });

    const results = [];
    for (const u of users) {
      const pin = generatePin(6);
      const pinHash = await hashPin(pin);

      await prisma.userClient.update({
        where: { id: u.id },
        data: {
          pin_hash: pinHash,
          pin_generated_at: new Date(),
          pin_attempts: 0,
          locked_at: null,
        },
      });

      results.push({
        user_id: u.id,
        full_name: u.full_name,
        card_id: u.card_id,
        pin,
      });
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error) {
    console.error('PIN batch generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
