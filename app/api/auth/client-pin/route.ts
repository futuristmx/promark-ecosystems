import { NextResponse } from 'next/server';
import { authenticateClientUser, generateClientJWT } from '@/lib/auth/client-pin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { card_id, pin, tenant_slug } = body;

    if (!card_id || !pin || !tenant_slug) {
      return NextResponse.json(
        { error: 'Missing required fields: card_id, pin, tenant_slug' },
        { status: 400 }
      );
    }

    const result = await authenticateClientUser(card_id, pin, tenant_slug);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        TENANT_NOT_FOUND: 404,
        USER_NOT_FOUND: 404,
        ACCOUNT_LOCKED: 423,
        INVALID_PIN: 401,
        USER_INACTIVE: 403,
      };
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: statusMap[result.error] || 400 }
      );
    }

    // Generate JWT
    const token = await generateClientJWT(
      { id: result.user.id, role: result.user.role },
      { id: result.user.tenant_id, slug: result.user.tenant_slug }
    );

    // Cookie HttpOnly + Secure: el cliente NO puede leer el token via JS,
    // mitigando robo por XSS. El cookie viaja automáticamente en peticiones same-site.
    const res = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        full_name: result.user.full_name,
        role: result.user.role,
        tenant_slug: result.user.tenant_slug,
      },
    });
    res.cookies.set('promark-client-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8h
    });
    return res;
  } catch (error) {
    console.error('Client auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
