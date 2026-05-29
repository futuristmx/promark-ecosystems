import { NextResponse } from 'next/server';

/**
 * Limpia la cookie promark-client-token del cliente. El componente luego
 * navega a /brand-ecosystem/[slug]/login.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('promark-client-token', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
