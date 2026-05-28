import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/lib/prisma/client';
import { requireClientApiAuth, isErrorResponse } from '@/lib/auth/api-helpers';

/**
 * POST /api/client/[tenant-slug]/contact
 * Body: { subject: string, message: string }
 *
 * El cliente envía un mensaje directo a Promark. Se envía como correo
 * desde noreply al inbox configurado en PROMARK_INBOX_EMAIL (o RESEND_FROM
 * como fallback).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ 'tenant-slug': string }> }
) {
  const { 'tenant-slug': tenantSlug } = await params;
  const session = await requireClientApiAuth(request);
  if (isErrorResponse(session)) return session;
  if (session.tenant_slug !== tenantSlug) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const subject: string | undefined = body?.subject?.toString().trim();
  const message: string | undefined = body?.message?.toString().trim();
  if (!subject || subject.length < 3) {
    return NextResponse.json({ error: 'Asunto requerido' }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json({ error: 'El mensaje debe ser más descriptivo' }, { status: 400 });
  }

  const [user, tenant] = await Promise.all([
    prisma.userClient.findUnique({
      where: { id: session.user_id },
      select: { full_name: true, email: true, role: true },
    }),
    prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { name: true },
    }),
  ]);

  const inbox = process.env.PROMARK_INBOX_EMAIL || process.env.RESEND_FROM || 'contacto@promark.mx';
  const fromEmail = process.env.RESEND_FROM || 'Promark <noreply@promark.mx>';
  const apiKey = process.env.RESEND_API_KEY;

  const html = `
    <h2>Nuevo mensaje desde el portal cliente</h2>
    <p><strong>Cliente:</strong> ${tenant?.name ?? tenantSlug}</p>
    <p><strong>Remitente:</strong> ${user?.full_name ?? 'Cliente'} ${user?.email ? `&lt;${user.email}&gt;` : ''}</p>
    <p><strong>Rol:</strong> ${user?.role ?? '—'}</p>
    <hr/>
    <p><strong>Asunto:</strong> ${subject}</p>
    <div style="white-space:pre-wrap;border-left:3px solid #D39A2B;padding:8px 12px;background:#FBF6EC;">${message}</div>
    <p style="font-size:11px;color:#888;">Enviado desde Promark — Inteligencia Marcaria</p>
  `;

  if (!apiKey) {
    // En dev: log y considerar como exitoso para no bloquear el flujo
    console.warn('[contact] RESEND_API_KEY no configurado — mensaje no enviado por email');
    console.log(`[contact] tenant=${tenantSlug} from=${user?.email} subject=${subject}`);
    return NextResponse.json({ success: true, delivered: false, reason: 'email-not-configured' });
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromEmail,
      to: inbox,
      replyTo: user?.email ?? undefined,
      subject: `[Portal Cliente] ${subject}`,
      html,
    });
    if (result.error) {
      console.error('[contact] resend error:', result.error);
      return NextResponse.json({ error: 'Error enviando el correo' }, { status: 500 });
    }
    return NextResponse.json({ success: true, delivered: true });
  } catch (err) {
    console.error('[contact] failed:', err);
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
  }
}
