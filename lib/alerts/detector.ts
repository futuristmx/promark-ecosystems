import prisma from '@/lib/prisma/client';
import { sendAlertEmail } from '@/lib/alerts/email';
import type { Prisma } from '@prisma/client';

export interface DetectorResult {
  rulesProcessed: number;
  candidatesFound: number;
  alertsCreated: number;
  emailsSent: number;
  emailsSkipped: number;
  errors: Array<{ rule?: string; entity?: string; message: string }>;
}

/**
 * Run the alert detector across every active AlertRule and create Alert rows
 * for entities whose expiry date falls within the rule's trigger window.
 * Deduplicates by checking for an existing Alert in the last 24h with
 * the same entity + trigger_days combination.
 */
export async function runAlertDetector(): Promise<DetectorResult> {
  const result: DetectorResult = {
    rulesProcessed: 0,
    candidatesFound: 0,
    alertsCreated: 0,
    emailsSent: 0,
    emailsSkipped: 0,
    errors: [],
  };

  const rules = await prisma.alertRule.findMany({
    where: { is_active: true },
    include: { tenant: { select: { id: true, slug: true, name: true } } },
  });

  // Sort rules so that for each (tenant, entity_type) we process the tightest
  // (smallest non-zero trigger) first, with expired (0) last. Each entity
  // matches exactly one rule per detector run — the most urgent applicable.
  const sortedRules = [...rules].sort((a, b) => {
    if (a.tenant_id !== b.tenant_id) return a.tenant_id.localeCompare(b.tenant_id);
    if (a.entity_type !== b.entity_type) return a.entity_type.localeCompare(b.entity_type);
    // 0 (expired) goes last; otherwise ascending
    if (a.trigger_days === 0) return 1;
    if (b.trigger_days === 0) return -1;
    return a.trigger_days - b.trigger_days;
  });

  const now = new Date();
  const dedupWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  // Track entities already matched in this run (per tenant+entityType+entityId)
  const matchedKeys = new Set<string>();

  for (const rule of sortedRules) {
    result.rulesProcessed++;

    try {
      const triggerDays = rule.trigger_days;
      const upperDate = new Date(now);
      upperDate.setDate(upperDate.getDate() + triggerDays);

      type CandidateRow = {
        id: string;
        name: string;
        expiry: Date;
        alertType: string;
      };
      let candidates: CandidateRow[] = [];

      if (rule.entity_type === 'BRAND') {
        const where: Prisma.BrandWhereInput = { tenant_id: rule.tenant_id };
        if (triggerDays === 0) {
          where.expiration_date = { lt: now };
          where.legal_status = { notIn: ['EXPIRED', 'CANCELLED'] };
        } else {
          // expires within [now, now + triggerDays]
          where.expiration_date = { gte: now, lte: upperDate };
        }
        const brands = await prisma.brand.findMany({
          where,
          select: { id: true, name: true, expiration_date: true },
        });
        candidates = brands
          .filter((b) => b.expiration_date)
          .map((b) => ({
            id: b.id,
            name: b.name,
            expiry: b.expiration_date as Date,
            alertType: triggerDays === 0 ? 'EXPIRED' : 'EXPIRY_WARNING',
          }));
      } else if (rule.entity_type === 'CONTRACT') {
        const where: Prisma.ContractWhereInput = {
          tenant_id: rule.tenant_id,
          deleted_at: null,
          status: { in: ['ACTIVE', 'UNDER_REVIEW'] },
        };
        if (triggerDays === 0) {
          where.expiration_date = { lt: now };
        } else {
          where.expiration_date = { gte: now, lte: upperDate };
        }
        const contracts = await prisma.contract.findMany({
          where, select: { id: true, title: true, expiration_date: true },
        });
        candidates = contracts
          .filter((c) => c.expiration_date)
          .map((c) => ({
            id: c.id,
            name: c.title,
            expiry: c.expiration_date as Date,
            alertType: triggerDays === 0 ? 'EXPIRED' : 'EXPIRY_WARNING',
          }));
      } else if (rule.entity_type === 'LICENSE') {
        const where: Prisma.LicenseWhereInput = {
          tenant_id: rule.tenant_id,
          deleted_at: null,
          status: 'ACTIVE',
        };
        if (triggerDays === 0) {
          where.expiration_date = { lt: now };
        } else {
          where.expiration_date = { gte: now, lte: upperDate };
        }
        const licenses = await prisma.license.findMany({
          where, select: { id: true, licensee_name: true, expiration_date: true },
        });
        candidates = licenses
          .filter((l) => l.expiration_date)
          .map((l) => ({
            id: l.id,
            name: l.licensee_name,
            expiry: l.expiration_date as Date,
            alertType: triggerDays === 0 ? 'EXPIRED' : 'EXPIRY_WARNING',
          }));
      } else if (rule.entity_type === 'DOCUMENT') {
        const where: Prisma.DocumentWhereInput = {
          tenant_id: rule.tenant_id,
          is_latest_version: true,
          deleted_at: null,
        };
        if (triggerDays === 0) {
          where.expires_at = { lt: now };
        } else {
          where.expires_at = { gte: now, lte: upperDate };
        }
        const docs = await prisma.document.findMany({
          where,
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

      // Filter out entities already matched by a tighter rule in this run
      candidates = candidates.filter((c) => {
        const key = `${rule.tenant_id}|${rule.entity_type}|${c.id}`;
        if (matchedKeys.has(key)) return false;
        matchedKeys.add(key);
        return true;
      });

      result.candidatesFound += candidates.length;

      for (const candidate of candidates) {
        try {
          // Deduplication: check for an Alert with same entity + trigger_days
          // in the last 24h.
          const existing = await prisma.alert.findFirst({
            where: {
              tenant_id: rule.tenant_id,
              entity_type: rule.entity_type,
              entity_id: candidate.id,
              trigger_days: triggerDays,
              created_at: { gte: dedupWindow },
            },
          });
          if (existing) continue;

          const alert = await prisma.alert.create({
            data: {
              tenant_id: rule.tenant_id,
              alert_rule_id: rule.id,
              entity_type: rule.entity_type,
              entity_id: candidate.id,
              entity_name: candidate.name,
              alert_type: candidate.alertType,
              trigger_days: triggerDays,
              expiry_date: candidate.expiry,
              status: 'PENDING',
            },
          });
          result.alertsCreated++;

          if (rule.notify_email) {
            // Resolve notify_email recipient from tenant config
            const tenantConfig = await prisma.tenant.findUnique({
              where: { id: rule.tenant_id },
              select: { config: true, slug: true, name: true },
            });
            const cfg = tenantConfig?.config as
              | { notifications?: { notify_email?: string | null } }
              | undefined;
            const recipient = cfg?.notifications?.notify_email;
            const slug = tenantConfig?.slug ?? '';
            const tenantName = tenantConfig?.name ?? undefined;

            if (recipient) {
              const daysRemaining = Math.ceil(
                (candidate.expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              // Map entity_type -> portal sub-route. Contracts use Spanish path
              // (sprint-6 convention); brands and documents use English.
              const entityPath =
                rule.entity_type === 'BRAND' ? 'brands'
                  : rule.entity_type === 'CONTRACT' ? 'contratos'
                    : 'documents';
              const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/brand-ecosystem/${slug}/${entityPath}/${candidate.id}`;
              const emailResult = await sendAlertEmail({
                to: recipient,
                entityName: candidate.name,
                entityType: rule.entity_type,
                expiryDate: candidate.expiry,
                daysRemaining,
                portalUrl,
                tenantName,
              });
              if (emailResult.sent) {
                result.emailsSent++;
                await prisma.alert.update({
                  where: { id: alert.id },
                  data: { sent_at: new Date() },
                });
              } else {
                result.emailsSkipped++;
              }
            } else {
              result.emailsSkipped++;
            }
          }
        } catch (err) {
          result.errors.push({
            rule: rule.name,
            entity: candidate.name,
            message: err instanceof Error ? err.message : 'unknown',
          });
        }
      }
    } catch (err) {
      result.errors.push({
        rule: rule.name,
        message: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  return result;
}
