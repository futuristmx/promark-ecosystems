'use client';

import { useMemo, useState } from 'react';

export interface SankeyDatum {
  source: string;
  target: string;
  value: number;
  sourceType: 'tenant' | 'status' | 'class';
  targetType: 'tenant' | 'status' | 'class';
}

interface PortfolioSankeyProps {
  data: SankeyDatum[];
  title?: string;
}

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: '#0F2E3D',
  EXPIRED: '#B42318',
  ABANDONED: '#C8C4B9',
  IN_PROGRESS: '#355B6F',
  RENEWED: '#2F6B4F',
  APPLIED: '#8FB6C7',
  PUBLISHED: '#355B6F',
  CANCELLED: '#C8C4B9',
  OPPOSED: '#D39A2B',
  IN_LITIGATION: '#0B1F2A',
};

const STATUS_LABELS_ES: Record<string, string> = {
  APPLIED: 'Solicitada',
  PUBLISHED: 'Publicada',
  REGISTERED: 'Registrada',
  RENEWED: 'Renovada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  OPPOSED: 'Opuesta',
  IN_LITIGATION: 'En litigio',
  IN_PROGRESS: 'En trámite',
  ABANDONED: 'Abandonada',
};

const COL_WIDTH = 14;
const NODE_GAP = 6;
const WIDTH = 880;
const HEIGHT = 460;
const PADDING_X = 12;
const PADDING_Y = 16;
const LABEL_OFFSET = 6;

interface LayoutNode {
  id: string;
  label: string;
  type: 'tenant' | 'status' | 'class';
  total: number;
  x: number;
  y: number;
  height: number;
  color: string;
}

interface LayoutLink {
  id: string;
  source: LayoutNode;
  target: LayoutNode;
  value: number;
  sourceY: number;
  targetY: number;
  thickness: number;
  color: string;
}

function getStatusColor(statusKey: string): string {
  return STATUS_COLORS[statusKey] ?? '#355B6F';
}

function getStatusLabel(statusKey: string): string {
  return STATUS_LABELS_ES[statusKey] ?? statusKey;
}

export function PortfolioSankey({
  data,
  title = 'Flujo del portafolio: clientes → estatus → clases IMPI',
}: PortfolioSankeyProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const { nodes, links } = useMemo(() => {
    // Collect totals
    const tenantTotals = new Map<string, number>();
    const statusTotals = new Map<string, number>();
    const classTotals = new Map<string, number>();

    for (const d of data) {
      if (d.sourceType === 'tenant') tenantTotals.set(d.source, (tenantTotals.get(d.source) ?? 0) + d.value);
      if (d.sourceType === 'status') statusTotals.set(d.source, (statusTotals.get(d.source) ?? 0) + d.value);
      if (d.targetType === 'status') statusTotals.set(d.target, (statusTotals.get(d.target) ?? 0) + d.value);
      if (d.targetType === 'class') classTotals.set(d.target, (classTotals.get(d.target) ?? 0) + d.value);
    }

    const columns: Array<{
      type: 'tenant' | 'status' | 'class';
      x: number;
      entries: Array<{ id: string; label: string; total: number; color: string }>;
    }> = [
      {
        type: 'tenant',
        x: PADDING_X,
        entries: Array.from(tenantTotals.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([id, total]) => ({
            id,
            label: id,
            total,
            color: '#1C3F55',
          })),
      },
      {
        type: 'status',
        x: WIDTH / 2 - COL_WIDTH / 2,
        entries: Array.from(statusTotals.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([id, total]) => ({
            id,
            label: getStatusLabel(id),
            total,
            color: getStatusColor(id),
          })),
      },
      {
        type: 'class',
        x: WIDTH - PADDING_X - COL_WIDTH,
        entries: Array.from(classTotals.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([id, total]) => ({
            id,
            label: id,
            total,
            color: '#355B6F',
          })),
      },
    ];

    const nodes: LayoutNode[] = [];
    const nodeIndex = new Map<string, LayoutNode>();

    for (const col of columns) {
      const total = col.entries.reduce((s, e) => s + e.total, 0);
      const availableHeight = HEIGHT - PADDING_Y * 2 - NODE_GAP * Math.max(0, col.entries.length - 1);
      let cursorY = PADDING_Y;
      for (const entry of col.entries) {
        const h = total > 0 ? Math.max(8, (entry.total / total) * availableHeight) : 0;
        const node: LayoutNode = {
          id: `${col.type}:${entry.id}`,
          label: entry.label,
          type: col.type,
          total: entry.total,
          x: col.x,
          y: cursorY,
          height: h,
          color: entry.color,
        };
        nodes.push(node);
        nodeIndex.set(node.id, node);
        cursorY += h + NODE_GAP;
      }
    }

    // Build links. Track cursor per node (source side and target side).
    const sourceCursor = new Map<string, number>();
    const targetCursor = new Map<string, number>();

    const tenantToStatus = data.filter(d => d.sourceType === 'tenant' && d.targetType === 'status');
    const statusToClass = data.filter(d => d.sourceType === 'status' && d.targetType === 'class');

    const links: LayoutLink[] = [];

    function pushLink(
      sourceKey: string,
      targetKey: string,
      value: number,
      side: 'left' | 'right',
    ) {
      const source = nodeIndex.get(sourceKey);
      const target = nodeIndex.get(targetKey);
      if (!source || !target || value <= 0) return;
      const sourceHFraction = source.total > 0 ? (value / source.total) * source.height : 0;
      const targetHFraction = target.total > 0 ? (value / target.total) * target.height : 0;
      const sStart = sourceCursor.get(source.id) ?? source.y;
      const tStart = targetCursor.get(target.id) ?? target.y;
      const sourceY = sStart + sourceHFraction / 2;
      const targetY = tStart + targetHFraction / 2;
      sourceCursor.set(source.id, sStart + sourceHFraction);
      targetCursor.set(target.id, tStart + targetHFraction);
      links.push({
        id: `${side}:${sourceKey}->${targetKey}`,
        source,
        target,
        value,
        sourceY,
        targetY,
        thickness: Math.max(1, Math.min(sourceHFraction, targetHFraction)),
        color: target.color,
      });
    }

    // Sort links by source then target order for stable stacking
    tenantToStatus
      .sort((a, b) => b.value - a.value)
      .forEach(d => pushLink(`tenant:${d.source}`, `status:${d.target}`, d.value, 'left'));

    statusToClass
      .sort((a, b) => b.value - a.value)
      .forEach(d => {
        // only include if target is one of the top-8 classes (exists as node)
        if (nodeIndex.has(`class:${d.target}`)) {
          pushLink(`status:${d.source}`, `class:${d.target}`, d.value, 'right');
        }
      });

    return { nodes, links };
  }, [data]);

  function isHighlighted(targetKind: 'node' | 'link', id: string, node?: LayoutNode, link?: LayoutLink): boolean {
    if (!hovered) return true;
    if (targetKind === 'node' && id === hovered) return true;
    if (targetKind === 'link' && link) {
      if (hovered === link.source.id || hovered === link.target.id) return true;
      if (hovered === link.id) return true;
    }
    if (targetKind === 'node' && node) {
      // node is connected if any link involves it and the hovered id
      const connected = links.some(l => {
        if (l.source.id !== node.id && l.target.id !== node.id) return false;
        return l.source.id === hovered || l.target.id === hovered || l.id === hovered;
      });
      if (connected) return true;
    }
    return false;
  }

  if (data.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
          {title}
        </h3>
        <div
          className="flex h-72 items-center justify-center rounded-lg text-sm"
          style={{ background: '#FBF6EC', color: '#8FB6C7', border: '1px dashed #E2DED6' }}
        >
          Aún no hay marcas suficientes para visualizar el flujo del portafolio.
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#355B6F' }}>
        {title}
      </h3>
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT + 40}`}
          width="100%"
          style={{ display: 'block', minWidth: 640 }}
        >
          {/* Column headers */}
          <g style={{ fontFamily: 'var(--font-manrope, Manrope, sans-serif)' }}>
            <text x={PADDING_X} y={HEIGHT + 22} fontSize={10} fontWeight={700} fill="#355B6F" style={{ letterSpacing: '0.08em' }}>
              CLIENTE
            </text>
            <text x={WIDTH / 2} y={HEIGHT + 22} fontSize={10} fontWeight={700} fill="#355B6F" textAnchor="middle" style={{ letterSpacing: '0.08em' }}>
              ESTATUS LEGAL
            </text>
            <text x={WIDTH - PADDING_X} y={HEIGHT + 22} fontSize={10} fontWeight={700} fill="#355B6F" textAnchor="end" style={{ letterSpacing: '0.08em' }}>
              CLASE IMPI (TOP 8)
            </text>
          </g>

          {/* Links */}
          <g>
            {links.map(link => {
              const x0 = link.source.x + COL_WIDTH;
              const x1 = link.target.x;
              const cx = (x0 + x1) / 2;
              const path = `M${x0},${link.sourceY} C${cx},${link.sourceY} ${cx},${link.targetY} ${x1},${link.targetY}`;
              const highlighted = isHighlighted('link', link.id, undefined, link);
              return (
                <path
                  key={link.id}
                  d={path}
                  fill="none"
                  stroke={link.color}
                  strokeOpacity={highlighted ? 0.45 : 0.08}
                  strokeWidth={link.thickness}
                  style={{ transition: 'stroke-opacity 160ms ease', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    setHovered(link.id);
                    setTooltip({
                      x: e.nativeEvent.offsetX,
                      y: e.nativeEvent.offsetY,
                      label: `${link.source.label} → ${link.target.label}`,
                      value: link.value,
                    });
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                    setTooltip(null);
                  }}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map(node => {
              const highlighted = isHighlighted('node', node.id, node);
              const opacity = highlighted ? 1 : 0.25;
              const labelAnchor =
                node.type === 'tenant' ? 'start' : node.type === 'class' ? 'end' : 'middle';
              const labelX =
                node.type === 'tenant'
                  ? node.x + COL_WIDTH + LABEL_OFFSET
                  : node.type === 'class'
                    ? node.x - LABEL_OFFSET
                    : node.x + COL_WIDTH / 2;
              const labelY = node.y + node.height / 2 + 3;
              const labelDy = node.type === 'status' ? -node.height / 2 - 4 : 0;

              return (
                <g
                  key={node.id}
                  onMouseEnter={(e) => {
                    setHovered(node.id);
                    setTooltip({
                      x: e.nativeEvent.offsetX,
                      y: e.nativeEvent.offsetY,
                      label: node.label,
                      value: node.total,
                    });
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                    setTooltip(null);
                  }}
                  style={{ cursor: 'pointer', transition: 'opacity 160ms ease' }}
                  opacity={opacity}
                >
                  <rect
                    x={node.x}
                    y={node.y}
                    width={COL_WIDTH}
                    height={node.height}
                    rx={3}
                    fill={node.color}
                  />
                  {node.height >= 10 && (
                    <text
                      x={labelX}
                      y={labelY}
                      dy={labelDy}
                      fontSize={10}
                      fontWeight={600}
                      fill="#0F2E3D"
                      textAnchor={labelAnchor}
                      style={{ fontFamily: 'var(--font-manrope, Manrope, sans-serif)' }}
                    >
                      {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 rounded-md px-3 py-1.5 text-xs font-medium shadow-lg"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y + 12,
              background: '#0B1F2A',
              color: '#FBF6EC',
              fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
            }}
          >
            <div>{tooltip.label}</div>
            <div style={{ color: '#8FB6C7' }}>{tooltip.value.toLocaleString('es-MX')} marca(s)</div>
          </div>
        )}
      </div>
    </div>
  );
}
