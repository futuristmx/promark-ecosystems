'use client';

import { useMemo } from 'react';
import { BRAND_STATUS_LABELS } from '@/lib/i18n/status-labels';

/**
 * MonolithicStructure
 * ─────────────────────
 * Visualización SVG isométrica del corporativo del cliente.
 * Tres bloques apilados (Holding → Empresas → Titulares + Marcas)
 * con líneas guía laterales numeradas (01-04), inspirado en
 * planos arquitectónicos / monolíticos de bloques apilados.
 *
 * Colores derivados del `primary_color` del tenant (cfg.branding):
 *  - Top  face: lighten 20%
 *  - Front face: base
 *  - Right face: darken 25%
 *  - Edges:    darken 40%
 */

// ────────────────────────────────────────────────────────────────
// Helpers de color
// ────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(safe, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * shadeColor — aclara (% > 0) u oscurece (% < 0) un hex.
 * percent en rango [-100, 100].
 */
export function shadeColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = percent / 100;
  if (factor >= 0) {
    return rgbToHex(
      r + (255 - r) * factor,
      g + (255 - g) * factor,
      b + (255 - b) * factor,
    );
  }
  const f = 1 + factor;
  return rgbToHex(r * f, g * f, b * f);
}

// ────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────

export interface MonolithicStructureProps {
  primaryColor: string;
  holding: { id: string; name: string };
  companies: Array<{ id: string; name: string; brandCount: number }>;
  holdersCount: number;
  brandsCount: number;
  brandsByStatus: Array<{ status: string; count: number }>;
}

// ────────────────────────────────────────────────────────────────
// Geometría isométrica
// ────────────────────────────────────────────────────────────────

interface CuboidProps {
  /** Centro X (cara frontal, esquina inferior izq.) */
  x: number;
  /** Esquina inferior frontal Y */
  y: number;
  width: number;
  height: number;
  /** profundidad isométrica (shift x,y) */
  depth: number;
  base: string;
  stroke: string;
  /** opcional: opacidad global del bloque */
  opacity?: number;
}

function Cuboid({ x, y, width, height, depth, base, stroke, opacity = 1 }: CuboidProps) {
  // Cara frontal: rectángulo (x, y-height) .. (x+width, y)
  // Cara superior: paralelogramo
  // Cara derecha: paralelogramo
  const dx = depth;
  const dy = -depth * 0.55; // ángulo isométrico suave

  const top = [
    [x, y - height],
    [x + width, y - height],
    [x + width + dx, y - height + dy],
    [x + dx, y - height + dy],
  ];
  const right = [
    [x + width, y - height],
    [x + width + dx, y - height + dy],
    [x + width + dx, y + dy],
    [x + width, y],
  ];
  const front = [
    [x, y - height],
    [x + width, y - height],
    [x + width, y],
    [x, y],
  ];

  const toPath = (pts: number[][]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') + ' Z';

  const topColor = shadeColor(base, 20);
  const rightColor = shadeColor(base, -25);

  return (
    <g opacity={opacity}>
      <path d={toPath(top)} fill={topColor} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
      <path d={toPath(right)} fill={rightColor} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
      <path d={toPath(front)} fill={base} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  );
}

// ────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────

const VB_W = 720;
const VB_H = 640;

export function MonolithicStructure({
  primaryColor,
  holding,
  companies,
  holdersCount,
  brandsCount,
  brandsByStatus,
}: MonolithicStructureProps) {
  const base = primaryColor || '#0F2E3D';
  const stroke = useMemo(() => shadeColor(base, -40), [base]);

  // Layout: tres niveles apilados, centrados horizontalmente.
  // Base block (más ancho) → middle (companies) → top (holding, más angosto).
  const centerX = 240; // dentro del viewBox SVG
  const depth = 56;

  // Bottom: titulares + marcas
  const bottomW = 360;
  const bottomH = 110;
  const bottomY = 540; // baseline inferior

  // Middle: empresas — agrupadas como múltiples cuboides verticales
  const numCompanies = Math.max(1, companies.length);
  const middleH = 140;
  const middleY = bottomY - bottomH - 14;
  const middleW = 300;
  // Sub-blocks horizontales para visualizar cada empresa dentro del bloque medio.
  const subGap = 6;
  const subW = (middleW - subGap * (numCompanies - 1)) / numCompanies;

  // Top: holding
  const topW = 240;
  const topH = 100;
  const topY = middleY - middleH - 14;

  // Posiciones X centradas
  const bottomX = centerX - bottomW / 2;
  const middleX = centerX - middleW / 2;
  const topX = centerX - topW / 2;

  // Líneas guía hacia el lado derecho
  const guideX = 520;
  const labelX = guideX + 18;

  // Para etiqueta de empresas, mostrar hasta 3 nombres
  const companyPreview = companies.slice(0, 3).map((c) => c.name);
  const remainingCompanies = Math.max(0, companies.length - companyPreview.length);
  const totalBrandsInCompanies = companies.reduce((acc, c) => acc + c.brandCount, 0);

  // Resolver el centro vertical de cada bloque para conectar línea guía
  const guideHoldingY = topY - topH / 2;
  const guideCompaniesY = middleY - middleH / 2;
  const guideHoldersY = bottomY - bottomH * 0.7;
  const guideBrandsY = bottomY - bottomH * 0.25;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full max-w-[720px]"
        role="img"
        aria-label={`Estructura monolítica de ${holding.name}`}
      >
        {/* Fondo sutil — radial cálido marfil */}
        <defs>
          <radialGradient id="mono-bg" cx="35%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#FBF6EC" stopOpacity="1" />
            <stop offset="100%" stopColor="#F1EDE3" stopOpacity="1" />
          </radialGradient>
          <filter id="mono-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor={stroke} floodOpacity="0.18" />
          </filter>
        </defs>

        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#mono-bg)" rx="20" />

        {/* Suelo isométrico — sombra suave bajo el bloque base */}
        <ellipse
          cx={centerX + depth * 0.4}
          cy={bottomY + 22}
          rx={bottomW * 0.62}
          ry={14}
          fill={shadeColor(base, -50)}
          opacity={0.12}
        />

        {/* Bloque inferior — Titulares + Marcas */}
        <g filter="url(#mono-shadow)">
          <Cuboid
            x={bottomX}
            y={bottomY}
            width={bottomW}
            height={bottomH}
            depth={depth}
            base={shadeColor(base, -8)}
            stroke={stroke}
          />
        </g>

        {/* Bloque medio — Empresas (sub-cuboides) */}
        <g filter="url(#mono-shadow)">
          {Array.from({ length: numCompanies }).map((_, i) => {
            const sx = middleX + i * (subW + subGap);
            return (
              <Cuboid
                key={i}
                x={sx}
                y={middleY}
                width={subW}
                height={middleH}
                depth={depth}
                base={base}
                stroke={stroke}
              />
            );
          })}
        </g>

        {/* Bloque superior — Holding */}
        <g filter="url(#mono-shadow)">
          <Cuboid
            x={topX}
            y={topY}
            width={topW}
            height={topH}
            depth={depth}
            base={shadeColor(base, 10)}
            stroke={stroke}
          />
        </g>

        {/* Líneas guía + numeración + labels */}
        <g
          fontFamily='"Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
          fill="#0F2E3D"
        >
          {/* 01 — HOLDING */}
          <line
            x1={topX + topW + depth + 4}
            y1={guideHoldingY + (-depth * 0.55) / 2}
            x2={guideX}
            y2={guideHoldingY + (-depth * 0.55) / 2}
            stroke="#355B6F"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x={labelX} y={guideHoldingY - 12} fontSize="11" fill="#355B6F" letterSpacing="2">
            01
          </text>
          <text x={labelX} y={guideHoldingY + 4} fontSize="10" fill="#355B6F" letterSpacing="1.2">
            HOLDING
          </text>
          <text x={labelX} y={guideHoldingY + 20} fontSize="13" fontWeight="600" fill="#0F2E3D">
            {truncate(holding.name, 28)}
          </text>
          <text x={labelX} y={guideHoldingY + 36} fontSize="10" fill="#355B6F">
            {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'}
          </text>

          {/* 02 — EMPRESAS */}
          <line
            x1={middleX + middleW + depth + 4}
            y1={guideCompaniesY + (-depth * 0.55) / 2}
            x2={guideX}
            y2={guideCompaniesY + (-depth * 0.55) / 2}
            stroke="#355B6F"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x={labelX} y={guideCompaniesY - 12} fontSize="11" fill="#355B6F" letterSpacing="2">
            02
          </text>
          <text x={labelX} y={guideCompaniesY + 4} fontSize="10" fill="#355B6F" letterSpacing="1.2">
            EMPRESAS
          </text>
          {companyPreview.map((name, i) => (
            <text
              key={i}
              x={labelX}
              y={guideCompaniesY + 20 + i * 14}
              fontSize="11"
              fontWeight="500"
              fill="#0F2E3D"
            >
              {truncate(name, 28)}
            </text>
          ))}
          {remainingCompanies > 0 && (
            <text
              x={labelX}
              y={guideCompaniesY + 20 + companyPreview.length * 14}
              fontSize="10"
              fill="#355B6F"
              fontStyle="italic"
            >
              + {remainingCompanies} más
            </text>
          )}
          <text
            x={labelX}
            y={guideCompaniesY + 20 + (companyPreview.length + (remainingCompanies > 0 ? 1 : 0)) * 14 + 4}
            fontSize="10"
            fill="#355B6F"
          >
            {totalBrandsInCompanies} {totalBrandsInCompanies === 1 ? 'marca' : 'marcas'} en empresas
          </text>

          {/* 03 — TITULARES */}
          <line
            x1={bottomX + bottomW + depth + 4}
            y1={guideHoldersY}
            x2={guideX}
            y2={guideHoldersY}
            stroke="#355B6F"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x={labelX} y={guideHoldersY - 10} fontSize="11" fill="#355B6F" letterSpacing="2">
            03
          </text>
          <text x={labelX} y={guideHoldersY + 4} fontSize="10" fill="#355B6F" letterSpacing="1.2">
            TITULARES
          </text>
          <text x={labelX} y={guideHoldersY + 20} fontSize="13" fontWeight="600" fill="#0F2E3D">
            {holdersCount} {holdersCount === 1 ? 'titular' : 'titulares'}
          </text>

          {/* 04 — MARCAS */}
          <line
            x1={bottomX + bottomW + depth + 4}
            y1={guideBrandsY}
            x2={guideX}
            y2={guideBrandsY}
            stroke="#D39A2B"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <text x={labelX} y={guideBrandsY - 10} fontSize="11" fill="#D39A2B" letterSpacing="2">
            04
          </text>
          <text x={labelX} y={guideBrandsY + 4} fontSize="10" fill="#355B6F" letterSpacing="1.2">
            MARCAS
          </text>
          <text x={labelX} y={guideBrandsY + 20} fontSize="13" fontWeight="600" fill="#0F2E3D">
            {brandsCount} {brandsCount === 1 ? 'marca' : 'marcas'}
          </text>
          {brandsByStatus.slice(0, 3).map((s, i) => (
            <text
              key={s.status}
              x={labelX}
              y={guideBrandsY + 36 + i * 12}
              fontSize="10"
              fill="#355B6F"
            >
              <tspan fontWeight="600">{s.count}</tspan> {BRAND_STATUS_LABELS[s.status] ?? s.status}
            </text>
          ))}
        </g>

        {/* Etiqueta superior sobre el bloque holding */}
        <g fontFamily='"Inter", system-ui, sans-serif'>
          <text
            x={topX + topW / 2 + depth / 2}
            y={topY - topH - 14}
            textAnchor="middle"
            fontSize="10"
            letterSpacing="2"
            fill="#355B6F"
          >
            ESTRUCTURA CORPORATIVA
          </text>
        </g>
      </svg>
    </div>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + '…';
}
