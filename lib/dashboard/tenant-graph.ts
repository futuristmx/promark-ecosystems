import prisma from '@/lib/prisma/client';

export type GraphNodeType =
  | 'HOLDING'
  | 'COMPANY'
  | 'BRAND'
  | 'HOLDER'
  | 'CONTRACT'
  | 'ALERT';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function computeTenantGraph(tenantId: string): Promise<GraphPayload> {
  const [holdings, companies, brands, holders, brandHolders, contractBrands, alerts] =
    await Promise.all([
      prisma.holding.findMany({
        where: { tenant_id: tenantId },
        select: { id: true, name: true, status: true },
      }),
      prisma.company.findMany({
        where: { tenant_id: tenantId },
        select: { id: true, name: true, status: true, holding_id: true },
      }),
      prisma.brand.findMany({
        where: { tenant_id: tenantId },
        select: {
          id: true,
          name: true,
          legal_status: true,
          company_id: true,
        },
      }),
      prisma.holder.findMany({
        where: { tenant_id: tenantId },
        select: { id: true, name: true, status: true },
      }),
      prisma.brandHolder.findMany({
        where: { brand: { tenant_id: tenantId } },
        select: { id: true, brand_id: true, holder_id: true, role: true },
      }),
      prisma.contractBrand.findMany({
        where: {
          contract: { tenant_id: tenantId, deleted_at: null },
          brand: { tenant_id: tenantId },
        },
        select: {
          id: true,
          brand_id: true,
          contract_id: true,
          contract: { select: { id: true, title: true, status: true } },
        },
      }),
      prisma.alert.findMany({
        where: { tenant_id: tenantId, status: 'PENDING' },
        select: {
          id: true,
          entity_type: true,
          entity_id: true,
          entity_name: true,
          alert_type: true,
        },
      }),
    ]);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const h of holdings) {
    nodes.push({
      id: `holding-${h.id}`,
      type: 'HOLDING',
      label: h.name,
      status: h.status,
    });
  }

  for (const c of companies) {
    nodes.push({
      id: `company-${c.id}`,
      type: 'COMPANY',
      label: c.name,
      status: c.status,
    });
    edges.push({
      id: `edge-holding-${c.holding_id}-company-${c.id}`,
      source: `holding-${c.holding_id}`,
      target: `company-${c.id}`,
      type: 'HOLDING_COMPANY',
    });
  }

  for (const b of brands) {
    nodes.push({
      id: `brand-${b.id}`,
      type: 'BRAND',
      label: b.name,
      status: b.legal_status,
    });
    edges.push({
      id: `edge-company-${b.company_id}-brand-${b.id}`,
      source: `company-${b.company_id}`,
      target: `brand-${b.id}`,
      type: 'COMPANY_BRAND',
    });
  }

  for (const h of holders) {
    nodes.push({
      id: `holder-${h.id}`,
      type: 'HOLDER',
      label: h.name,
      status: h.status,
    });
  }

  // Bidirectional Brand ↔ Holder, render single edge
  const seenBH = new Set<string>();
  for (const bh of brandHolders) {
    const key = `${bh.brand_id}::${bh.holder_id}`;
    if (seenBH.has(key)) continue;
    seenBH.add(key);
    edges.push({
      id: `edge-brand-holder-${bh.id}`,
      source: `brand-${bh.brand_id}`,
      target: `holder-${bh.holder_id}`,
      type: 'BRAND_HOLDER',
    });
  }

  // Contracts (deduplicated)
  const seenContracts = new Set<string>();
  for (const cb of contractBrands) {
    if (!seenContracts.has(cb.contract_id)) {
      seenContracts.add(cb.contract_id);
      nodes.push({
        id: `contract-${cb.contract_id}`,
        type: 'CONTRACT',
        label: cb.contract.title,
        status: cb.contract.status,
      });
    }
    edges.push({
      id: `edge-brand-contract-${cb.id}`,
      source: `brand-${cb.brand_id}`,
      target: `contract-${cb.contract_id}`,
      type: 'BRAND_CONTRACT',
    });
  }

  // Alerts (only PENDING, only for BRAND entities to wire edge correctly)
  for (const a of alerts) {
    nodes.push({
      id: `alert-${a.id}`,
      type: 'ALERT',
      label: a.entity_name || a.alert_type,
      status: 'PENDING',
      metadata: { alert_type: a.alert_type, entity_type: a.entity_type },
    });
    if (a.entity_type === 'BRAND') {
      edges.push({
        id: `edge-brand-alert-${a.id}`,
        source: `brand-${a.entity_id}`,
        target: `alert-${a.id}`,
        type: 'BRAND_ALERT',
      });
    }
  }

  return { nodes, edges };
}
