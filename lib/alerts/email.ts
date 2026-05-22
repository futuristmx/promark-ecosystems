import { Resend } from 'resend';

export interface AlertEmailParams {
  to: string;
  entityName: string;
  entityType: string;
  expiryDate: Date;
  daysRemaining: number;
  portalUrl: string;
}

function isExpired(days: number): boolean {
  return days <= 0;
}

function buildSubject(p: AlertEmailParams): string {
  if (isExpired(p.daysRemaining)) {
    return `⚠️ ${p.entityName} ha vencido — Promark®`;
  }
  return `⚠️ ${p.entityName} vence en ${p.daysRemaining} días — Promark®`;
}

function buildHtml(p: AlertEmailParams): string {
  const expired = isExpired(p.daysRemaining);
  const headline = expired
    ? `${p.entityName} ha vencido`
    : `${p.entityName} vence en ${p.daysRemaining} días`;
  const subhead = expired
    ? `Venció el ${p.expiryDate.toLocaleDateString('es-MX')}.`
    : `Fecha de vencimiento: ${p.expiryDate.toLocaleDateString('es-MX')}.`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:24px;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:14px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Alerta de vigencia</p>
              <h1 style="margin:8px 0 0;font-size:20px;color:#0f172a;font-weight:600;">${headline}</h1>
              <p style="margin:4px 0 0;font-size:14px;color:#475569;">${subhead}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#64748b;width:35%;">Entidad</td>
                  <td style="padding:8px 0;font-size:13px;color:#0f172a;font-weight:500;">${p.entityName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#64748b;">Tipo</td>
                  <td style="padding:8px 0;font-size:13px;color:#0f172a;font-weight:500;">${p.entityType}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#64748b;">Vencimiento</td>
                  <td style="padding:8px 0;font-size:13px;color:#0f172a;font-weight:500;">${p.expiryDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="border-radius:8px;background:#3E6AE1;">
                    <a href="${p.portalUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;">Ver en el portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Promark® — Inteligencia marcaria.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send alert email via Resend. If RESEND_API_KEY is not configured,
 * logs to console (graceful degradation).
 */
export async function sendAlertEmail(
  params: AlertEmailParams
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'alertas@promark.mx';
  const subject = buildSubject(params);
  const html = buildHtml(params);

  if (!apiKey) {
    console.log('───────────────────────────────────────────────');
    console.log('📧 [Alert email — RESEND_API_KEY not configured]');
    console.log(`   To:      ${params.to}`);
    console.log(`   From:    ${fromEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Days:    ${params.daysRemaining}`);
    console.log(`   Entity:  ${params.entityName} (${params.entityType})`);
    console.log('───────────────────────────────────────────────');
    return { sent: false, reason: 'RESEND_API_KEY not configured' };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject,
      html,
    });
    if (result.error) {
      console.error('Resend email error:', result.error);
      return { sent: false, reason: result.error.message };
    }
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('sendAlertEmail failed:', message);
    return { sent: false, reason: message };
  }
}
