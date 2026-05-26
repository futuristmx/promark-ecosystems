'use client';

import { useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useParams } from 'next/navigation';
import type {
  GraphNode as DomainNode,
  GraphEdge as DomainEdge,
  GraphNodeType,
} from '@/lib/dashboard/tenant-graph';
import { GraphToolbar } from './graph-toolbar';
import { NodeDetailSheet, type SelectedNode } from './node-detail-sheet';

interface TenantGraphProps {
  nodes: DomainNode[];
  edges: DomainEdge[];
}

interface NodeData extends Record<string, unknown> {
  label: string;
  type: GraphNodeType;
  status?: string;
  metadata?: Record<string, unknown>;
}

const TYPE_STYLE: Record<
  GraphNodeType,
  { bg: string; color: string; width: number }
> = {
  HOLDING: { bg: '#0F2E3D', color: '#ffffff', width: 180 },
  COMPANY: { bg: '#1C3F55', color: '#ffffff', width: 160 },
  BRAND: { bg: '#2F6B4F', color: '#ffffff', width: 150 },
  HOLDER: { bg: '#355B6F', color: '#ffffff', width: 140 },
  CONTRACT: { bg: '#D39A2B', color: '#ffffff', width: 140 },
  ALERT: { bg: '#B42318', color: '#ffffff', width: 120 },
};

const LAYER_Y: Record<GraphNodeType, number> = {
  HOLDING: 0,
  COMPANY: 160,
  BRAND: 320,
  HOLDER: 480,
  CONTRACT: 480,
  ALERT: 600,
};

function entityIdFrom(domainId: string): string | undefined {
  // domainId looks like "brand-abc123" → "abc123"
  const idx = domainId.indexOf('-');
  return idx >= 0 ? domainId.slice(idx + 1) : undefined;
}

function layoutNodes(domainNodes: DomainNode[]): Node<NodeData>[] {
  const groups: Record<GraphNodeType, DomainNode[]> = {
    HOLDING: [],
    COMPANY: [],
    BRAND: [],
    HOLDER: [],
    CONTRACT: [],
    ALERT: [],
  };
  for (const n of domainNodes) groups[n.type].push(n);

  const COL_W = 200;
  const out: Node<NodeData>[] = [];
  (Object.keys(groups) as GraphNodeType[]).forEach((type) => {
    const arr = groups[type];
    const totalWidth = arr.length * COL_W;
    arr.forEach((n, i) => {
      const style = TYPE_STYLE[type];
      out.push({
        id: n.id,
        position: {
          x: i * COL_W - totalWidth / 2,
          y: LAYER_Y[type],
        },
        data: {
          label: n.label,
          type: n.type,
          status: n.status,
          metadata: n.metadata,
        },
        style: {
          background: style.bg,
          color: style.color,
          border: 'none',
          borderRadius: 8,
          padding: 8,
          fontSize: 12,
          fontWeight: 500,
          width: style.width,
          textAlign: 'center' as const,
        },
      });
    });
  });
  return out;
}

function toFlowEdges(domainEdges: DomainEdge[]): Edge[] {
  return domainEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    style: { stroke: '#C8C4B9', strokeWidth: 1 },
  }));
}

function TenantGraphInner({ nodes, edges }: TenantGraphProps) {
  const params = useParams<{ 'tenant-id': string }>();
  const tenantId = params['tenant-id'] ?? '';

  const [showHolders, setShowHolders] = useState(true);
  const [showContracts, setShowContracts] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { visibleNodes, visibleEdges } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const allowedTypes = new Set<GraphNodeType>([
      'HOLDING',
      'COMPANY',
      'BRAND',
    ]);
    if (showHolders) allowedTypes.add('HOLDER');
    if (showContracts) allowedTypes.add('CONTRACT');
    if (showAlerts) allowedTypes.add('ALERT');

    const filteredDomain = nodes.filter((n) => {
      if (!allowedTypes.has(n.type)) return false;
      if (q && !n.label.toLowerCase().includes(q)) return false;
      return true;
    });

    const allowedIds = new Set(filteredDomain.map((n) => n.id));
    const flowNodes = layoutNodes(filteredDomain);
    const filteredEdges = edges.filter(
      (e) => allowedIds.has(e.source) && allowedIds.has(e.target)
    );
    return {
      visibleNodes: flowNodes,
      visibleEdges: toFlowEdges(filteredEdges),
    };
  }, [nodes, edges, showHolders, showContracts, showAlerts, search]);

  const onNodeClick: NodeMouseHandler<Node<NodeData>> = (_evt, node) => {
    setSelected({
      id: node.id,
      type: node.data.type,
      label: node.data.label,
      status: node.data.status,
      metadata: node.data.metadata,
      entityId: entityIdFrom(node.id),
    });
    setSheetOpen(true);
  };

  return (
    <div className="flex h-[70vh] w-full flex-col overflow-hidden rounded-xl border" style={{ borderColor: '#E2DED6', background: '#FBF6EC' }}>
      <GraphToolbar
        showHolders={showHolders}
        showContracts={showContracts}
        showAlerts={showAlerts}
        onToggleHolders={setShowHolders}
        onToggleContracts={setShowContracts}
        onToggleAlerts={setShowAlerts}
        search={search}
        onSearch={setSearch}
      />
      <div className="relative flex-1">
        {nodes.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(251,246,236,0.85)' }}>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: '#355B6F' }}>
                Sin nodos para mostrar
              </p>
              <p className="mt-1 text-xs" style={{ color: '#C8C4B9' }}>
                Registra holdings, empresas o marcas para construir el grafo.
              </p>
            </div>
          </div>
        )}
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          nodesDraggable={false}
          fitView
          proOptions={{ hideAttribution: true }}
          onNodeClick={onNodeClick}
          minZoom={0.1}
        >
          <Background gap={16} color="#E2DED6" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>
      <NodeDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        node={selected}
        tenantId={tenantId}
      />
    </div>
  );
}

export function TenantGraph(props: TenantGraphProps) {
  return (
    <ReactFlowProvider>
      <TenantGraphInner {...props} />
    </ReactFlowProvider>
  );
}
