import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma/client';
import type { PromarkRole } from '@prisma/client';

export interface PromarkSession {
  id: string;
  email: string;
  full_name: string;
  role: PromarkRole;
  supabase_auth_id: string;
  avatar: unknown;
}

export async function getPromarkSession(): Promise<PromarkSession | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const promarkUser = await prisma.userPromark.findUnique({
    where: { supabase_auth_id: user.id },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      supabase_auth_id: true,
      avatar: true,
    },
  });

  if (!promarkUser) return null;

  // If no avatar in DB, try Supabase auth metadata
  let avatar = promarkUser.avatar;
  if (!avatar) {
    const metaAvatar =
      user.user_metadata?.avatar_url ??
      user.user_metadata?.picture ??
      null;
    if (metaAvatar) avatar = metaAvatar;
  }

  return { ...promarkUser, avatar };
}

export async function requirePromarkAuth(): Promise<PromarkSession> {
  const session = await getPromarkSession();

  if (!session) {
    redirect('/login?message=session_expired');
  }

  return session;
}
